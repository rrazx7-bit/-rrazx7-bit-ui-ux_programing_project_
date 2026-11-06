const { test, expect } = require('@playwright/test');

function controls(page) {
  const nav = page.locator('#main-nav');
  const toggle = page.locator('#menu-toggle');
  async function expectPosition(id) {
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(nav.locator('a[aria-current]')).toHaveCount(1);
    await expect(nav.locator('a.is-current')).toHaveCount(1);
    const current = nav.locator(`a[href="#${id}"]`);
    await expect(current).toHaveAttribute('aria-current', 'location');
    await expect(current).toHaveClass(/\bis-current\b/);
    await expect(page.locator('#nav-location')).toHaveText(await current.textContent());
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
  async function openMenu() {
    if (await toggle.isVisible() && !await nav.isVisible()) await toggle.press('Enter');
    await expect(nav).toBeVisible();
  }
  async function select(id) {
    await openMenu();
    await nav.locator(`a[href="#${id}"]`).press('Enter');
    await expectPosition(id);
    await expect.poll(() => page.locator(`#${id}`).evaluate(el => el.contains(document.activeElement))).toBe(true);
    if (await toggle.isVisible()) {
      await expect(nav).toBeHidden();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toHaveText('메뉴 열기');
    }
  }
  return { nav, toggle, openMenu, select, expectPosition };
}

async function expectMenuLayout(page) {
  const overlap = await page.evaluate(() => {
    const elements = [...document.querySelectorAll('#main-nav a, #menu-toggle')].filter(el => el.getClientRects().length);
    const boxes = elements.map(el => el.getBoundingClientRect());
    const collisions = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (Math.min(a.right, b.right) > Math.max(a.left, b.left) + 1 &&
            Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 1) {
          collisions.push([elements[i].textContent.trim(), elements[j].textContent.trim()]);
        }
      }
    }
    return { collisions, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  });
  expect(overlap).toEqual({ collisions: [], overflow: false });
}

