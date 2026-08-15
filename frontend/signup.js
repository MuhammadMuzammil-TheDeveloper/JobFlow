/**
 * signup.js
 * Handles the signup form: live password strength, validation,
 * API call, and handoff to the email verification page.
 */

redirectIfLoggedIn();

const signupForm = document.getElementById("signupForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const roleSelect = document.getElementById("role");
const submitBtn = document.getElementById("submitBtn");
const formAlert = document.getElementById("formAlert");

/* -------------------- Show/hide password (both fields) -------------------- */

document.querySelectorAll(".toggle-visibility").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);
    const isHidden = target.type === "password";
    target.type = isHidden ? "text" : "password";
    btn.textContent = isHidden ? "🙈" : "👁";
    btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
});

/* -------------------- Password requirements + strength -------------------- */

const requirementChecks = {
  reqLength: (pw) => pw.length >= 8,
  reqUpper: (pw) => /[A-Z]/.test(pw),
  reqLower: (pw) => /[a-z]/.test(pw),
  reqNumber: (pw) => /[0-9]/.test(pw),
};

function updatePasswordUI() {
  const pw = passwordInput.value;
  let metCount = 0;

  Object.entries(requirementChecks).forEach(([id, check]) => {
    const met = check(pw);
    if (met) metCount++;
    document.getElementById(id).classList.toggle("is-met", met);
  });

  const bars = ["bar1", "bar2", "bar3", "bar4"];
  const colors = ["#ef4444", "#f59e0b", "#f59e0b", "#10b981"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  bars.forEach((id, i) => {
    document.getElementById(id).style.background = i < metCount ? colors[metCount - 1] : "";
  });

  const label = document.getElementById("strengthLabel");
  label.textContent = pw ? `Password strength: ${labels[Math.max(metCount - 1, 0)]}` : "Password strength";

  return metCount === 4;
}

passwordInput.addEventListener("input", updatePasswordUI);

/* -------------------- Helpers -------------------- */

function showAlert(message) {
  formAlert.textContent = message;
  formAlert.classList.add("is-visible");
}

function hideAlert() {
  formAlert.classList.remove("is-visible");
  formAlert.textContent = "";
}

function setFieldError(input, errorId, message) {
  input.classList.toggle("has-error", Boolean(message));
  document.getElementById(errorId).textContent = message || "";
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
}

function validate() {
  let isValid = true;

  if (!fullNameInput.value.trim()) {
    setFieldError(fullNameInput, "fullNameError", "Full name is required.");
    isValid = false;
  } else {
    setFieldError(fullNameInput, "fullNameError", "");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(emailInput.value.trim())) {
    setFieldError(emailInput, "emailError", "Enter a valid email address.");
    isValid = false;
  } else {
    setFieldError(emailInput, "emailError", "");
  }

  const passwordStrongEnough = updatePasswordUI();
  if (!passwordStrongEnough) {
    setFieldError(passwordInput, "passwordError", "Password does not meet all requirements.");
    isValid = false;
  } else {
    setFieldError(passwordInput, "passwordError", "");
  }

  if (confirmPasswordInput.value !== passwordInput.value || !confirmPasswordInput.value) {
    setFieldError(confirmPasswordInput, "confirmPasswordError", "Passwords do not match.");
    isValid = false;
  } else {
    setFieldError(confirmPasswordInput, "confirmPasswordError", "");
  }

  return isValid;
}

/* -------------------- Submit -------------------- */

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  if (!validate()) return;

  setLoading(true);

  try {
    const data = await apiRequest("/signup", {
      method: "POST",
      body: {
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        confirmPassword: confirmPasswordInput.value,
        role: roleSelect.value,
      },
    });

    if (data && data.status) {
      // Pass the email to the verification page via sessionStorage —
      // avoids putting a real email address in the URL/query string.
      sessionStorage.setItem("cf_pending_verification_email", emailInput.value.trim());
      window.location.href = "verify-email.html";
    } else {
      showAlert((data && data.message) || "Could not create account. Please try again.");
    }
  } catch (err) {
    showAlert(err.message);
  } finally {
    setLoading(false);
  }
});
