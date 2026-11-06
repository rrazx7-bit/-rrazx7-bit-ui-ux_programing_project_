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

// 하나의 폼에서 입력·조건 검사·확정·목록 저장을 이어갑니다.
const planStart = document.querySelector("#plan-start");
const planFlow = document.querySelector("#plan-flow");
const planForm = document.querySelector("#plan-form");
const planSteps = document.querySelectorAll(".plan-step");
const planProgress = document.querySelector("#plan-progress");
const planTitle = document.querySelector("#plan-title");
const planTitleField = document.querySelector("#plan-title-field");
const planTitleCount = document.querySelector("#plan-title-count");
const planTitleFeedback = document.querySelector("#plan-title-feedback");
const planCourse = document.querySelector("#plan-course");
const planMode = document.querySelector("#plan-deadline-mode");
const planDate = document.querySelector("#plan-date");
const planDateField = document.querySelector("#plan-date-field");
const planTitleError = document.querySelector("#plan-title-error");
const planCourseError = document.querySelector("#plan-course-error");
const planModeError = document.querySelector("#plan-mode-error");
const planDateError = document.querySelector("#plan-date-error");
const planDialog = document.querySelector("#plan-confirm");
const planConfirmSubmit = document.querySelector("#plan-confirm-submit");
const planFinish = document.querySelector("#plan-finish");
const planEdit = document.querySelector("#plan-edit");
const planSummaryFields = [
  ["#plan-summary-title", "#plan-done-title-text"],
  ["#plan-summary-course", "#plan-done-course"],
  ["#plan-summary-deadline", "#plan-done-deadline"]
];
let currentPlanStep = 1;
let planStarted = false;
let confirmedPlan = null;
let currentSavedTaskId = null;
let planSubmitState = "idle";
let lockedPlanControls = [];

