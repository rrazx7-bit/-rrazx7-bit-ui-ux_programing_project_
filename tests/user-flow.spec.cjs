const { test, expect } = require('@playwright/test');

test('planning flow: validation, branches, review, confirmation and restart', async ({ page }, testInfo) => {
  const width = testInfo.project.use.viewport.width;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  const response = await page.goto('./', { waitUntil: 'networkidle' });
  expect(response.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);

  const flow = page.locator('#plan-flow');
  const start = page.locator('#plan-start');
  const title = page.locator('#plan-title');
  const course = page.locator('#plan-course');
  const mode = page.locator('#plan-deadline-mode');
  const date = page.locator('#plan-date');
  const dateField = page.locator('#plan-date-field');
  const titleError = page.locator('#plan-title-error');
  const modeError = page.locator('#plan-mode-error');
  const dateError = page.locator('#plan-date-error');
  const dialog = page.locator('#plan-confirm');
  const finish = page.locator('#plan-finish');
  const cancel = page.locator('#plan-confirm-cancel');
  const confirm = page.locator('#plan-confirm-submit');
  const previewInput = page.locator('#task-name');
  const signupButton = page.locator('#signup-button');
  const progress = ['1 / 3 · 과제 입력', '2 / 3 · 마감 선택', '3 / 3 · 내용 확인', '계획 완료'];

  async function expectNoOverflow() {
    const overflow = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const visible = node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
      const elements = [...document.querySelectorAll('#plan-flow, #plan-flow *, #plan-confirm, #plan-confirm *')];
      return {
        document: document.documentElement.scrollWidth > width,
        elements: elements.filter(visible).filter(node => {
          const rect = node.getBoundingClientRect();
          return rect.left < -1 || rect.right > width + 1;
        }).map(node => node.id || node.className || node.tagName),
        text: elements.filter(node => node.matches('h2, h3, p, button, label, dt, dd')).filter(visible)
          .filter(node => getComputedStyle(node).display !== 'inline' && node.scrollWidth > node.clientWidth + 1)
          .map(node => node.id || node.textContent.trim())
      };
    });
    expect(overflow).toEqual({ document: false, elements: [], text: [] });
  }

  async function expectStep(number) {
    await expect(flow).toBeVisible();
    await expect(flow.locator('.plan-step')).toHaveCount(4);
    await expect(flow.locator('.plan-step:not([hidden])')).toHaveCount(1);
    for (let step = 1; step <= 4; step++) {
      const panel = flow.locator(`.plan-step[data-step="${step}"]`);
      if (step === number) await expect(panel).toBeVisible();
      else await expect(panel).toBeHidden();
    }
    await expect(page.locator('#plan-progress')).toHaveText(progress[number - 1]);
    await expectNoOverflow();
  }

  async function expectFieldError(input, message, text) {
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveClass(/has-error/);
    await expect(input).toBeFocused();
    await expect(message).toHaveText(text);
    await expect(message).toBeVisible();
    await expectNoOverflow();
  }

  async function expectSummary(prefix, task, subject, deadline) {
    await expect(page.locator(`#${prefix}-title${prefix === 'plan-done' ? '-text' : ''}`)).toHaveText(task);
    await expect(page.locator(`#${prefix}-course`)).toHaveText(subject);
    await expect(page.locator(`#${prefix}-deadline`)).toHaveText(deadline);
  }

  await expect(flow).toBeHidden();
  await expect(start).toHaveText('과제 계획 세우기');
  await previewInput.fill('  서비스 소개 정리  ');
  // Other existing features keep their state when a new plan is started later.
  await page.locator('#email').fill('student@example.com');
  await signupButton.click();
  await expect(signupButton).toBeDisabled();
  const originalURL = page.url();
  await start.click();
  await expectStep(1);
  await expect(start).toHaveText('계획 이어서 보기');
  await expect(title).toHaveValue('서비스 소개 정리');
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute('maxlength', '60');
  await expect(title).toHaveAttribute('required', '');
  await expect(course).toHaveAttribute('maxlength', '30');
  await expect(titleError).toHaveAttribute('role', 'alert');

  await title.fill('');
  await page.locator('#plan-next-details').click();
  await expectStep(1);
  await expectFieldError(title, titleError, '과제 이름을 입력해 주세요.');
  await flow.screenshot({ path: testInfo.outputPath(`plan-error-${width}.png`) });
  await title.fill('   ');
  await title.press('Enter');
  await expectStep(1);
  await expectFieldError(title, titleError, '과제 이름을 입력해 주세요.');
  expect(page.url()).toBe(originalURL);

  const firstTitle = '발표 자료 준비';
  await title.fill(`  ${firstTitle}  `);
  await course.fill('  서비스 기획  ');
  await course.press('Enter');
  await expectStep(2);
  await expect(mode).toBeFocused();
  await expect(mode).toHaveValue('');
  await expect(dateField).toBeHidden();
  await expect(date).toBeDisabled();
  await page.locator('#plan-next-options').click();
  await expectStep(2);
  await expectFieldError(mode, modeError, '마감 방식을 선택해 주세요.');

  await mode.selectOption('date');
  await expect(dateField).toBeVisible();
  await expect(date).toBeEnabled();
  await expect(date).toHaveAttribute('required', '');
  await page.locator('#plan-next-options').click();
  await expectStep(2);
  await expectFieldError(date, dateError, '마감일을 선택해 주세요.');
  // Leaving the date branch removes its required state, error and previous value.
  await date.fill('2030-11-20');
  await mode.selectOption('none');
  await expect(dateField).toBeHidden();
  await expect(date).toBeDisabled();
  await expect(date).not.toHaveAttribute('required', '');
  await expect(date).toHaveValue('');
  await expect(date).not.toHaveAttribute('aria-invalid', 'true');
  await expect(date).not.toHaveClass(/has-error/);
  await expect(dateError).toHaveText('');
  await expect(mode).not.toHaveAttribute('aria-invalid', 'true');
  await expect(modeError).toHaveText('');
  await expectNoOverflow();

  await mode.selectOption('date');
  await date.fill('2030-11-20');
  await flow.screenshot({ path: testInfo.outputPath(`plan-options-${width}.png`) });
  await page.locator('#plan-back-options').click();
  await expectStep(1);
  await expect(title).toHaveValue(firstTitle);
  await expect(course).toHaveValue('서비스 기획');
  await expect(mode).toHaveValue('date');
  await expect(date).toHaveValue('2030-11-20');
  const editedTitle = '서비스 소개 페이지 구성과 발표 자료 정리';
  await title.fill(editedTitle);
  await course.press('Enter');
  await expectStep(2);
  await expect(mode).toHaveValue('date');
  await expect(date).toHaveValue('2030-11-20');
  await page.locator('#plan-next-options').press('Enter');
  await expectStep(3);
  await expect(page.locator('#plan-review-title')).toBeFocused();
  await expectSummary('plan-summary', editedTitle, '서비스 기획', '2030-11-20');

  await page.locator('#plan-back-review').click();
  await expectStep(2);
  await expect(mode).toHaveValue('date');
  await expect(date).toHaveValue('2030-11-20');
  await date.fill('2030-11-21');
  await page.locator('#plan-next-options').click();
  await expectStep(3);
  await expectSummary('plan-summary', editedTitle, '서비스 기획', '2030-11-21');
  await flow.screenshot({ path: testInfo.outputPath(`plan-review-${width}.png`) });

  await previewInput.fill('미리보기에서 따로 적은 이름');
  await start.click();
  await expectStep(3);
  await expect(title).toHaveValue(editedTitle);
  await expectSummary('plan-summary', editedTitle, '서비스 기획', '2030-11-21');
  await finish.click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('open', '');
  await expect(dialog).toHaveAccessibleName('이 계획으로 시작할까요?');
  await expect(cancel).toBeFocused();
  await expectNoOverflow();
  await page.screenshot({ path: testInfo.outputPath(`plan-dialog-${width}.png`) });
  await page.keyboard.press('Tab');
  await expect(confirm).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirm).toBeFocused();
  await cancel.click();
  await expect(dialog).toBeHidden();
  await expectStep(3);
  await expect(finish).toBeFocused();
  await expectSummary('plan-summary', editedTitle, '서비스 기획', '2030-11-21');
  await finish.press('Enter');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expectStep(3);
  await expect(finish).toBeFocused();
  await expectSummary('plan-summary', editedTitle, '서비스 기획', '2030-11-21');
  await finish.click();
  await confirm.click();
  await expect(dialog).toBeHidden();
  await expectStep(4);
  await expect(page.locator('#plan-done-title')).toBeFocused();
  await expectSummary('plan-done', editedTitle, '서비스 기획', '2030-11-21');
  await flow.screenshot({ path: testInfo.outputPath(`plan-done-${width}.png`) });
  expect(page.url()).toBe(originalURL);
  await start.click();
  await expectStep(4);

  await page.locator('#plan-restart').click();
  await expectStep(1);
  await expect(title).toBeFocused();
  for (const input of [title, course, mode, date]) {
    await expect(input).toHaveValue('');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(input).not.toHaveClass(/has-error/);
  }
  for (const message of [titleError, modeError, dateError]) await expect(message).toHaveText('');
  await expect(dateField).toBeHidden();
  await expect(date).toBeDisabled();
  await expectSummary('plan-summary', '', '', '');
  await expectSummary('plan-done', '', '', '');
  await expect(previewInput).toHaveValue('미리보기에서 따로 적은 이름');
  await expect(signupButton).toBeDisabled();
  await expect(page.locator('#signup-message')).toContainText('student@example.com');

  // A second plan completes without a deadline; long literal input stays text at every width.
  const literalTitle = `<b>${'한'.repeat(53)}</b>`;
  expect(literalTitle.length).toBe(60);
  await title.fill(literalTitle);
  await title.press('Enter');
  await expectStep(2);
  await mode.selectOption('none');
  await page.locator('#plan-next-options').click();
  await expectStep(3);
  await expectSummary('plan-summary', literalTitle, '미지정', '마감일 없음');
  await expect(page.locator('#plan-summary-title').locator('b')).toHaveCount(0);
  await finish.click();
  await expectNoOverflow();
  await confirm.click();
  await expectStep(4);
  await expectSummary('plan-done', literalTitle, '미지정', '마감일 없음');
  await expect(page.locator('#plan-done-title-text').locator('b')).toHaveCount(0);
  expect(page.url()).toBe(originalURL);

  await page.reload({ waitUntil: 'networkidle' });
  await expect(flow).toBeHidden();
  await expect(start).toHaveText('과제 계획 세우기');
  await start.click();
  await expectStep(1);
  await expect(title).toHaveValue('');
  await expect(course).toHaveValue('');
  await expect(mode).toHaveValue('');
  await expect(date).toHaveValue('');
  expect(errors).toEqual([]);
});
