const signupForm = document.querySelector("#signup-form");
const emailInput = document.querySelector("#email");
const signupButton = document.querySelector("#signup-button");
const signupMessage = document.querySelector("#signup-message");

let isEmailConfirmed = false;

function showFeedback(message, state) {
  signupMessage.textContent = message;
  signupMessage.classList.remove("is-error", "is-success");
  if (state) {
    signupMessage.classList.add(state);
  }
}

function handleEmailCheck(event) {
  // 주소가 URL에 붙거나 새로고침되지 않도록 화면 안에서 처리합니다.
  event.preventDefault();
  if (isEmailConfirmed) {
    return;
  }

  const email = emailInput.value.trim();
  emailInput.value = email;

  if (email === "") {
    showFeedback("이메일 주소를 입력해 주세요.", "is-error");
    emailInput.setAttribute("aria-invalid", "true");
    emailInput.focus();
  } else if (!emailInput.validity.valid) {
    showFeedback("이메일 형식을 확인해 주세요. 예: you@example.com", "is-error");
    emailInput.setAttribute("aria-invalid", "true");
    emailInput.focus();
  } else {
    isEmailConfirmed = true;
    emailInput.removeAttribute("aria-invalid");
    showFeedback(`${email}의 이메일 형식을 확인했습니다. 다른 주소를 확인하려면 입력 내용을 바꿔 주세요.`, "is-success");
    signupButton.textContent = "확인 완료";
    signupButton.disabled = true;
  }
}

function resetEmailCheck() {
  isEmailConfirmed = false;
  signupButton.disabled = false;
  signupButton.textContent = "이메일 확인하기";
  emailInput.removeAttribute("aria-invalid");
  showFeedback("이메일을 입력한 뒤 확인해 주세요.", "");
}

signupForm.addEventListener("submit", handleEmailCheck);
emailInput.addEventListener("input", resetEmailCheck);

// 기본 팝업 대신 같은 위치에서 입력 오류와 확인 결과를 안내합니다.
signupForm.noValidate = true;
signupButton.disabled = false;

// 과제 이름과 완료 상태를 세 미리보기 화면에 함께 반영합니다.
const taskNameInput = document.querySelector("#task-name");
const taskCount = document.querySelector("#task-count");
const taskNames = document.querySelectorAll(".task-name-text");
const taskPreview = document.querySelector("#task-preview");
const sampleTaskButton = document.querySelector("#sample-task-button");
const taskComplete = document.querySelector("#task-complete");
const completionPreview = document.querySelector("#completion-preview");
const completionMessage = document.querySelector("#completion-message");
const reopenTaskButton = document.querySelector("#reopen-task-button");
const deadlineStatus = document.querySelector("#deadline-status");
const sampleTaskName = "서비스 소개 페이지 정리";

function updateCompletion() {
  const hasName = taskNameInput.value.trim() !== "";
  if (!hasName) {
    taskComplete.checked = false;
  }
  const isComplete = taskComplete.checked;
  taskComplete.disabled = !hasName;
  completionPreview.classList.toggle("is-complete", isComplete);
  reopenTaskButton.disabled = !isComplete;

  if (!hasName) {
    completionMessage.textContent = "먼저 과제 적기 탭에서 이름을 입력해 주세요.";
    deadlineStatus.textContent = "이름 입력 전";
  } else if (isComplete) {
    completionMessage.textContent = "완료했어요. 다음 할 일을 살펴보세요.";
    deadlineStatus.textContent = "완료";
  } else {
    completionMessage.textContent = "아직 진행 중이에요. 끝냈다면 완료로 표시해 주세요.";
    deadlineStatus.textContent = "진행 중";
  }
}

function handleTaskInput() {
  const name = taskNameInput.value.trim();
  taskCount.textContent = `${taskNameInput.value.length} / 30자`;
  taskNames.forEach(function (element) {
    element.textContent = name || "과제 이름을 입력해 주세요";
  });
  taskPreview.classList.toggle("has-title", name !== "");
  const usesSample = taskNameInput.value === sampleTaskName;
  sampleTaskButton.textContent = usesSample ? "예시 적용됨" : "예시 넣기";
  sampleTaskButton.disabled = usesSample;
  updateCompletion();
}