function showPlanStep(step) {
  markDestination("plan-flow");
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

function setPlanError(input, message, text) {
  input.classList.toggle("has-error", Boolean(text));
  if (text) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
  if (message.textContent !== text) message.textContent = text;
}

function titleProblem() {
  if (!planTitle.value.trim()) return "과제 이름을 입력해 주세요.";
  if (planTitle.value.trim().length < 2) return "과제 이름을 2자 이상 입력해 주세요.";
  if (planTitle.value.length > 60) return "과제 이름을 60자 이내로 줄여 주세요.";
  return "";
}

function courseProblem() {
  return planCourse.value.length > 30 ? "과목을 30자 이내로 줄여 주세요." : "";
}

function modeProblem() {
  return ["date", "none"].includes(planMode.value) ? "" : "마감 방식을 선택해 주세요.";
}

function dateProblem() {
  if (planMode.value !== "date") return "";
  if (!planDate.value) return "마감일을 선택해 주세요.";
  if (!planDate.validity.valid || !/^\d{4}-\d{2}-\d{2}$/.test(planDate.value)) {
    return "올바른 날짜를 선택해 주세요. 연도는 네 자리까지 입력할 수 있어요.";
  }
  return "";
}

function updatePlanTitleFeedback() {
  const problem = titleProblem();
  planTitleCount.textContent = `${planTitle.value.length} / 60자`;
  planTitleField.classList.toggle("is-valid", !problem);
  const feedback = problem ? "" : "입력 조건을 충족했어요.";
  if (planTitleFeedback.textContent !== feedback) planTitleFeedback.textContent = feedback;
  // 처음 입력할 때는 조건만 안내하고, 이미 표시한 오류는 유효해질 때 해제합니다.
  if (planTitleError.textContent) setPlanError(planTitle, planTitleError, problem);
}

function syncPlanDateField() {
  const needsDate = planMode.value === "date";
  planMode.setAttribute("aria-expanded", String(needsDate));
  planDateField.hidden = !needsDate;
  planDate.disabled = !needsDate;
  planDate.required = needsDate;
  if (planModeError.textContent) setPlanError(planMode, planModeError, modeProblem());
  if (!needsDate) {
    planDate.value = "";
    clearPlanError(planDate, planDateError);
  }
}

// 항목을 순서대로 검사한 뒤 오류가 있는 단계와 첫 입력칸으로 돌아갑니다.
function validatePlan(includeOptions) {
  updatePlanTitleFeedback();
  const fields = [
    [planTitle, planTitleError, titleProblem(), 1],
    [planCourse, planCourseError, courseProblem(), 1]
  ];
  if (includeOptions) fields.push(
    [planMode, planModeError, modeProblem(), 2],
    [planDate, planDateError, dateProblem(), 2]
  );
  fields.forEach(([input, error, problem]) => setPlanError(input, error, problem));
  const firstError = fields.find(([, , problem]) => problem);
  if (!firstError) return true;
  if (planDialog.open) planDialog.close();
  showPlanStep(firstError[3]);
  firstError[0].focus();
  return false;
}

function collectPlan() {
  const data = new FormData(planForm);
  return {
    title: String(data.get("title") || "").trim(),
    course: String(data.get("course") || "").trim(),
    deadline: data.get("deadline-mode") === "date" ? String(data.get("deadline") || "") : ""
  };
}

function renderPlanSummary() {
  const plan = collectPlan();
  const values = [plan.title, plan.course || "미지정", plan.deadline || "마감일 없음"];
  planSummaryFields.forEach(function (selectors, index) {
    selectors.forEach(function (selector) {
      document.querySelector(selector).textContent = values[index];
    });
  });
}

function startPlan() {
  if (planSubmitState === "loading") return;
  if (!planStarted) {
    planTitle.value = taskNameInput.value.trim();
    planStarted = true;
    updatePlanTitleFeedback();
  }
  planFlow.hidden = false;
  planStart.setAttribute("aria-expanded", "true");
  planStart.textContent = "계획 이어서 보기";
  showPlanStep(currentPlanStep);
}

function setPlanSubmitState(state, message) {
  if (state === "loading") {
    const controls = [...planForm.querySelectorAll("input, select, button"), planStart,
      document.querySelector("#saved-new-plan"), document.querySelector("#saved-first-plan")];
    lockedPlanControls = controls.map(control => [control, control.disabled]);
    controls.forEach(control => { control.disabled = true; });
  } else {
    lockedPlanControls.forEach(([control, wasDisabled]) => { control.disabled = wasDisabled; });
    lockedPlanControls = [];
    planSaveButton.disabled = state === "success";
    planViewList.disabled = state !== "success";
    planEdit.disabled = state === "success";
  }
  planSubmitState = state;
  planForm.setAttribute("aria-busy", String(state === "loading"));
  planSaveMessage.dataset.state = state;
  planSaveMessage.textContent = message;
  planSaveButton.textContent = state === "loading" ? "저장 중…" :
    state === "success" ? "목록에 추가됨" : state === "error" ? "다시 저장하기" : "내 과제에 추가";
}

function resetPlanSubmission() {
  confirmedPlan = null;
  currentSavedTaskId = null;
  setPlanSubmitState("idle", "목록에 추가하면 이 브라우저에서 다시 열 수 있어요.");
}

function restartPlan() {
  if (planSubmitState === "loading") return;
  resetPlanSubmission();
  planForm.reset();
  [[planTitle, planTitleError], [planCourse, planCourseError], [planMode, planModeError], [planDate, planDateError]]
    .forEach(([input, error]) => clearPlanError(input, error));
  syncPlanDateField();
  updatePlanTitleFeedback();
  planSummaryFields.forEach(function (selectors) {
    selectors.forEach(function (selector) {
      document.querySelector(selector).textContent = "";
    });
  });
  showPlanStep(1);
}

function handlePlanSubmit(event) {
  event.preventDefault();
  if (planSubmitState === "loading" || (currentPlanStep === 4 && currentSavedTaskId)) return;
  if (!validatePlan(currentPlanStep !== 1)) return;
  if (currentPlanStep === 1) {
    planTitle.value = planTitle.value.trim();
    planCourse.value = planCourse.value.trim();
    updatePlanTitleFeedback();
    showPlanStep(2);
  } else if (currentPlanStep === 2) {
    renderPlanSummary();
    showPlanStep(3);
  } else if (currentPlanStep === 3) {
    renderPlanSummary();
    if (event.submitter === planConfirmSubmit && planDialog.open) {
      confirmedPlan = collectPlan();
      planDialog.close();
      showPlanStep(4);
    } else if (!planDialog.open) {
      planDialog.showModal();
    }
  } else if (currentPlanStep === 4) {
    confirmedPlan = collectPlan();
    renderPlanSummary();
    addPlanToList();
  }
}

planStart.addEventListener("click", startPlan);
planForm.addEventListener("submit", handlePlanSubmit);
// 텍스트 입력의 Enter도 같은 submit 경로를 사용합니다. 한글 조합 중 Enter는 제외합니다.
planForm.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.isComposing && event.target.matches('input[type="text"]')) {
    event.preventDefault();
    planForm.requestSubmit();
  }
});
["#plan-next-details", "#plan-next-options"].forEach(selector => {
  document.querySelector(selector).addEventListener("click", () => planForm.requestSubmit());
});
planTitle.addEventListener("input", updatePlanTitleFeedback);
planCourse.addEventListener("input", () => {
  if (planCourseError.textContent) setPlanError(planCourse, planCourseError, courseProblem());
});
planMode.addEventListener("change", syncPlanDateField);
planDate.addEventListener("input", () => {
  if (planDateError.textContent) setPlanError(planDate, planDateError, dateProblem());
});
document.querySelector("#plan-back-options").addEventListener("click", () => showPlanStep(1));
document.querySelector("#plan-back-review").addEventListener("click", () => showPlanStep(2));
planEdit.addEventListener("click", () => {
  if (planSubmitState === "loading" || currentSavedTaskId) return;
  resetPlanSubmission();
  showPlanStep(1);
});
document.querySelector("#plan-confirm-cancel").addEventListener("click", () => planDialog.close());
planDialog.addEventListener("close", () => {
  if (closedForNavigation.delete(planDialog)) return;
  if (currentPlanStep === 3) planFinish.focus();
});
planDialog.addEventListener("keydown", event => {
  if (event.key !== "Tab") return;
  const firstButton = document.querySelector("#plan-confirm-cancel");
  if (event.shiftKey && document.activeElement === firstButton) {
    event.preventDefault();
    planConfirmSubmit.focus();
  } else if (!event.shiftKey && document.activeElement === planConfirmSubmit) {
    event.preventDefault();
    firstButton.focus();
  }
});
document.querySelector("#plan-restart").addEventListener("click", restartPlan);
syncPlanDateField();
updatePlanTitleFeedback();

