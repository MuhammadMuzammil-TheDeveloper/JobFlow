/* ==========================================================
   CareerFlow — OTP Verification Page Logic
   ========================================================== */

const RESEND_COOLDOWN_SECONDS = 60;

document.addEventListener("DOMContentLoaded", () => {
  const email = getPendingEmail();
  const otpEmailText = document.getElementById("otpEmailText");
  const form = document.getElementById("otpForm");
  const verifyBtn = document.getElementById("verifyBtn");
  const resendBtn = document.getElementById("resendBtn");
  const countdownEl = document.getElementById("otpCountdown");
  const formAlert = document.getElementById("formAlert");
  const formAlertText = document.getElementById("formAlertText");
  const formSuccess = document.getElementById("formSuccess");
  const formSuccessText = document.getElementById("formSuccessText");
  const otpError = document.getElementById("otpError");
  const inputs = Array.from(document.querySelectorAll("#otpInputs input"));
  let countdownTimer = null;
  // No pending email in storage — the person likely landed here directly.
  if (!email) {
    otpEmailText.textContent = "no email on file";
    showFormAlert("We couldn't find a pending verification. Please sign up again.");
    form.querySelectorAll("input, button").forEach((el) => (el.disabled = true));
    resendBtn.disabled = true;
  } else {
    otpEmailText.textContent = email;
  }

  setupOtpInputs();
  startCountdown();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlerts();
    clearOtpError();

    const otp = inputs.map((i) => i.value).join("");

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setOtpError("Enter all 6 digits.");
      return;
    }

    setLoading(verifyBtn, true);

    try {
      // Matches POST /api/verify-email exactly: { email, otp }
      const data = await apiRequest("/api/verify-email", {
        method: "POST",
        body: { email, otp },
      });

      showFormSuccess(data.message || "Email verified successfully.");
      clearPendingEmail();

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } catch (err) {
      // Backend distinguishes expired vs invalid vs already-verified via `message`;
      // we surface it directly since it already matches the required copy.
      setOtpError(err.message);
      inputs.forEach((i) => i.classList.add("has-error"));
    } finally {
      setLoading(verifyBtn, false);
    }
  });

  resendBtn.addEventListener("click", async () => {
    if (resendBtn.disabled || !email) return;
    hideAlerts();
    clearOtpError();
    setLoading(resendBtn, true, "Resend OTP");

    try {
      // Matches POST /api/resend-otp exactly: { email }
      const data = await apiRequest("/api/resend-otp", {
        method: "POST",
        body: { email },
      });

      inputs.forEach((i) => {
        i.value = "";
        i.classList.remove("has-error");
      });
      inputs[0].focus();
      showFormSuccess(data.message || "A new OTP has been sent to your email.");
      startCountdown();
    } catch (err) {
      showFormAlert(err.message);
    } finally {
      setLoading(resendBtn, false, "Resend OTP");
    }
  });

  /* ---------- OTP input behavior ---------- */

  function setupOtpInputs() {
    inputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
        input.classList.remove("has-error");
        if (input.value && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });

      input.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData)
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, 6);
        if (!pasted) return;
        pasted.split("").forEach((digit, i) => {
          if (inputs[i]) inputs[i].value = digit;
        });
        const next = Math.min(pasted.length, inputs.length - 1);
        inputs[next].focus();
      });
    });
  }

  /* ---------- Resend cooldown ---------- */

  function startCountdown() {
    let remaining = RESEND_COOLDOWN_SECONDS;
    resendBtn.disabled = true;
    updateCountdownText(remaining);

    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownTimer);
        countdownEl.textContent = "";
        resendBtn.disabled = false;
        return;
      }
      updateCountdownText(remaining);
    }, 1000);
  }

  function updateCountdownText(seconds) {
    countdownEl.textContent = `Resend available in ${seconds}s`;
  }

  /* ---------- UI helpers ---------- */

  function setOtpError(message) {
    otpError.textContent = message;
    otpError.classList.add("is-visible");
  }

  function clearOtpError() {
    otpError.textContent = "";
    otpError.classList.remove("is-visible");
    inputs.forEach((i) => i.classList.remove("has-error"));
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

  function setLoading(btn, isLoading, label) {
    btn.disabled = isLoading || (btn === resendBtn && !email);
    if (btn.classList.contains("btn")) {
      btn.classList.toggle("is-loading", isLoading);
    } else if (label) {
      btn.textContent = isLoading ? "Sending…" : label;
    }
  }
});
