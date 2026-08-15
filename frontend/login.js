/**
 * login.js
 * Handles the login form: validation, API call, and redirect.
 */

// If the user is already logged in, skip this page entirely.
redirectIfLoggedIn();

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const formAlert = document.getElementById("formAlert");
const togglePassword = document.getElementById("togglePassword");

/* -------------------- Show/hide password -------------------- */

togglePassword.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePassword.textContent = isHidden ? "🙈" : "👁";
  togglePassword.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
});

/* -------------------- Helpers -------------------- */

function showAlert(message) {
  formAlert.textContent = message;
  formAlert.classList.add("is-visible");
}

function hideAlert() {
  formAlert.classList.remove("is-visible");
  formAlert.textContent = "";
}

function setFieldError(input, errorEl, message) {
  input.classList.toggle("has-error", Boolean(message));
  errorEl.textContent = message || "";
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
}

function validate() {
  let isValid = true;

  if (!emailInput.value.trim()) {
    setFieldError(emailInput, document.getElementById("emailError"), "Email is required.");
    isValid = false;
  } else {
    setFieldError(emailInput, document.getElementById("emailError"), "");
  }

  if (!passwordInput.value) {
    setFieldError(passwordInput, document.getElementById("passwordError"), "Password is required.");
    isValid = false;
  } else {
    setFieldError(passwordInput, document.getElementById("passwordError"), "");
  }

  return isValid;
}

/* -------------------- Submit -------------------- */

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  if (!validate()) return;

  setLoading(true);

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: emailInput.value.trim(),
        password: passwordInput.value,
      },
    });

    if (data && data.status && data.token) {
      saveSession(data.token, data.user);
      redirectByRole(data.user.role);
    } else {
      showAlert((data && data.message) || "Login failed. Please try again.");
    }
  } catch (err) {
    showAlert(err.message);
  } finally {
    setLoading(false);
  }
});
