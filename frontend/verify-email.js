/**
 * verify-email.js
 * Handles the 6-digit OTP input UX and the verify/resend API calls.
 */

const otpInputs = Array.from(document.querySelectorAll(".otp-digit"));
const otpForm = document.getElementById("otpForm");
const submitBtn = document.getElementById("submitBtn");
const formAlert = document.getElementById("formAlert");
const successAlert = document.getElementById("successAlert");
const maskedEmailEl = document.getElementById("maskedEmail");
const countdownEl = document.getElementById("countdown");
const countdownText = document.getElementById("countdownText");
const resendBtn = document.getElementById("resendBtn");

// The email was stashed by signup.js. Without it, there's nothing to verify.
const email = sessionStorage.getItem("cf_pending_verification_email");

if (!email) {
  window.location.href = "signup.html";
}

/* -------------------- Mask email for display -------------------- */

function maskEmail(rawEmail) {
  const [name, domain] = rawEmail.split("@");
  if (!domain) return rawEmail;
  const visible = name.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(name.length - 1, 3))}@${domain}`;
}

if (email) {
  maskedEmailEl.textContent = maskEmail(email);
}

/* -------------------- OTP input behavior -------------------- */

otpInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/g, "").slice(0, 1);
    input.classList.remove("has-error");
    if (input.value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });

  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text").replace(/[^0-9]/g, "");
    if (!pasted) return;

    pasted
      .slice(0, otpInputs.length)
      .split("")
      .forEach((digit, i) => {
        otpInputs[i].value = digit;
      });

    const nextEmpty = otpInputs.findIndex((el) => !el.value);
    otpInputs[nextEmpty === -1 ? otpInputs.length - 1 : nextEmpty].focus();
  });
});

function getOtpValue() {
  return otpInputs.map((el) => el.value).join("");
}

function markOtpError() {
  otpInputs.forEach((el) => el.classList.add("has-error"));
}

function clearOtpError() {
  otpInputs.forEach((el) => el.classList.remove("has-error"));
}

/* -------------------- Alerts -------------------- */

function showAlert(el, message) {
  el.textContent = message;
  el.classList.add("is-visible");
}

function hideAlert(el) {
  el.classList.remove("is-visible");
  el.textContent = "";
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
}

/* -------------------- Countdown / resend -------------------- */

let secondsLeft = 60;
let countdownTimer = null;

function startCountdown() {
  secondsLeft = 60;
  countdownText.style.display = "inline";
  resendBtn.style.display = "none";
  countdownEl.textContent = secondsLeft;

  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    secondsLeft -= 1;
    countdownEl.textContent = secondsLeft;

    if (secondsLeft <= 0) {
      clearInterval(countdownTimer);
      countdownText.style.display = "none";
      resendBtn.style.display = "inline";
    }
  }, 1000);
}

startCountdown();

resendBtn.addEventListener("click", async () => {
  hideAlert(formAlert);
  hideAlert(successAlert);
  resendBtn.disabled = true;

  try {
    const data = await apiRequest("/auth/resend-otp", {
      method: "POST",
      body: { email },
    });

    if (data && data.status) {
      showAlert(successAlert, "A new code has been sent to your email.");
      otpInputs.forEach((el) => (el.value = ""));
      otpInputs[0].focus();
      startCountdown();
    } else {
      showAlert(formAlert, (data && data.message) || "Could not resend the code. Please try again.");
    }
  } catch (err) {
    showAlert(formAlert, err.message);
  } finally {
    resendBtn.disabled = false;
  }
});

/* -------------------- Verify -------------------- */

otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(formAlert);
  hideAlert(successAlert);

  const otp = getOtpValue();

  if (otp.length !== 6) {
    markOtpError();
    showAlert(formAlert, "Enter all 6 digits of the verification code.");
    return;
  }

  clearOtpError();
  setLoading(true);

  try {
    const data = await apiRequest("/auth/verify-email", {
      method: "POST",
      body: { email, otp },
    });

    if (data && data.status) {
      clearInterval(countdownTimer);
      showAlert(successAlert, "Email verified successfully. Redirecting to sign in…");
      sessionStorage.removeItem("cf_pending_verification_email");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } else {
      markOtpError();
      showAlert(formAlert, (data && data.message) || "Verification failed. Please try again.");
    }
  } catch (err) {
    // Covers invalid OTP, expired OTP, already verified, server/network errors —
    // the backend's message is surfaced directly.
    markOtpError();
    showAlert(formAlert, err.message);
  } finally {
    setLoading(false);
  }
});
