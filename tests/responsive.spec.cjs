const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test('메뉴, 카드, 입력 영역의 반응형 배치와 조작', async ({ page }, testInfo) => {
  const width = testInfo.project.use.viewport.width;
  const mobile = width <= 768;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  const response = await page.goto('./', { waitUntil: 'networkidle' });
  expect(response.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  const image = page.locator('.service-preview img');
  await expect(image).toBeVisible();
  expect(await image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);

  // 배포된 페이지가 이전 CSS를 사용하고 있지 않은지도 확인합니다.
  const cssHref = await page.locator('link[rel="stylesheet"]').getAttribute('href');
  const cssResponse = await page.request.get(new URL(cssHref, page.url()).href);
  expect(cssResponse.status()).toBe(200);
  expect(await cssResponse.text()).toBe(fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8'));

  const layout = await page.evaluate(() => {
    const rect = element => {
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const get = selector => document.querySelector(selector);
    const list = selector => [...document.querySelectorAll(selector)].map(rect);
    const visible = element => {
      const s = getComputedStyle(element);
      return s.display !== 'none' && s.visibility !== 'hidden' && element.getClientRects().length;
    };
    const contentWidth = document.documentElement.clientWidth;
    const overflow = [...document.body.querySelectorAll('*')]
      .filter(element => !element.matches('.skip-link') && visible(element))
      .filter(element => {
        const r = element.getBoundingClientRect();
        return r.left < -1 || r.right > contentWidth + 1;
      }).map(element => element.className || element.tagName);
    const clippedText = [...document.querySelectorAll('h1, h2, h3, p, a, label, figcaption, button')]
      .filter(element => !element.matches('.skip-link') && visible(element))
      .filter(element => element.scrollWidth > element.clientWidth + 1 && getComputedStyle(element).display !== 'inline')
      .map(element => element.textContent.trim());
    const cards = list('.feature-card');
    return {
      viewport: innerWidth,
      contentWidth,
      scrollWidth: document.documentElement.scrollWidth,
      mobileQuery: matchMedia('(max-width: 768px)').matches,
      grid: getComputedStyle(get('.feature-list')).display,
      cards,
      nav: list('.site-nav a'),
      navDirection: getComputedStyle(get('.site-nav ul')).flexDirection,
      formDirection: getComputedStyle(get('.signup-form')).flexDirection,
      form: rect(get('.signup-form')),
      input: rect(get('#email')),
      button: rect(get('button')),
      titleSize: getComputedStyle(get('h1')).fontSize,
      image: rect(get('.service-preview img')),
      sections: list('main > section'),
      overflow,
      clippedText
    };
  });

  await testInfo.attach('layout.json', { body: JSON.stringify(layout, null, 2), contentType: 'application/json' });
  await page.screenshot({ path: testInfo.outputPath(`page-${width}.png`), fullPage: true });

  expect(layout.viewport).toBe(width);
  expect(layout.mobileQuery).toBe(mobile);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.contentWidth);
  expect(layout.overflow).toEqual([]);
  expect(layout.clippedText).toEqual([]);
  expect(layout.grid).toBe('grid');
  expect(layout.cards).toHaveLength(3);
  const firstRow = layout.cards.filter(card => Math.abs(card.y - layout.cards[0].y) < 1);
  expect(firstRow).toHaveLength(mobile ? 1 : width === 1100 ? 3 : 2);
  for (const card of layout.cards) {
    expect(Math.abs(card.width - layout.cards[0].width)).toBeLessThan(1);
  }
  for (let i = 1; i < layout.sections.length; i++) {
    expect(layout.sections[i].y).toBeGreaterThanOrEqual(layout.sections[i - 1].bottom);
  }
  for (let i = 0; i < layout.cards.length; i++) {
    for (let j = i + 1; j < layout.cards.length; j++) {
      const a = layout.cards[i], b = layout.cards[j];
      const overlapX = Math.min(a.right, b.right) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
      expect(overlapX > 1 && overlapY > 1).toBe(false);
    }
  }
  expect(layout.button.height).toBeGreaterThanOrEqual(48);
  expect(Math.abs(layout.image.width / layout.image.height - 1.5)).toBeLessThan(0.02);
  expect(layout.navDirection).toBe(mobile ? 'column' : 'row');
  expect(layout.formDirection).toBe(mobile ? 'column' : 'row');
  expect(layout.titleSize).toBe(mobile ? '36px' : '60px');
  if (mobile) {
    for (let i = 1; i < layout.nav.length; i++) {
      expect(layout.nav[i].y).toBeGreaterThanOrEqual(layout.nav[i - 1].bottom);
      expect(Math.abs(layout.nav[i].width - layout.nav[0].width)).toBeLessThan(1);
    }
    expect(layout.button.y).toBeGreaterThanOrEqual(layout.input.bottom);
    expect(Math.abs(layout.input.width - layout.form.width)).toBeLessThan(1);
    expect(Math.abs(layout.button.width - layout.form.width)).toBeLessThan(1);
  } else {
    expect(layout.button.x).toBeGreaterThan(layout.input.right);
    expect(Math.abs(layout.input.bottom - layout.button.bottom)).toBeLessThan(1);
  }

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '본문 바로가기', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);
  for (const [name, id] of [['서비스 소개', 'about'], ['주요 기능', 'features'], ['이용 방법', 'steps'], ['시작 알림 신청', 'signup']]) {
    await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
  }

  const email = page.getByLabel('이메일 주소', { exact: true });
  const button = page.getByRole('button', { name: '이메일 확인하기', exact: true });
  const formURL = page.url();
  await button.click();
  expect(await email.evaluate(input => input.validity.valueMissing)).toBe(true);
  await expect(email).toBeFocused();
  expect(page.url()).toBe(formURL);
  await email.fill('invalid-email');
  await button.click();
  expect(await email.evaluate(input => input.validity.typeMismatch)).toBe(true);
  expect(page.url()).toBe(formURL);
  await expect(email).toBeFocused();
  await email.fill('student@example.com');
  expect(await email.evaluate(input => input.validity.valid)).toBe(true);
  await email.press('Tab');
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS('outline-style', 'solid');
  // 형식만 점검하고 실제 신청이나 이메일 전송은 하지 않습니다.
  await email.fill('');
  await page.locator('#signup').screenshot({ path: testInfo.outputPath(`form-${width}.png`) });
  expect(errors).toEqual([]);
});
