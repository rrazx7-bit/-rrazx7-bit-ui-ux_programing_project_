const { test, expect } = require('@playwright/test');

const storageKey = 'moabom.tasks.v1';

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function completePlan(page, title, course, deadline) {
  await page.locator('#plan-title').fill(title);
  await page.locator('#plan-course').fill(course);
  await page.locator('#plan-next-details').click();
  await page.locator('#plan-deadline-mode').selectOption(deadline ? 'date' : 'none');
  if (deadline) await page.locator('#plan-date').fill(deadline);
  await page.locator('#plan-next-options').click();
  await page.locator('#plan-finish').click();
  await page.locator('#plan-confirm-submit').click();
  await expect(page.locator('.plan-step[data-step="4"]')).toBeVisible();
}

async function expectNoSavedOverflow(page) {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const visible = node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
    const elements = [...document.querySelectorAll('#my-tasks, #my-tasks *, #saved-task-dialog, #saved-task-dialog *')];
    return {
      document: document.documentElement.scrollWidth > width,
      elements: elements.filter(visible).filter(node => {
        const rect = node.getBoundingClientRect();
        return rect.left < -1 || rect.right > width + 1;
      }).map(node => node.id || node.className || node.tagName),
      text: elements.filter(node => node.matches('h2, h3, p, button, label, dt, dd'))
        .filter(visible)
        .filter(node => getComputedStyle(node).display !== 'inline' && node.scrollWidth > node.clientWidth + 1)
        .map(node => node.id || node.textContent.trim())
    };
  });
  expect(overflow).toEqual({ document: false, elements: [], text: [] });
}

