/* ==========================================================
   CareerFlow — Login Page Logic

   ⚠️ INCOMPLETE ON PURPOSE — see the block marked TODO below.

   Your project brief referenced a login API, but the actual
   endpoint code was never pasted in (the section just said
   "PASTE MY LOGIN API HERE"). The request side below is safe
   to ship as-is — POST /api/login with { email, password } is
   the only reasonable shape for a login form. The RESPONSE side
   is what's unsafe to guess: whether you return a JWT, under
   what property name, whether the user object is nested, and
   whether isEmailVerified / role live on it.

   Once you share your real /api/login handler, only the single
   block below needs updating — everything else (validation,
   loading states, error handling, redirect) already works.
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const formAlert = document.getElementById("formAlert");
  const formAlertText = document.getElementById("formAlertText");
  const formSuccess = document.getElementById("formSuccess");
  const formSuccessText = document.getElementById("formSuccessText");

  const fields = {
    email: document.getElementById("email"),
    password: document.getElementById("password"),
  };

  document.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.toggleFor);
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
  });

  // If a fresh signup verification just happened, greet them.
  if (getPendingEmail() === null && document.referrer.includes("verify-otp.html")) {
    showFormSuccess("Email verified successfully. Log in to continue.");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlerts();

    const values = {
      email: fields.email.value.trim(),
      password: fields.password.value,
    };

    if (!validate(values)) return;

    setLoading(true);

    try {
      const data = await apiRequest("/api/login", {
        method: "POST",
        body: values, // { email, password } — matches any standard login handler
      });

      /* ==================== TODO: confirm against your real API ====================
         Replace the two lines below once you've shared the actual /api/login
         response shape. Common examples of what `data` might look like:

           { status: true, token: "...", user: { fullName, email, role, ... } }
           { status: true, data: { accessToken: "...", user: {...} } }
           { status: true, user: {...} }  // cookie-based session, no token in body

         For now this assumes the first shape as a starting point ONLY —
         verify it against your handler before relying on it.
      */
      const token = data.token;
      const user = data.user;
      /* ================================================================================ */

      if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      if (!token && !user) {
        throw new Error(
          "Login succeeded but the response shape wasn't recognized. Check the TODO in js/login.js."
        );
      }

      window.location.href = "profile.html";
    } catch (err) {
      showFormAlert(err.message);
    } finally {
      setLoading(false);
    }
  });

  function validate(values) {
    let valid = true;
    clearFieldError("email");
    clearFieldError("password");

    if (!values.email) {
      setFieldError("email", "Enter your email.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setFieldError("email", "Enter a valid email address.");
      valid = false;
    }

    if (!values.password) {
      setFieldError("password", "Enter your password.");
      valid = false;
    }

    return valid;
  }

  function setFieldError(name, message) {
    fields[name].classList.add("has-error");
    const errorEl = document.getElementById(`${name}Error`);
    errorEl.textContent = message;
    errorEl.classList.add("is-visible");
  }

  function clearFieldError(name) {
    fields[name].classList.remove("has-error");
    const errorEl = document.getElementById(`${name}Error`);
    errorEl.textContent = "";
    errorEl.classList.remove("is-visible");
  }

  function showFormAlert(message) {
    formAlertText.textContent = message;
    formAlert.classList.add("is-visible");
  }

  function showFormSuccess(message) {
    formSuccessText.textContent = message;
    formSuccess.classList.add("is-visible");
  }

  function hideAlerts() {
    formAlert.classList.remove("is-visible");
    formSuccess.classList.remove("is-visible");
  }

  function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.classList.toggle("is-loading", isLoading);
  }
});