// 확정한 계획을 보관하고 실제 과제의 진행 상태를 관리합니다.
const savedStorageKey = "moabom.tasks.v1";
const savedSection = document.querySelector("#my-tasks");
const savedHeading = document.querySelector("#saved-heading");
const savedFilterButtons = document.querySelectorAll("#saved-filter button[data-filter]");
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
let currentFilter = "all";
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
    if (raw === null) {
      savedTasks = [];
      storageWritable = true;
      savedStorageMessage.hidden = true;
      savedStorageMessage.textContent = "";
      return;
    }
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !Array.isArray(data.tasks) ||
        !data.tasks.every(validSavedTask) || new Set(data.tasks.map(task => task.id)).size !== data.tasks.length) {
      throw new Error("Invalid saved task data");
    }
    savedTasks = data.tasks;
    storageWritable = true;
    savedStorageMessage.hidden = true;
    savedStorageMessage.textContent = "";
  } catch {
    storageWritable = false;
    showStorageWarning("저장된 목록을 읽지 못했어요. 기존 데이터를 보호하기 위해 새 과제를 저장하지 않습니다. 브라우저의 저장 설정과 기존 데이터를 확인해 주세요.");
  }
}

function persistSavedTasks(tasks = savedTasks) {
  if (!storageWritable) return false;
  try {
    localStorage.setItem(savedStorageKey, JSON.stringify({ version: 1, tasks }));
    savedStorageMessage.hidden = true;
    savedStorageMessage.textContent = "";
    return true;
  } catch {
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
  savedFilterButtons.forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === currentFilter));
  });
  const doneCount = savedTasks.filter(task => task.completed).length;
  document.querySelector("#saved-count").textContent = `전체 ${savedTasks.length}개 · 진행 중 ${savedTasks.length - doneCount}개 · 완료 ${doneCount}개`;
  const visibleTasks = savedTasks.filter(task => currentFilter === "all" ||
    (currentFilter === "done" ? task.completed : !task.completed));
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
    currentFilter === "done" ? "완료한 과제가 없어요" : "진행 중인 과제가 없어요";
  document.querySelector("#saved-empty-help").textContent = hasTasks ?
    "다른 상태의 과제를 확인하려면 전체 과제 보기를 눌러 주세요." :
    "계획을 확정한 뒤 ‘내 과제에 추가’를 눌러 첫 과제를 담아 보세요.";
  document.querySelector("#saved-first-plan").hidden = hasTasks;
  document.querySelector("#saved-show-all").hidden = !hasTasks;
}

