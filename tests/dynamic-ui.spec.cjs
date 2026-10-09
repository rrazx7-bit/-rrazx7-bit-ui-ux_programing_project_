const { test, expect } = require('@playwright/test');

test('dynamic UI: tabs, live preview and completion controls', async ({ page }, testInfo) => {
  const width = testInfo.project.use.viewport.width;
  const mobile = width <= 768;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  const response = await page.goto('./', { waitUntil: 'networkidle' });
  expect(response.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);

  const section = page.locator('#tryout');
  const tablist = section.getByRole('tablist', { name: '과제 미리보기', exact: true });
  const tabs = tablist.getByRole('tab');
  const panels = section.locator('.feature-panel');
  const input = page.locator('#task-name');
  const count = page.locator('#task-count');
  const names = section.locator('.task-name-text');
  const preview = page.locator('#task-preview');
  const sample = page.locator('#sample-task-button');
  const complete = page.locator('#task-complete');
  const completionPreview = page.locator('#completion-preview');
  const message = page.locator('#completion-message');
  const reopen = page.locator('#reopen-task-button');
  const emptyName = '과제 이름을 입력해 주세요';
  const exampleName = '서비스 소개 페이지 정리';
  const progressMessage = '아직 진행 중이에요. 끝냈다면 완료로 표시해 주세요.';
  const emptyMessage = '먼저 과제 적기 탭에서 이름을 입력해 주세요.';
  const doneMessage = '완료했어요. 다음 할 일을 살펴보세요.';
  const keys = ['write', 'deadline', 'complete'];

  async function expectSelected(key) {
    await expect(tabs).toHaveCount(3);
    await expect(panels).toHaveCount(3);
    await expect(tablist.locator('[aria-selected="true"]')).toHaveCount(1);
    await expect(section.locator('.feature-panel.is-active')).toHaveCount(1);
    await expect(section.locator('.feature-panel:not([hidden])')).toHaveCount(1);
    for (const name of keys) {
      const tab = page.locator(`#tab-${name}`);
      const panel = page.locator(`#panel-${name}`);
      const selected = name === key;
      await expect(tab).toHaveAttribute('aria-controls', `panel-${name}`);
      await expect(tab).toHaveAttribute('data-target', `#panel-${name}`);
      await expect(tab).toHaveAttribute('aria-selected', String(selected));
      await expect(tab).toHaveAttribute('tabindex', selected ? '0' : '-1');
      await expect(panel).toHaveAttribute('role', 'tabpanel');
      await expect(panel).toHaveAttribute('aria-labelledby', `tab-${name}`);
      await expect(panel).toHaveAttribute('tabindex', '0');
      if (selected) {
        await expect(panel).toBeVisible();
        await expect(panel).toHaveClass(/is-active/);
      } else {
        await expect(panel).toBeHidden();
        await expect(panel).not.toHaveClass(/is-active/);
      }
    }
  }

  async function expectNames(value) {
    expect(await names.count()).toBeGreaterThan(1);
    for (const element of await names.all()) await expect(element).toHaveText(value);
  }

  async function expectNoOverflow() {
    const overflow = await section.evaluate(element => {
      const width = document.documentElement.clientWidth;
      const visible = node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
      return {
        document: document.documentElement.scrollWidth > width,
        elements: [...element.querySelectorAll('*')].filter(visible).filter(node => {
          const rect = node.getBoundingClientRect();
          return rect.left < -1 || rect.right > width + 1;
        }).map(node => node.id || node.className || node.tagName),
        text: [...element.querySelectorAll('h2, h3, p, button, label')].filter(visible)
          .filter(node => getComputedStyle(node).display !== 'inline' && node.scrollWidth > node.clientWidth + 1)
          .map(node => node.textContent.trim())
      };
    });
    expect(overflow).toEqual({ document: false, elements: [], text: [] });
  }

  await section.scrollIntoViewIfNeeded();
  await expect(tablist).toHaveAttribute('aria-orientation', mobile ? 'vertical' : 'horizontal');
  await expectSelected('write');
  await expect(input).toHaveValue('');
  await expect(input).toHaveAttribute('maxlength', '30');
  await expect(count).toHaveText('0 / 30자');
  await expectNames(emptyName);
  await expect(preview).not.toHaveClass(/has-title/);
  await expect(sample).toBeEnabled();
  await expect(sample).toHaveText('예시 넣기');
  await expect(complete).toBeDisabled();
  await expect(complete).not.toBeChecked();
  await expect(reopen).toBeDisabled();
  await expect(message).toHaveText(emptyMessage);

  const tabRects = await tabs.evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, height: rect.height };
  }));
  for (let index = 0; index < tabRects.length; index++) {
    expect(tabRects[index].height).toBeGreaterThanOrEqual(44);
    if (!index) continue;
    if (mobile) expect(tabRects[index].y).toBeGreaterThanOrEqual(tabRects[index - 1].bottom - 1);
    else {
      expect(Math.abs(tabRects[index].y - tabRects[0].y)).toBeLessThan(1);
      expect(tabRects[index].x).toBeGreaterThanOrEqual(tabRects[index - 1].right - 1);
    }
  }
  await expectNoOverflow();
  await section.screenshot({ path: testInfo.outputPath(`tryout-initial-${width}.png`) });

  // Selecting a tab changes the visible panel; keyboard navigation wraps and keeps focus on the selected tab.
  await page.locator('#tab-deadline').click();
  await expectSelected('deadline');
  await page.locator('#tab-complete').click();
  await expectSelected('complete');
  await page.locator('#tab-write').click();
  await expectSelected('write');
  const forward = mobile ? 'ArrowDown' : 'ArrowRight';
  const backward = mobile ? 'ArrowUp' : 'ArrowLeft';
  await page.keyboard.press(backward);
  await expectSelected('complete');
  await expect(page.locator('#tab-complete')).toBeFocused();
  await page.keyboard.press(forward);
  await expectSelected('write');
  await expect(page.locator('#tab-write')).toBeFocused();
  await page.keyboard.press(forward);
  await expectSelected('deadline');
  await expect(page.locator('#tab-deadline')).toBeFocused();
  await page.keyboard.press('End');
  await expectSelected('complete');
  await expect(page.locator('#tab-complete')).toBeFocused();
  await page.keyboard.press('Home');
  await expectSelected('write');
  await expect(page.locator('#tab-write')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#panel-write')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();

  await input.fill('  화면 구성 정리  ');
  await expectNames('화면 구성 정리');
  await expect(count).toHaveText('12 / 30자');
  await expect(preview).toHaveClass(/has-title/);
  await expect(complete).toBeEnabled();
  await expect(message).toHaveText(progressMessage);

  // Typing beyond maxlength and deleting exercise real input events, including the empty-state reset.
  await input.fill('');
  const longTitle = '한'.repeat(30);
  await input.pressSequentially(`${longTitle}끝`);
  await expect(input).toHaveValue(longTitle);
  await expect(count).toHaveText('30 / 30자');
  await expectNames(longTitle);
  await expectNoOverflow();
  await input.press('Control+A');
  await input.press('Backspace');
  await expect(input).toHaveValue('');
  await expect(count).toHaveText('0 / 30자');
  await expectNames(emptyName);
  await expect(preview).not.toHaveClass(/has-title/);
  await expect(complete).toBeDisabled();
  await input.fill('   ');
  await expectNames(emptyName);
  await expect(complete).toBeDisabled();

  const literalTitle = '<b>화면에 그대로 표시</b>';
  await input.fill(literalTitle);
  await expectNames(literalTitle);
  await expect(names.locator('b, img, script')).toHaveCount(0);

  await sample.click();
  await expect(input).toHaveValue(exampleName);
  await expectNames(exampleName);
  await expect(count).toHaveText(`${exampleName.length} / 30자`);
  await expect(sample).toHaveText('예시 적용됨');
  await expect(sample).toBeDisabled();
  await input.fill('직접 적은 과제');
  await expect(sample).toHaveText('예시 넣기');
  await expect(sample).toBeEnabled();
  await input.press('Tab');
  await expect(sample).toBeFocused();
  await sample.press('Space');
  await expect(input).toHaveValue(exampleName);
  await expect(sample).toBeDisabled();
  await expectNoOverflow();
  await section.screenshot({ path: testInfo.outputPath(`tryout-input-${width}.png`) });

  await page.locator('#tab-deadline').click();
  await expectSelected('deadline');
  await expectNames(exampleName);
  await expectNoOverflow();
  await section.screenshot({ path: testInfo.outputPath(`tryout-deadline-${width}.png`) });

  await page.locator('#tab-complete').click();
  await expectSelected('complete');
  await expect(complete).toBeEnabled();
  await expect(complete).not.toBeChecked();
  await expect(reopen).toBeDisabled();
  await complete.check();
  await expect(complete).toBeChecked();
  await expect(completionPreview).toHaveClass(/is-complete/);
  await expect(message).toHaveText(doneMessage);
  await expect(reopen).toBeEnabled();
  await expectNoOverflow();
  await section.screenshot({ path: testInfo.outputPath(`tryout-complete-${width}.png`) });
  await complete.uncheck();
  await expect(completionPreview).not.toHaveClass(/is-complete/);
  await expect(message).toHaveText(progressMessage);
  await expect(reopen).toBeDisabled();

  await complete.focus();
  await complete.press('Space');
  await expect(complete).toBeChecked();
  await complete.press('Tab');
  await expect(reopen).toBeFocused();
  await reopen.press('Enter');
  await expect(complete).not.toBeChecked();
  await expect(complete).toBeFocused();
  await expect(message).toHaveText(progressMessage);
  await expect(reopen).toBeDisabled();
  await complete.check();
  await reopen.click();
  await expect(complete).not.toBeChecked();
  await expect(complete).toBeFocused();

  await complete.check();
  await page.locator('#tab-write').click();
  await input.fill('');
  await expectNames(emptyName);
  await expect(preview).not.toHaveClass(/has-title/);
  await page.locator('#tab-complete').click();
  await expect(complete).toBeDisabled();
  await expect(complete).not.toBeChecked();
  await expect(reopen).toBeDisabled();
  await expect(completionPreview).not.toHaveClass(/is-complete/);
  await expect(message).toHaveText(emptyMessage);
  await expectNoOverflow();

  await page.reload({ waitUntil: 'networkidle' });
  await expectSelected('write');
  await expect(input).toHaveValue('');
  await expect(count).toHaveText('0 / 30자');
  await expectNames(emptyName);
  await expect(errors).toEqual([]);
});
