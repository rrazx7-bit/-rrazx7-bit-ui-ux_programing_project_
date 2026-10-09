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
