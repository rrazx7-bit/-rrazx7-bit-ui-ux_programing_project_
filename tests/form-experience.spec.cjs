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

async function expectNoFormOverflow(page) {
  const overflowing = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const visible = node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
    const nodes = [...document.querySelectorAll('#plan-flow, #plan-flow *')].filter(visible);
    return {
      document: document.documentElement.scrollWidth > width,
      elements: nodes.filter(node => {
        const rect = node.getBoundingClientRect();
        return rect.left < -1 || rect.right > width + 1;
      }).map(node => node.id || node.tagName),
      text: nodes.filter(node => node.matches('h2, h3, p, label, button, dt, dd'))
        .filter(node => getComputedStyle(node).display !== 'inline' && node.scrollWidth > node.clientWidth + 1)
        .map(node => node.id || node.textContent.trim())
    };
  });
  expect(overflowing).toEqual({ document: false, elements: [], text: [] });
}

async function confirmPlan(page) {
  await page.locator('#plan-next-options').click();
  await page.locator('#plan-finish').click();
  await page.locator('#plan-confirm-submit').click();
  await expect(page.locator('.plan-step[data-step="4"]')).toBeVisible();
}

test('plan form: live validation, conditional data, final recheck and reset', async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  const width = testInfo.project.use.viewport.width;
  await page.goto('./', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#saved-first-plan').click();

  const flow = page.locator('#plan-flow');
  const form = page.locator('#plan-form');
  const title = page.locator('#plan-title');
  const course = page.locator('#plan-course');
  const count = page.locator('#plan-title-count');
  const titleError = page.locator('#plan-title-error');
  const feedback = page.locator('#plan-title-feedback');
  const mode = page.locator('#plan-deadline-mode');
  const date = page.locator('#plan-date');
  const save = page.locator('#plan-save-button');

  await expect(flow.locator('form')).toHaveCount(1);
  expect(await title.evaluate(node => node.form.id)).toBe('plan-form');
  expect(await date.evaluate(node => node.form.id)).toBe('plan-form');
  await expect(form).toHaveAttribute('novalidate', '');
  await expect(title).toHaveAttribute('minlength', '2');
  await expect(title).toHaveAttribute('maxlength', '60');
  await expect(title).toHaveAttribute('aria-describedby', /plan-title-help/);
  await expect(title).toHaveAttribute('aria-describedby', /plan-title-error/);
  await expect(title).toHaveAttribute('aria-describedby', /plan-title-count/);
  await expect(course).toHaveAttribute('aria-describedby', /plan-course-help/);
  await expect(page.locator('#plan-course-help')).toContainText('30');
  await expect(save).toHaveAttribute('type', 'submit');
  await expect(count).toHaveText('0 / 60자');
  await expect(page.locator('#plan-title-field')).not.toHaveClass(/is-valid/);

  await title.press('Enter');
  await expect(titleError).toHaveText('과제 이름을 입력해 주세요.');
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute('aria-invalid', 'true');
  await title.fill('   ');
  await expect(count).toHaveText('3 / 60자');
  await expect(titleError).toHaveText('과제 이름을 입력해 주세요.');
  await title.fill('ㄱ');
  await expect(count).toHaveText('1 / 60자');
  await expect(titleError).toHaveText('과제 이름을 2자 이상 입력해 주세요.');
  await expect(title).toHaveAttribute('aria-invalid', 'true');
  await expectNoFormOverflow(page);
  await flow.screenshot({ path: testInfo.outputPath(`form-title-error-${width}.png`) });

  await title.fill('초안');
  await expect(count).toHaveText('2 / 60자');
  await expect(titleError).toHaveText('');
  await expect(title).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#plan-title-field')).toHaveClass(/is-valid/);
  await expect(feedback).toHaveText('입력 조건을 충족했어요.');
  await title.fill('가'.repeat(60));
  await expect(count).toHaveText('60 / 60자');
  await title.press('End');
  await page.keyboard.insertText('나');
  await expect(title).toHaveValue('가'.repeat(60));

  const enteredTitle = '  발표 자료 정리  ';
  await title.fill(enteredTitle);
  await course.fill('서비스 기획');
  await expect(count).toHaveText(`${enteredTitle.length} / 60자`);
  await expectNoFormOverflow(page);
  await flow.screenshot({ path: testInfo.outputPath(`form-title-valid-${width}.png`) });
  await course.press('Enter');
  await expect(page.locator('.plan-step[data-step="2"]')).toBeVisible();
  await expect(title).toHaveValue(enteredTitle.trim());
  await expect(count).toHaveText(`${enteredTitle.trim().length} / 60자`);
  await expect(mode).toHaveAttribute('aria-controls', 'plan-date-field');
  await expect(mode).toHaveAttribute('aria-expanded', 'false');
  await expect(date).toBeDisabled();
  expect(await form.evaluate(node => new FormData(node).has('deadline'))).toBe(false);
  await mode.selectOption('date');
  await expect(mode).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#plan-date-field')).toBeVisible();
  await expect(date).toBeEnabled();
  await page.locator('#plan-next-options').click();
  await expect(date).toBeFocused();
  await expect(page.locator('#plan-date-error')).toHaveText('마감일을 선택해 주세요.');
  await date.fill('2030-11-20');
  await expect(page.locator('#plan-date-error')).toHaveText('');
  expect(await form.evaluate(node => new FormData(node).get('deadline'))).toBe('2030-11-20');
  await mode.selectOption('none');
  await expect(mode).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#plan-date-field')).toBeHidden();
  await expect(date).toBeDisabled();
  await expect(date).not.toHaveAttribute('required', '');
  await expect(date).toHaveValue('');
  expect(await form.evaluate(node => new FormData(node).has('deadline'))).toBe(false);
  await mode.selectOption('date');
  await date.fill('2030-11-21');
  await expectNoFormOverflow(page);
  await flow.screenshot({ path: testInfo.outputPath(`form-conditional-${width}.png`) });
  await confirmPlan(page);

  // Final submit must recheck all fields, including a now-invalid value in a hidden earlier step.
  await title.evaluate(node => { node.value = 'ㄱ'; });
  await save.press('Enter');
  await expect(page.locator('.plan-step[data-step="1"]')).toBeVisible();
  await expect(title).toBeFocused();
  await expect(titleError).toHaveText('과제 이름을 2자 이상 입력해 주세요.');
  await expect(course).toHaveValue('서비스 기획');
  await expect(mode).toHaveValue('date');
  await expect(date).toHaveValue('2030-11-21');
  await expect(page.locator('#saved-task-list .saved-task-card')).toHaveCount(0);
  await title.fill('발표 자료 정리');
  await title.press('Enter');
  await confirmPlan(page);
  await save.press('Enter');
  await expect(page.locator('#plan-save-message')).toHaveText('내 과제 목록에 추가했어요.');
  await expect(page.locator('#saved-task-list .saved-task-card')).toHaveCount(1);

  await page.locator('#plan-restart').click();
  await expect(title).toBeFocused();
  await expect(count).toHaveText('0 / 60자');
  await expect(page.locator('#plan-title-field')).not.toHaveClass(/is-valid/);
  await expect(feedback).not.toHaveText('입력 조건을 충족했어요.');
  for (const input of [title, course, mode, date]) {
    await expect(input).toHaveValue('');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  }
  await expect(titleError).toHaveText('');
  await expect(page.locator('#plan-date-error')).toHaveText('');
  await expect(mode).toHaveAttribute('aria-expanded', 'false');
  await expect(date).toBeDisabled();
  await expect(form).toHaveAttribute('aria-busy', 'false');
  await expect(save).toBeEnabled();
  await expect(save).toHaveText('내 과제에 추가');
  await expect(page.locator('#plan-save-message')).toHaveText('목록에 추가하면 이 브라우저에서 다시 열 수 있어요.');
  await expect(page.locator('#saved-task-list .saved-task-card')).toHaveCount(1);
  await expectNoFormOverflow(page);
  expect(errors).toEqual([]);
});