test('메뉴: 목적지, 키보드, 방문 기록과 화면 너비 전환', async ({ page }, testInfo) => {
  const width = testInfo.project.use.viewport.width;
  const mobile = width <= 768;
  const { nav, toggle, openMenu, select, expectPosition } = controls(page);
  await page.goto('./');
  await expect(nav.locator('ul > li > a')).toHaveCount(7);
  await expect(nav.locator('[aria-current]')).toHaveCount(1);
  await expect(nav.locator('a[href="#about"]')).toHaveAttribute('aria-current', 'location');
  await expect(toggle).toHaveAttribute('aria-controls', 'main-nav');
  if (mobile) {
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText('메뉴 열기');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await page.locator('#navigation-bar').screenshot({ path: testInfo.outputPath(`menu-closed-${width}.png`) });
    await openMenu();
    await expect(toggle).toHaveText('메뉴 닫기');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.focus();
    await page.keyboard.press('Tab');
    await expect(nav.locator('a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveText('메뉴 열기');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // 닫기 버튼으로도 같은 상태에 돌아오는지 확인합니다.
    await openMenu();
    await toggle.click();
    await expect(nav).toBeHidden();
  } else {
    await expect(toggle).toBeHidden();
    await expect(nav).toBeVisible();
  }
  await openMenu();
  await expectMenuLayout(page);
  await page.locator('#navigation-bar').screenshot({ path: testInfo.outputPath(`menu-links-${width}.png`) });

  await select('plan-flow');
  await expect(page.locator('.plan-step[data-step="1"]')).toBeVisible();
  const title = page.locator('#plan-title');
  await title.fill('팀 발표 자료 모으기');
  await select('my-tasks');
  await page.goBack();
  await expectPosition('plan-flow');
  await expect(title).toHaveValue('팀 발표 자료 모으기');
  await page.goForward();
  await expectPosition('my-tasks');
  await page.reload();
  await expectPosition('my-tasks');
  await select('plan-flow');
  await page.reload();
  await expectPosition('plan-flow');
  await expect(title).toHaveValue('');

  // 제목에 초점이 있는 상태에서 실제로 스크롤하면 주소와 강조만 바뀝니다.
  await select('features');
  const historyLength = await page.evaluate(() => history.length);
  await page.keyboard.press('End');
  await expectPosition('signup');
  expect(await page.evaluate(() => history.length)).toBe(historyLength);

  // 임계값을 양방향으로 넘겨도 데스크톱 메뉴는 보이고 모바일은 닫힌 상태로 돌아옵니다.
  await page.setViewportSize({ width: 769, height: 900 });
  await expect(nav).toBeVisible();
  await expect(toggle).toBeHidden();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(toggle).toBeVisible();
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await openMenu();
  await page.setViewportSize({ width: 769, height: 900 });
  await expect(nav).toBeVisible();
  await expect(toggle).toBeHidden();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveText('메뉴 열기');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('메뉴에서 계획을 작성하고 저장한 과제를 상태별로 찾기', async ({ page }, testInfo) => {
  const width = testInfo.project.use.viewport.width;
  const { select, expectPosition } = controls(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const section = page.locator('#my-tasks');
  const filter = value => section.locator(`button[data-filter="${value}"]`);
  const cards = section.locator('#saved-task-list .saved-task-card');
  async function expectFilter(value, titles) {
    await expect(section.locator('button[data-filter][aria-pressed="true"]')).toHaveCount(1);
    await expect(section.locator('button[data-filter][aria-pressed="false"]')).toHaveCount(2);
    await expect(filter(value)).toHaveAttribute('aria-pressed', 'true');
    await expect(cards.locator('.saved-task-title')).toHaveText(titles);
    await expect(section.locator('#saved-result')).toContainText(`${titles.length}개`);
  }
  await page.goto('./');
  await select('my-tasks');
  await expectFilter('all', []);
  const initialEmpty = await section.locator('#saved-empty-title').innerText();
  await expect(section.locator('#saved-first-plan')).toBeVisible();
  await expect(section.locator('#saved-show-all')).toBeHidden();
  await select('plan-flow');
  const title = '정보 구조 정리';
  await page.locator('#plan-title').fill(title);
  await page.locator('#plan-course').fill('서비스 기획');
  await page.locator('#plan-next-details').click();
  await page.locator('#plan-deadline-mode').selectOption('none');
  await page.locator('#plan-next-options').click();
  await page.locator('#plan-finish').click();
  await page.locator('#plan-confirm-submit').click();
  await page.locator('#plan-save-button').click();
  await expect(page.locator('#plan-save-message')).toHaveText('내 과제 목록에 추가했어요.');
  await page.locator('#plan-view-list').click();
  await expectPosition('my-tasks');
  await expectFilter('all', [title]);
  await filter('active').press('Space');
  await expectFilter('active', [title]);
  await filter('done').press('Enter');
  await expectFilter('done', []);
  await expect(section.locator('#saved-empty-title')).not.toHaveText(initialEmpty);
  await expect(section.locator('#saved-first-plan')).toBeHidden();
  await expect(section.locator('#saved-show-all')).toBeVisible();
  await section.screenshot({ path: testInfo.outputPath(`filter-no-match-${width}.png`) });
  await section.locator('#saved-show-all').click();
  await expectFilter('all', [title]);
  await cards.getByRole('button', { name: `과제 열기: ${title}`, exact: true }).click();
  await expect(section.locator('#saved-detail-course')).toHaveText('서비스 기획');
  await section.locator('#saved-toggle-status').click();
  await section.locator('#saved-close').click();
  await filter('done').click();
  await expectFilter('done', [title]);
  await expect(cards.locator('.saved-status')).toHaveText('완료');
  await section.screenshot({ path: testInfo.outputPath(`filter-complete-${width}.png`) });
  expect(errors).toEqual([]);
});