function fillSampleTask() {
  taskNameInput.value = sampleTaskName;
  handleTaskInput();
  taskNameInput.focus();
}

function reopenTask() {
  taskComplete.checked = false;
  updateCompletion();
  taskComplete.focus();
}

taskNameInput.addEventListener("input", handleTaskInput);
sampleTaskButton.addEventListener("click", fillSampleTask);
taskComplete.addEventListener("change", updateCompletion);
reopenTaskButton.addEventListener("click", reopenTask);
handleTaskInput();

// 선택한 탭에 해당하는 패널만 표시합니다.
const featureTabs = document.querySelectorAll(".feature-tab");
const featurePanels = document.querySelectorAll(".feature-panel");
const tabList = document.querySelector(".feature-tabs");
const smallScreen = window.matchMedia("(max-width: 768px)");

function activateTab(selectedTab) {
  featureTabs.forEach(function (tab) {
    const selected = tab === selectedTab;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  const selectedPanel = document.querySelector(selectedTab.dataset.target);
  featurePanels.forEach(function (panel) {
    const selected = panel === selectedPanel;
    panel.classList.toggle("is-active", selected);
    panel.hidden = !selected;
  });
}

function handleTabClick(event) {
  activateTab(event.currentTarget);
}

function handleTabKeydown(event) {
  const tabs = Array.from(featureTabs);
  const current = tabs.indexOf(event.currentTarget);
  const nextKey = smallScreen.matches ? "ArrowDown" : "ArrowRight";
  const previousKey = smallScreen.matches ? "ArrowUp" : "ArrowLeft";
  let next;
  if (event.key === nextKey) next = (current + 1) % tabs.length;
  else if (event.key === previousKey) next = (current + tabs.length - 1) % tabs.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = tabs.length - 1;
  else return;

  event.preventDefault();
  activateTab(tabs[next]);
  tabs[next].focus();
}

function updateTabOrientation() {
  tabList.setAttribute("aria-orientation", smallScreen.matches ? "vertical" : "horizontal");
}

featureTabs.forEach(function (tab) {
  tab.addEventListener("click", handleTabClick);
  tab.addEventListener("keydown", handleTabKeydown);
});
smallScreen.addEventListener("change", updateTabOrientation);
updateTabOrientation();

// 미리보기에서 입력한 과제를 이름·마감·확인·완료 순서로 정리합니다.
const planStart = document.querySelector("#plan-start");
const planFlow = document.querySelector("#plan-flow");
const planSteps = document.querySelectorAll(".plan-step");
const planProgress = document.querySelector("#plan-progress");
const planDetails = document.querySelector("#plan-details");
const planOptions = document.querySelector("#plan-options");
const planTitle = document.querySelector("#plan-title");
const planCourse = document.querySelector("#plan-course");
const planMode = document.querySelector("#plan-deadline-mode");
const planDate = document.querySelector("#plan-date");
const planDateField = document.querySelector("#plan-date-field");
const planTitleError = document.querySelector("#plan-title-error");
const planModeError = document.querySelector("#plan-mode-error");
const planDateError = document.querySelector("#plan-date-error");
const planDialog = document.querySelector("#plan-confirm");
const planFinish = document.querySelector("#plan-finish");
const planSummaryFields = [
  ["#plan-summary-title", "#plan-done-title-text"],
  ["#plan-summary-course", "#plan-done-course"],
  ["#plan-summary-deadline", "#plan-done-deadline"]
];
let currentPlanStep = 1;
let planStarted = false;
let confirmedPlan = null;
let currentSavedTaskId = null;

function showPlanStep(step) {
  currentPlanStep = step;
  planSteps.forEach(function (element) {
    element.hidden = Number(element.dataset.step) !== step;
  });
  const labels = ["1 / 3 · 과제 입력", "2 / 3 · 마감 선택", "3 / 3 · 내용 확인", "계획 완료"];
  planProgress.textContent = labels[step - 1];
  planFlow.classList.toggle("is-complete", step === 4);
  planFlow.scrollIntoView({ block: "start" });
  const focusTargets = [planTitle, planMode, document.querySelector("#plan-review-title"), document.querySelector("#plan-done-title")];
  focusTargets[step - 1].focus({ preventScroll: true });
}

function clearPlanError(input, message) {
  input.classList.remove("has-error");
  input.removeAttribute("aria-invalid");
  message.textContent = "";
}

function showPlanError(input, message, text) {
  input.classList.add("has-error");
  input.setAttribute("aria-invalid", "true");
  message.textContent = text;
  input.focus();
}

function syncPlanDateField() {
  const needsDate = planMode.value === "date";
  planDateField.hidden = !needsDate;
  planDate.disabled = !needsDate;
  planDate.required = needsDate;
  clearPlanError(planMode, planModeError);
  if (!needsDate) {
    planDate.value = "";
    clearPlanError(planDate, planDateError);
  }
}

function renderPlanSummary() {
  const values = [
    planTitle.value.trim(),
    planCourse.value.trim() || "미지정",
    planMode.value === "date" ? planDate.value : "마감일 없음"
  ];
  planSummaryFields.forEach(function (selectors, index) {
    selectors.forEach(function (selector) {
      document.querySelector(selector).textContent = values[index];
    });
  });
}

function startPlan() {
  if (!planStarted) {
    planTitle.value = taskNameInput.value.trim();
    planStarted = true;
  }
  planFlow.hidden = false;
  planStart.setAttribute("aria-expanded", "true");
  planStart.textContent = "계획 이어서 보기";
  showPlanStep(currentPlanStep);
}

function checkPlanDetails(event) {
  event.preventDefault();
  if (currentPlanStep !== 1) return;
  if (!planTitle.value.trim()) {
    showPlanError(planTitle, planTitleError, "과제 이름을 입력해 주세요.");
    return;
  }
  clearPlanError(planTitle, planTitleError);
  planTitle.value = planTitle.value.trim();
  planCourse.value = planCourse.value.trim();
  showPlanStep(2);
}

function checkPlanOptions(event) {
  event.preventDefault();
  if (currentPlanStep !== 2) return;
  if (!planMode.value) {
    showPlanError(planMode, planModeError, "마감 방식을 선택해 주세요.");
    return;
  }
  clearPlanError(planMode, planModeError);
  if (planMode.value === "date" && (!planDate.value || !planDate.validity.valid)) {
    showPlanError(planDate, planDateError, "마감일을 선택해 주세요.");
    return;
  }
  clearPlanError(planDate, planDateError);
  renderPlanSummary();
  showPlanStep(3);
}

function restartPlan() {
  confirmedPlan = null;
  currentSavedTaskId = null;
  document.querySelector("#plan-save-button").disabled = false;
  document.querySelector("#plan-save-button").textContent = "내 과제에 추가";
  document.querySelector("#plan-view-list").disabled = true;
  document.querySelector("#plan-save-message").textContent = "목록에 추가하면 이 브라우저에서 다시 열 수 있어요.";
  planDetails.reset();
  planOptions.reset();
  clearPlanError(planTitle, planTitleError);
  clearPlanError(planMode, planModeError);
  clearPlanError(planDate, planDateError);
  syncPlanDateField();
  planSummaryFields.forEach(function (selectors) {
    selectors.forEach(function (selector) {
      document.querySelector(selector).textContent = "";
    });
  });
  showPlanStep(1);
}

planStart.addEventListener("click", startPlan);
planDetails.addEventListener("submit", checkPlanDetails);
planOptions.addEventListener("submit", checkPlanOptions);
planTitle.addEventListener("input", () => clearPlanError(planTitle, planTitleError));
planMode.addEventListener("change", syncPlanDateField);
planDate.addEventListener("input", () => clearPlanError(planDate, planDateError));
document.querySelector("#plan-back-options").addEventListener("click", () => showPlanStep(1));
document.querySelector("#plan-back-review").addEventListener("click", () => showPlanStep(2));
planFinish.addEventListener("click", () => {
  if (currentPlanStep === 3) planDialog.showModal();
});
document.querySelector("#plan-confirm-cancel").addEventListener("click", () => planDialog.close());
document.querySelector("#plan-confirm-submit").addEventListener("click", () => {
  confirmedPlan = {
    title: planTitle.value.trim(),
    course: planCourse.value.trim(),
    deadline: planMode.value === "date" ? planDate.value : ""
  };
  planDialog.close();
  showPlanStep(4);
});
planDialog.addEventListener("close", () => {
  if (currentPlanStep === 3) planFinish.focus();
});
planDialog.addEventListener("keydown", event => {
  if (event.key !== "Tab") return;
  const firstButton = document.querySelector("#plan-confirm-cancel");
  const lastButton = document.querySelector("#plan-confirm-submit");
  if (event.shiftKey && document.activeElement === firstButton) {
    event.preventDefault();
    lastButton.focus();
  } else if (!event.shiftKey && document.activeElement === lastButton) {
    event.preventDefault();
    firstButton.focus();
  }
});
document.querySelector("#plan-restart").addEventListener("click", restartPlan);
syncPlanDateField();

// 확정한 계획을 보관하고 실제 과제의 진행 상태를 관리합니다.
const savedStorageKey = "moabom.tasks.v1";
const savedSection = document.querySelector("#my-tasks");
const savedHeading = document.querySelector("#saved-heading");
const savedFilter = document.querySelector("#saved-filter");
const savedList = document.querySelector("#saved-task-list");
const savedEmpty = document.querySelector("#saved-empty");
const savedStorageMessage = document.querySelector("#saved-storage-message");
const savedListMessage = document.querySelector("#saved-list-message");
const savedDialog = document.querySelector("#saved-task-dialog");
const savedDetailActions = document.querySelector("#saved-detail-actions");
const savedDeleteConfirm = document.querySelector("#saved-delete-confirm");
const savedToggleStatus = document.querySelector("#saved-toggle-status");
const savedDetailFeedback = document.querySelector("#saved-detail-feedback");
const planSaveButton = document.querySelector("#plan-save-button");
const planViewList = document.querySelector("#plan-view-list");
const planSaveMessage = document.querySelector("#plan-save-message");
let savedTasks = [];
let storageWritable = true;
let detailTaskId = null;

function showStorageWarning(message) {
  savedStorageMessage.textContent = message;
  savedStorageMessage.hidden = false;
}

function validSavedTask(task) {
  if (!task || typeof task !== "object") return false;
  const validDate = task.deadline === "" ||
    (typeof task.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(task.deadline) &&
      !Number.isNaN(Date.parse(task.deadline)) && new Date(task.deadline).toISOString().slice(0, 10) === task.deadline);
  return typeof task.id === "string" && /^[a-z0-9-]+$/.test(task.id) &&
    typeof task.title === "string" && task.title.trim().length > 0 && task.title.length <= 60 &&
    typeof task.course === "string" && task.course.length <= 30 &&
    validDate && typeof task.completed === "boolean";
}

function loadSavedTasks() {
  try {
    const raw = localStorage.getItem(savedStorageKey);
    if (raw === null) return;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !Array.isArray(data.tasks) ||
        !data.tasks.every(validSavedTask) || new Set(data.tasks.map(task => task.id)).size !== data.tasks.length) {
      throw new Error("Invalid saved task data");
    }
    savedTasks = data.tasks;
  } catch {
    storageWritable = false;
    showStorageWarning("저장된 목록을 읽지 못했어요. 기존 데이터는 덮어쓰지 않습니다. 지금 추가하는 과제는 이 화면에서만 사용할 수 있어요.");
  }
}

function persistSavedTasks() {
  if (!storageWritable) return false;
  try {
    localStorage.setItem(savedStorageKey, JSON.stringify({ version: 1, tasks: savedTasks }));
    return true;
  } catch {
    storageWritable = false;
    showStorageWarning("변경 내용을 이 브라우저에 저장하지 못했어요. 현재 화면에서는 사용할 수 있지만, 새로고침하면 이번 변경이 사라질 수 있어요.");
    return false;
  }
}

function savedNode(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function renderSavedTasks() {
  const doneCount = savedTasks.filter(task => task.completed).length;
  document.querySelector("#saved-count").textContent = `전체 ${savedTasks.length}개 · 진행 중 ${savedTasks.length - doneCount}개 · 완료 ${doneCount}개`;
  const visibleTasks = savedTasks.filter(task => savedFilter.value === "all" ||
    (savedFilter.value === "done" ? task.completed : !task.completed));
  visibleTasks.sort((a, b) => (a.deadline || "9999-99-99").localeCompare(b.deadline || "9999-99-99"));
  savedList.replaceChildren();
  visibleTasks.forEach(function (task) {
    const card = savedNode("li", "saved-task-card", "");
    card.dataset.taskId = task.id;
    card.classList.toggle("is-complete", task.completed);
    const status = savedNode("span", "saved-status", task.completed ? "완료" : "진행 중");
    const title = savedNode("h3", "saved-task-title", task.title);
    const course = savedNode("p", "saved-course", task.course || "과목 미지정");
    const deadline = savedNode("p", "saved-deadline", task.deadline || "마감일 없음");
    const openButton = savedNode("button", "secondary-button", "다시 열기");
    openButton.type = "button";
    openButton.id = `saved-open-${task.id}`;
    openButton.dataset.action = "open";
    openButton.setAttribute("aria-label", `과제 열기: ${task.title}`);
    openButton.addEventListener("click", () => openSavedTask(task.id));
    card.append(status, title, course, deadline, openButton);
    savedList.append(card);
  });
  document.querySelector("#saved-result").textContent = `${visibleTasks.length}개 표시`;
  savedEmpty.hidden = visibleTasks.length > 0;
  const hasTasks = savedTasks.length > 0;
  document.querySelector("#saved-empty-title").textContent = !hasTasks ? "아직 추가한 과제가 없어요" :
    savedFilter.value === "done" ? "완료한 과제가 없어요" : "진행 중인 과제가 없어요";
  document.querySelector("#saved-empty-help").textContent = hasTasks ?
    "다른 상태의 과제를 확인하려면 전체 과제 보기를 눌러 주세요." :
    "계획을 확정한 뒤 ‘내 과제에 추가’를 눌러 첫 과제를 담아 보세요.";
  document.querySelector("#saved-first-plan").hidden = hasTasks;
  document.querySelector("#saved-show-all").hidden = !hasTasks;
}

function addPlanToList() {
  if (currentPlanStep !== 4 || !confirmedPlan || currentSavedTaskId) return;
  const existing = savedTasks.find(task => task.title === confirmedPlan.title &&
    task.course === confirmedPlan.course && task.deadline === confirmedPlan.deadline);
  let message;
  if (existing) {
    currentSavedTaskId = existing.id;
    message = "같은 계획이 이미 목록에 있어요. 기존 과제를 확인해 주세요.";
  } else {
    const task = { ...confirmedPlan, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`, completed: false };
    savedTasks.push(task);
    currentSavedTaskId = task.id;
    const stored = persistSavedTasks();
    message = stored ? "내 과제 목록에 추가했어요." : "내 과제 목록에 추가했어요. 저장하지 못해 현재 화면에서만 사용할 수 있어요.";
  }
  planSaveButton.disabled = true;
  planSaveButton.textContent = "목록에 추가됨";
  planViewList.disabled = false;
  planSaveMessage.textContent = message;
  renderSavedTasks();
}

function viewSavedList() {
  savedFilter.value = "all";
  renderSavedTasks();
  savedSection.scrollIntoView({ block: "start" });
  const target = document.getElementById(`saved-open-${currentSavedTaskId}`);
  (target || savedHeading).focus({ preventScroll: true });
}

function newPlanFromList() {
  planStarted = true;
  planFlow.hidden = false;
  planStart.setAttribute("aria-expanded", "true");
  planStart.textContent = "계획 이어서 보기";
  restartPlan();
}

function renderSavedDetail(task) {
  document.querySelector("#saved-detail-title").textContent = task.title;
  document.querySelector("#saved-detail-course").textContent = task.course || "과목 미지정";
  document.querySelector("#saved-detail-deadline").textContent = task.deadline || "마감일 없음";
  document.querySelector("#saved-detail-status").textContent = task.completed ? "완료" : "진행 중";
  savedToggleStatus.textContent = task.completed ? "진행 중으로 되돌리기" : "완료로 표시";
}

function openSavedTask(id) {
  const task = savedTasks.find(item => item.id === id);
  if (!task) return;
  detailTaskId = id;
  savedDetailFeedback.textContent = "";
  savedDeleteConfirm.hidden = true;
  savedDetailActions.hidden = false;
  renderSavedDetail(task);
  savedDialog.showModal();
  document.querySelector("#saved-close").focus();
}

function toggleSavedStatus() {
  const task = savedTasks.find(item => item.id === detailTaskId);
  if (!task) return;
  task.completed = !task.completed;
  const stored = persistSavedTasks();
  renderSavedTasks();
  renderSavedDetail(task);
  savedDetailFeedback.textContent = (task.completed ? "완료로 표시했어요." : "진행 중으로 되돌렸어요.") +
    (stored ? "" : " 이번 변경은 저장하지 못했어요.");
}

function cancelSavedDelete() {
  savedDeleteConfirm.hidden = true;
  savedDetailActions.hidden = false;
  document.querySelector("#saved-delete").focus();
}

function deleteSavedTask() {
  savedTasks = savedTasks.filter(task => task.id !== detailTaskId);
  const stored = persistSavedTasks();
  if (currentSavedTaskId === detailTaskId) {
    currentSavedTaskId = null;
    planSaveButton.disabled = false;
    planSaveButton.textContent = "내 과제에 추가";
    planViewList.disabled = true;
    planSaveMessage.textContent = "목록에서 삭제했어요. 필요하면 이 계획을 다시 추가할 수 있어요.";
  }
  renderSavedTasks();
  savedListMessage.textContent = "과제를 목록에서 삭제했어요." + (stored ? "" : " 이번 변경은 저장하지 못했어요.");
  savedDialog.close();
}

planSaveButton.addEventListener("click", addPlanToList);
planViewList.addEventListener("click", viewSavedList);
savedFilter.addEventListener("change", () => {
  savedListMessage.textContent = "";
  renderSavedTasks();
});
document.querySelector("#saved-show-all").addEventListener("click", () => {
  savedFilter.value = "all";
  renderSavedTasks();
  savedFilter.focus();
});
document.querySelector("#saved-new-plan").addEventListener("click", newPlanFromList);
document.querySelector("#saved-first-plan").addEventListener("click", newPlanFromList);
savedToggleStatus.addEventListener("click", toggleSavedStatus);
document.querySelector("#saved-close").addEventListener("click", () => savedDialog.close());
document.querySelector("#saved-delete").addEventListener("click", () => {
  savedDetailActions.hidden = true;
  savedDeleteConfirm.hidden = false;
  document.querySelector("#saved-delete-cancel").focus();
});
document.querySelector("#saved-delete-cancel").addEventListener("click", cancelSavedDelete);
document.querySelector("#saved-delete-submit").addEventListener("click", deleteSavedTask);
savedDialog.addEventListener("cancel", event => {
  if (!savedDeleteConfirm.hidden) {
    event.preventDefault();
    cancelSavedDelete();
  }
});
savedDialog.addEventListener("close", () => {
  const returnButton = document.getElementById(`saved-open-${detailTaskId}`);
  (returnButton || savedHeading).focus();
  detailTaskId = null;
});
savedDialog.addEventListener("keydown", event => {
  if (event.key !== "Tab") return;
  const buttons = [...savedDialog.querySelectorAll("button:not([disabled])")].filter(button => button.getClientRects().length);
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
});
loadSavedTasks();
renderSavedTasks();