test('plan form: submitting locks duplicates and failed storage can retry unchanged values', async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  const width = testInfo.project.use.viewport.width;
  // Install before the page uses timers, then pause only after the inputs are complete.
  await page.clock.install({ time: new Date('2026-11-01T00:00:00Z') });
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    window.storageTest = { fail: true, writes: 0 };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) {
        window.storageTest.writes += 1;
        if (window.storageTest.fail) throw new DOMException('Storage is full', 'QuotaExceededError');
      }
      return original.call(this, name, value);
    };
  }, storageKey);
  await page.goto('./', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#saved-first-plan').click();
  await page.locator('#plan-title').fill('브라우저 저장 다시 시도');
  await page.locator('#plan-course').fill('서비스 기획');
  await page.locator('#plan-next-details').click();
  await page.locator('#plan-deadline-mode').selectOption('date');
  await page.locator('#plan-date').fill('2030-11-22');
  await confirmPlan(page);

  const form = page.locator('#plan-form');
  const save = page.locator('#plan-save-button');
  const message = page.locator('#plan-save-message');
  const cards = page.locator('#saved-task-list .saved-task-card');
  await page.clock.pauseAt(new Date('2026-11-01T01:00:00Z'));
  await save.press('Enter');
  await expect(form).toHaveAttribute('aria-busy', 'true');
  await expect(save).toBeDisabled();
  await expect(save).toHaveText('저장 중…');
  await expect(message).toContainText(/저장/);
  await expect(page.locator('#plan-restart')).toBeDisabled();
  await expect(page.locator('#saved-new-plan')).toBeDisabled();
  await expectNoFormOverflow(page);
  await page.locator('#plan-flow').screenshot({ path: testInfo.outputPath(`form-saving-${width}.png`), animations: 'disabled' });
  // Repeated submit events cannot create additional writes while a save is pending.
  await form.evaluate(node => {
    node.requestSubmit();
    node.requestSubmit();
  });
  await page.clock.runFor(1000);
  await expect(form).toHaveAttribute('aria-busy', 'false');
  await expect(message).toContainText('저장하지 못했어요');
  await expect(save).toBeEnabled();
  await expect(save).toHaveText('다시 저장하기');
  await expect(cards).toHaveCount(0);
  await expect(page.locator('#plan-view-list')).toBeDisabled();
  await expect(page.locator('#plan-title')).toHaveValue('브라우저 저장 다시 시도');
  await expect(page.locator('#plan-course')).toHaveValue('서비스 기획');
  await expect(page.locator('#plan-deadline-mode')).toHaveValue('date');
  await expect(page.locator('#plan-date')).toHaveValue('2030-11-22');
  expect(await page.evaluate(() => window.storageTest.writes)).toBe(1);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await expectNoFormOverflow(page);
  await page.locator('#plan-flow').screenshot({ path: testInfo.outputPath(`form-save-failure-${width}.png`), animations: 'disabled' });

  await page.evaluate(() => { window.storageTest.fail = false; });
  await save.press('Enter');
  await form.evaluate(node => node.requestSubmit());
  await page.clock.runFor(1000);
  await expect(form).toHaveAttribute('aria-busy', 'false');
  await expect(message).toHaveText('내 과제 목록에 추가했어요.');
  await expect(save).toHaveText('목록에 추가됨');
  await expect(save).toBeDisabled();
  await expect(page.locator('#plan-view-list')).toBeEnabled();
  await expect(page.locator('#plan-restart')).toBeEnabled();
  await expect(page.locator('#saved-new-plan')).toBeEnabled();
  await expect(cards).toHaveCount(1);
  expect(await page.evaluate(() => window.storageTest.writes)).toBe(2);
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(stored.tasks).toHaveLength(1);
  expect(stored.tasks[0]).toMatchObject({ title: '브라우저 저장 다시 시도', course: '서비스 기획', deadline: '2030-11-22', completed: false });
  await page.clock.resume();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(cards).toHaveCount(1);
  await expect(cards.locator('.saved-task-title')).toHaveText('브라우저 저장 다시 시도');
  expect(errors).toEqual([]);
});
