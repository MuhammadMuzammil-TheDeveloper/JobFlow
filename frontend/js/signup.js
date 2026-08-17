/* ==========================================================
   CareerFlow — Signup Page Logic
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const submitBtn = document.getElementById("signupBtn");
  const formAlert = document.getElementById("formAlert");
  const formAlertText = document.getElementById("formAlertText");

  const fields = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirmPassword"),
  };

  // Show/hide password toggles
  document.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.toggleFor);
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormAlert();

    const values = {
      fullName: fields.fullName.value.trim(),
      email: fields.email.value.trim(),
      password: fields.password.value,
      confirmPassword: fields.confirmPassword.value,
      role: form.querySelector('input[name="role"]:checked').value,
    };

    if (!validate(values)) return;

    setLoading(true);

    try {
      // Matches POST /api/signup exactly: { email, fullName, password, confirmPassword, role }
      const data = await apiRequest("/api/signup", {
        method: "POST",
        body: values,
      });

      // Backend returns { message, status: true } on 201 — no token here,
      // the account still needs OTP verification before login.
      setPendingEmail(values.email);
      window.location.href = "verify-otp.html";
    } catch (err) {
      showFormAlert(err.message);
    } finally {
      setLoading(false);
    }
  });

  function validate(values) {
    let valid = true;

    clearFieldError("fullName");
    clearFieldError("email");
    clearFieldError("password");
    clearFieldError("confirmPassword");

    if (!values.fullName) {
      setFieldError("fullName", "Enter your full name.");
      valid = false;
    }

    if (!values.email) {
      setFieldError("email", "Enter your email.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setFieldError("email", "Enter a valid email address.");
      valid = false;
    }

    if (!values.password) {
      setFieldError("password", "Enter a password.");
      valid = false;
    } else if (values.password.length < 8) {
      setFieldError("password", "Password must be at least 8 characters.");
      valid = false;
    }

    if (!values.confirmPassword) {
      setFieldError("confirmPassword", "Confirm your password.");
      valid = false;
    } else if (values.password !== values.confirmPassword) {
      setFieldError("confirmPassword", "Passwords don't match.");
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

  function hideFormAlert() {
    formAlert.classList.remove("is-visible");
    formAlertText.textContent = "";
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("is-loading", isLoading);
  }
});