async function addPlanToList() {
  if (currentPlanStep !== 4 || !confirmedPlan || currentSavedTaskId || planSubmitState === "loading") return;
  const plan = { ...confirmedPlan };
  setPlanSubmitState("loading", "과제 목록에 저장하고 있어요. 잠시 기다려 주세요.");
  // 저장 안내가 화면에 표시된 뒤 브라우저 저장 결과를 확인합니다.
  await new Promise(resolve => window.setTimeout(resolve, 400));
  if (!storageWritable) loadSavedTasks();
  const existing = savedTasks.find(task => task.title === plan.title &&
    task.course === plan.course && task.deadline === plan.deadline);
  if (existing) {
    currentSavedTaskId = existing.id;
    setPlanSubmitState("success", "같은 계획이 이미 목록에 있어요. 기존 과제를 확인해 주세요.");
  } else {
    const task = { ...plan, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`, completed: false };
    const nextTasks = [...savedTasks, task];
    // 성공한 경우에만 화면 목록을 바꿔 실패한 저장을 완료로 안내하지 않습니다.
    if (!persistSavedTasks(nextTasks)) {
      showStorageWarning(storageWritable ?
        "새 과제를 저장하지 못했어요. 작성한 내용은 그대로 남아 있어요. 브라우저의 저장 권한과 여유 공간을 확인한 뒤 다시 저장해 주세요." :
        "기존 목록을 읽지 못해 새 과제를 저장하지 못했어요. 원본은 덮어쓰지 않았습니다. 브라우저의 저장 설정과 기존 데이터를 확인해 주세요.");
      setPlanSubmitState("error", "저장하지 못했어요. 작성한 내용은 그대로예요. 브라우저의 저장 설정과 여유 공간을 확인한 뒤 ‘다시 저장하기’를 눌러 주세요.");
      if (location.hash === "#plan-flow") planSaveButton.focus({ preventScroll: true });
      return;
    }
    savedTasks = nextTasks;
    currentSavedTaskId = task.id;
    setPlanSubmitState("success", "내 과제 목록에 추가했어요.");
  }
  renderSavedTasks();
  if (location.hash === "#plan-flow") planViewList.focus({ preventScroll: true });
}

function selectSavedFilter(filter) {
  currentFilter = filter;
  savedListMessage.textContent = "";
  renderSavedTasks();
}

function viewSavedList() {
  markDestination("my-tasks");
  selectSavedFilter("all");
  savedSection.scrollIntoView({ block: "start" });
  const target = document.getElementById(`saved-open-${currentSavedTaskId}`);
  (target || savedHeading).focus({ preventScroll: true });
}

function newPlanFromList() {
  if (planSubmitState === "loading") return;
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
    setPlanSubmitState("idle", "목록에서 삭제했어요. 필요하면 이 계획을 다시 추가할 수 있어요.");
  }
  renderSavedTasks();
  savedListMessage.textContent = "과제를 목록에서 삭제했어요." + (stored ? "" : " 이번 변경은 저장하지 못했어요.");
  savedDialog.close();
}

planViewList.addEventListener("click", viewSavedList);
savedFilterButtons.forEach(button => {
  button.addEventListener("click", () => selectSavedFilter(button.dataset.filter));
});
document.querySelector("#saved-show-all").addEventListener("click", () => {
  selectSavedFilter("all");
  document.querySelector('#saved-filter [data-filter="all"]').focus();
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
  if (!closedForNavigation.delete(savedDialog)) (returnButton || savedHeading).focus();
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

// 메뉴 링크, 계획 시작 버튼, 목록 보기 버튼이 같은 주소 체계를 사용합니다.
const navigationBar = document.querySelector("#navigation-bar");
const mainNav = document.querySelector("#main-nav");
const menuToggle = document.querySelector("#menu-toggle");
const mobileNavTools = document.querySelector("#mobile-nav-tools");
const navLocation = document.querySelector("#nav-location");
const closedForNavigation = new Set();
const destinations = new Map([...mainNav.querySelectorAll("a")].map(link => {
  const id = link.hash.slice(1);
  return [id, { link, section: document.getElementById(id) }];
}));
let trackingScroll = false;
let scrollFrame = 0;

function paintDestination(id) {
  for (const [key, { link }] of destinations) {
    const selected = key === id;
    link.classList.toggle("is-current", selected);
    if (selected) {
      link.setAttribute("aria-current", "location");
      navLocation.textContent = link.textContent;
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function markDestination(id) {
  trackingScroll = false;
  if (location.hash !== "#" + id) history.pushState(null, "", "#" + id);
  paintDestination(id);
}

function setMenuOpen(open) {
  open = smallScreen.matches && open;
  mobileNavTools.hidden = !smallScreen.matches;
  mainNav.hidden = smallScreen.matches && !open;
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.textContent = open ? "메뉴 닫기" : "메뉴 열기";
  if (!open) {
    document.documentElement.style.setProperty("--nav-height", navigationBar.offsetHeight + "px");
  }
}

function visitSection(id) {
  if (!destinations.has(id)) return;
  const { section } = destinations.get(id);
  if (id === "plan-flow" && planSubmitState !== "loading") {
    startPlan();
    return;
  }
  section.scrollIntoView({ block: "start" });
  const heading = section.querySelector("h2");
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

function restoreDestination() {
  trackingScroll = false;
  for (const dialog of document.querySelectorAll("dialog[open]")) {
    closedForNavigation.add(dialog);
    dialog.close();
  }
  setMenuOpen(false);
  const id = location.hash.slice(1);
  paintDestination(destinations.has(id) ? id : "about");
  if (destinations.has(id)) visitSection(id);
}

mainNav.addEventListener("click", event => {
  const link = event.target.closest("a");
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const id = link.hash.slice(1);
  setMenuOpen(false);
  markDestination(id);
  visitSection(id);
});

menuToggle.addEventListener("click", () => setMenuOpen(mainNav.hidden));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && smallScreen.matches && !mainNav.hidden) {
    setMenuOpen(false);
    menuToggle.focus();
    event.preventDefault();
  }
});
navigationBar.addEventListener("focusout", event => {
  if (smallScreen.matches && !navigationBar.contains(event.relatedTarget)) setMenuOpen(false);
});
document.addEventListener("pointerdown", event => {
  if (smallScreen.matches && !mainNav.hidden && !navigationBar.contains(event.target)) setMenuOpen(false);
});
smallScreen.addEventListener("change", () => {
  const focusInNav = mainNav.contains(document.activeElement);
  const focusOnToggle = document.activeElement === menuToggle;
  setMenuOpen(false);
  if (smallScreen.matches && focusInNav) menuToggle.focus({ preventScroll: true });
  if (!smallScreen.matches && focusOnToggle) mainNav.querySelector("[aria-current]").focus({ preventScroll: true });
});
window.addEventListener("hashchange", restoreDestination);
window.addEventListener("pageshow", event => { if (event.persisted) restoreDestination(); });

// 직접 스크롤할 때도 보이는 영역을 표시하되, 방문 기록을 구역마다 늘리지 않습니다.
function beginScroll(event) {
  if (menuToggle.getAttribute("aria-expanded") === "true" || document.querySelector("dialog[open]")) return;
  if (event.type === "keydown" && (!["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", " "].includes(event.key)
      || event.target.closest("input, select, textarea, button, [role=tablist]"))) return;
  if (event.type === "pointerdown" && event.clientX < document.documentElement.clientWidth) return;
  trackingScroll = true;
}
for (const name of ["wheel", "touchmove", "pointerdown", "keydown"]) {
  window.addEventListener(name, beginScroll, { passive: true });
}
function syncVisibleSection() {
    scrollFrame = 0;
    if (!trackingScroll) return;
    const top = navigationBar.offsetHeight + 32;
    let id = "about";
    for (const [key, { section }] of destinations) {
      if (!section.hidden && section.getBoundingClientRect().top <= top) id = key;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) id = "signup";
    if (location.hash !== "#" + id) {
      history.replaceState(history.state, "", "#" + id);
      paintDestination(id);
    }
}
window.addEventListener("scroll", () => {
  if (trackingScroll && !scrollFrame) scrollFrame = requestAnimationFrame(syncVisibleSection);
}, { passive: true });
window.addEventListener("scrollend", () => {
  cancelAnimationFrame(scrollFrame);
  syncVisibleSection();
  trackingScroll = false;
});

document.querySelector("#plan-nav-item").hidden = false;
navigationBar.classList.add("is-ready");
restoreDestination();
new ResizeObserver(() => {
  if (menuToggle.getAttribute("aria-expanded") === "false") {
    document.documentElement.style.setProperty("--nav-height", navigationBar.offsetHeight + "px");
  }
}).observe(navigationBar);
