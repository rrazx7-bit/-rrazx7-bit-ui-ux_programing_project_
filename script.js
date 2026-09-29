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
