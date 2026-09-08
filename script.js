

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  if (registerForm) setupRegisterForm(registerForm);
  if (loginForm) setupLoginForm(loginForm);
});


function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setError(groupId, hasError) {
  const group = document.getElementById(groupId);
  if (group) group.classList.toggle("has-error", hasError);
}

function showBanner(message) {
  const banner = document.getElementById("authBanner");
  if (!banner) return;
  banner.textContent = message;
  banner.classList.add("show");
}

function setupRegisterForm(form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    const nameOk = name.length > 0;
    const emailOk = isValidEmail(email);
    const passwordOk = password.length >= 6;
    const confirmOk = passwordOk && confirmPassword === password;

    setError("nameGroup", !nameOk);
    setError("emailGroup", !emailOk);
    setError("passwordGroup", !passwordOk);
    setError("confirmPasswordGroup", !confirmOk);

    if (!nameOk || !emailOk || !passwordOk || !confirmOk) return;

   
    localStorage.setItem("spendwise_username", name);

    showBanner("Account created! Redirecting to your dashboard...");
    setTimeout(() => { window.location.href = "dashboard.html"; }, 900);
  });
}

function setupLoginForm(form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    const emailOk = isValidEmail(email);
    const passwordOk = password.length > 0;

    setError("loginEmailGroup", !emailOk);
    setError("loginPasswordGroup", !passwordOk);

    if (!emailOk || !passwordOk) return;

    showBanner("Login successful! Redirecting to your dashboard...");
    setTimeout(() => { window.location.href = "dashboard.html"; }, 900);
  });
}