test('saved tasks: add, reopen, filter, complete, cancel deletion and persist', async ({ page }, testInfo) => {
  const width = testInfo.project.use.viewport.width;
  const errors = watchErrors(page);
  await page.goto('./', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const section = page.locator('#my-tasks');
  const cards = page.locator('#saved-task-list .saved-task-card');
  const filter = page.locator('#saved-filter');
  const count = page.locator('#saved-count');
  const empty = page.locator('#saved-empty');
  const emptyTitle = page.locator('#saved-empty-title');
  const save = page.locator('#plan-save-button');
  const saveMessage = page.locator('#plan-save-message');
  const viewList = page.locator('#plan-view-list');
  const dialog = page.locator('#saved-task-dialog');
  const close = page.locator('#saved-close');
  const toggle = page.locator('#saved-toggle-status');
  const deleteButton = page.locator('#saved-delete');
  const deleteRegion = page.locator('#saved-delete-confirm');
  const deleteCancel = page.locator('#saved-delete-cancel');
  const deleteSubmit = page.locator('#saved-delete-submit');
  const title = `<b>${'한'.repeat(53)}</b>`;
  const secondTitle = '자료 조사';
  expect(title.length).toBe(60);

  function openTask(taskTitle) {
    return page.getByRole('button', { name: `과제 열기: ${taskTitle}`, exact: true });
  }

  await expect(section).toBeVisible();
  await expect(filter).toHaveValue('all');
  await expect(cards).toHaveCount(0);
  await expect(count).toHaveText('전체 0개 · 진행 중 0개 · 완료 0개');
  await expect(emptyTitle).toHaveText('아직 추가한 과제가 없어요');
  await expect(page.locator('#saved-first-plan')).toBeVisible();
  await expect(page.locator('#saved-show-all')).toBeHidden();
  await expectNoSavedOverflow(page);
  await section.screenshot({ path: testInfo.outputPath(`saved-empty-${width}.png`) });

  await page.locator('#saved-first-plan').click();
  await expect(page.locator('#plan-title')).toBeFocused();
  await expect(page.locator('#plan-title')).toHaveValue('');
  await completePlan(page, title, 'UI/UX 프로그래밍', '2030-11-21');
  await expect(save).toBeEnabled();
  await expect(viewList).toBeDisabled();
  await expect(saveMessage).toHaveText('목록에 추가하면 이 브라우저에서 다시 열 수 있어요.');
  await save.click();
  await expect(save).toBeDisabled();
  await expect(save).toHaveText('목록에 추가됨');
  await expect(saveMessage).toHaveText('내 과제 목록에 추가했어요.');
  await expect(cards).toHaveCount(1);
  await expect(cards.first().locator('.saved-task-title')).toHaveText(title);
  await expect(cards.first().locator('.saved-task-title b')).toHaveCount(0);
  await expect(cards.first().locator('.saved-course')).toHaveText('UI/UX 프로그래밍');
  await expect(cards.first().locator('.saved-deadline')).toHaveText('2030-11-21');
  await expect(cards.first().locator('.saved-status')).toHaveText('진행 중');
  await viewList.click();
  await expect(openTask(title)).toBeFocused();
  await expect(count).toHaveText('전체 1개 · 진행 중 1개 · 완료 0개');

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#plan-flow')).toBeHidden();
  await expect(cards).toHaveCount(1);
  await expect(openTask(title)).toBeVisible();
  await page.locator('#saved-new-plan').click();
  await expect(page.locator('#plan-title')).toHaveValue('');
  await expect(cards).toHaveCount(1);
  await completePlan(page, secondTitle, '', '2030-11-20');
  await save.click();
  await expect(cards).toHaveCount(2);
  await expect(cards.locator('.saved-task-title')).toHaveText([secondTitle, title]);
  await expect(cards.first().locator('.saved-course')).toHaveText('과목 미지정');
  await viewList.click();
  await expect(openTask(secondTitle)).toBeFocused();
  await expectNoSavedOverflow(page);
  await section.screenshot({ path: testInfo.outputPath(`saved-list-${width}.png`) });

  // A new draft resets only the planning flow; adding the same result again does not duplicate it.
  await page.locator('#plan-restart').click();
  await expect(save).toBeEnabled();
  await expect(viewList).toBeDisabled();
  await expect(cards).toHaveCount(2);
  await completePlan(page, title, 'UI/UX 프로그래밍', '2030-11-21');
  await save.click();
  await expect(saveMessage).toHaveText('같은 계획이 이미 목록에 있어요. 기존 과제를 확인해 주세요.');
  await expect(save).toBeDisabled();
  await expect(cards).toHaveCount(2);

  await filter.selectOption('done');
  await expect(cards).toHaveCount(0);
  await expect(emptyTitle).toHaveText('완료한 과제가 없어요');
  await expect(page.locator('#saved-first-plan')).toBeHidden();
  await expect(page.locator('#saved-show-all')).toBeVisible();
  await expect(count).toHaveText('전체 2개 · 진행 중 2개 · 완료 0개');
  await expect(page.locator('#saved-result')).toHaveText('0개 표시');
  await expectNoSavedOverflow(page);
  await section.screenshot({ path: testInfo.outputPath(`saved-filtered-${width}.png`) });
  await page.locator('#saved-show-all').click();
  await expect(filter).toHaveValue('all');
  await expect(cards).toHaveCount(2);

  await openTask(title).press('Enter');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName(title);
  await expect(page.locator('#saved-detail-title')).toHaveText(title);
  await expect(page.locator('#saved-detail-title b')).toHaveCount(0);
  await expect(page.locator('#saved-detail-course')).toHaveText('UI/UX 프로그래밍');
  await expect(page.locator('#saved-detail-deadline')).toHaveText('2030-11-21');
  await expect(page.locator('#saved-detail-status')).toHaveText('진행 중');
  await expect(close).toBeFocused();
  const buttons = dialog.locator('button:visible');
  await buttons.last().focus();
  await page.keyboard.press('Tab');
  await expect(buttons.first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(buttons.last()).toBeFocused();
  await expectNoSavedOverflow(page);
  await page.screenshot({ path: testInfo.outputPath(`saved-detail-${width}.png`) });
  await toggle.click();
  await expect(page.locator('#saved-detail-status')).toHaveText('완료');
  await expect(toggle).toHaveText('진행 중으로 되돌리기');
  await expect(page.locator('#saved-detail-feedback')).toHaveText('완료로 표시했어요.');
  await expect(count).toHaveText('전체 2개 · 진행 중 1개 · 완료 1개');
  await close.click();
  await expect(dialog).toBeHidden();
  await expect(openTask(title)).toBeFocused();
  await filter.selectOption('active');
  await expect(cards).toHaveCount(1);
  await expect(cards.first().locator('.saved-task-title')).toHaveText(secondTitle);

  await page.reload({ waitUntil: 'networkidle' });
  await expect(count).toHaveText('전체 2개 · 진행 중 1개 · 완료 1개');
  await filter.selectOption('done');
  await expect(cards).toHaveCount(1);
  await expect(cards.first().locator('.saved-task-title')).toHaveText(title);
  await openTask(title).click();
  await toggle.press('Enter');
  await expect(page.locator('#saved-detail-status')).toHaveText('진행 중');
  await expect(page.locator('#saved-detail-feedback')).toHaveText('진행 중으로 되돌렸어요.');
  await expect(filter).toHaveValue('done');
  await expect(cards).toHaveCount(0);
  await close.click();
  await expect(page.locator('#saved-heading')).toBeFocused();
  await expect(emptyTitle).toHaveText('완료한 과제가 없어요');
  await page.locator('#saved-show-all').click();

  await openTask(title).click();
  await deleteButton.click();
  await expect(deleteRegion).toBeVisible();
  await expect(page.locator('#saved-detail-actions')).toBeHidden();
  await expect(deleteCancel).toBeFocused();
  await expectNoSavedOverflow(page);
  await page.screenshot({ path: testInfo.outputPath(`saved-delete-${width}.png`) });
  await deleteCancel.click();
  await expect(deleteRegion).toBeHidden();
  await expect(deleteButton).toBeFocused();
  await expect(cards).toHaveCount(2);
  await expect(page.locator('#saved-detail-title')).toHaveText(title);
  await deleteButton.click();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(deleteRegion).toBeHidden();
  await expect(cards).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(openTask(title)).toBeFocused();

  await openTask(title).click();
  await deleteButton.click();
  await deleteCancel.press('Tab');
  await expect(deleteSubmit).toBeFocused();
  await deleteSubmit.press('Tab');
  await expect(deleteCancel).toBeFocused();
  await deleteSubmit.click();
  await expect(dialog).toBeHidden();
  await expect(cards).toHaveCount(1);
  await expect(cards.first().locator('.saved-task-title')).toHaveText(secondTitle);
  await expect(page.locator('#saved-list-message')).toHaveText('과제를 목록에서 삭제했어요.');
  await expect(count).toHaveText('전체 1개 · 진행 중 1개 · 완료 0개');
  await page.reload({ waitUntil: 'networkidle' });
  await expect(cards).toHaveCount(1);
  await expect(cards.first().locator('.saved-task-title')).toHaveText(secondTitle);
  await openTask(secondTitle).click();
  await deleteButton.click();
  await deleteSubmit.click();
  await expect(cards).toHaveCount(0);
  await expect(empty).toBeVisible();
  await expect(emptyTitle).toHaveText('아직 추가한 과제가 없어요');
  await expect(page.locator('#saved-first-plan')).toBeVisible();
  await expectNoSavedOverflow(page);
  expect(errors).toEqual([]);
});

test('saved tasks: storage failures show feedback and preserve a usable page', async ({ page, browser }, testInfo) => {
  const errors = watchErrors(page);
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Storage is full', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, storageKey);
  await page.goto('./', { waitUntil: 'networkidle' });
  await page.locator('#saved-first-plan').click();
  await completePlan(page, '저장 실패에서도 확인할 과제', '', '');
  await page.locator('#plan-save-button').click();
  await expect(page.locator('#saved-storage-message')).toBeVisible();
  await expect(page.locator('#saved-storage-message')).toContainText(/저장/);
  await expect(page.locator('#saved-task-list .saved-task-card')).toHaveCount(1);
  await expect(page.locator('.saved-task-card .saved-deadline')).toHaveText('마감일 없음');
  await page.getByRole('button', { name: '과제 열기: 저장 실패에서도 확인할 과제', exact: true }).click();
  await page.locator('#saved-toggle-status').click();
  await expect(page.locator('#saved-detail-status')).toHaveText('완료');
  await expect(page.locator('#saved-detail-feedback')).toContainText(/저장/);
  await page.locator('#saved-close').click();
  await expectNoSavedOverflow(page);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#saved-task-list .saved-task-card')).toHaveCount(0);
  expect(errors).toEqual([]);

  // Isolated browser storage with malformed data must not crash or silently overwrite it.
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    viewport: testInfo.project.use.viewport,
    locale: 'ko-KR'
  });
  try {
    await context.addInitScript(key => {
      try { localStorage.setItem(key, '{broken'); } catch {}
    }, storageKey);
    const invalidPage = await context.newPage();
    const invalidErrors = watchErrors(invalidPage);
    await invalidPage.goto('./', { waitUntil: 'networkidle' });
    await expect(invalidPage.locator('#saved-storage-message')).toBeVisible();
    await expect(invalidPage.locator('#saved-storage-message')).toContainText(/저장|읽/);
    await expect(invalidPage.locator('#saved-task-list .saved-task-card')).toHaveCount(0);
    expect(await invalidPage.evaluate(key => localStorage.getItem(key), storageKey)).toBe('{broken');
    await invalidPage.locator('#saved-first-plan').click();
    await expect(invalidPage.locator('#plan-title')).toBeFocused();
    await expect(invalidPage.locator('#plan-flow')).toBeVisible();
    expect(invalidErrors).toEqual([]);
  } finally {
    await context.close();
  }
});
