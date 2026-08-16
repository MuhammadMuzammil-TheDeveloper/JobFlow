document.addEventListener('DOMContentLoaded', () => {

  // 1. Splash Screen Auto-Redirect (2 seconds)
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    setTimeout(() => {
      window.location.href = 'auth.html';
    }, 2000);
  }

  // 2. Auth Page Tab Switching & Form Handling
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');
  const loginForm = document.getElementById('login-form-view');
  const signupForm = document.getElementById('signup-form-view');
  const demoBanner = document.getElementById('demo-banner');

  function switchTab(target) {
    if (target === 'login') {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    } else {
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      signupForm.style.display = 'block';
      loginForm.style.display = 'none';
    }
    if (demoBanner) demoBanner.style.display = 'none';
  }

  if (loginTab && signupTab) {
    loginTab.addEventListener('click', () => switchTab('login'));
    signupTab.addEventListener('click', () => switchTab('signup'));

    const switchToSignupLink = document.getElementById('switch-to-signup');
    const switchToLoginLink = document.getElementById('switch-to-login');
    if (switchToSignupLink) switchToSignupLink.addEventListener('click', (e) => { e.preventDefault(); switchTab('signup'); });
    if (switchToLoginLink) switchToLoginLink.addEventListener('click', (e) => { e.preventDefault(); switchTab('login'); });
  }

  // Role Selection Logic in Signup
  const roleOptions = document.querySelectorAll('.role-option');
  const selectedRoleInput = document.getElementById('selected-role');
  roleOptions.forEach(option => {
    option.addEventListener('click', () => {
      roleOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      if (selectedRoleInput) {
        selectedRoleInput.value = option.dataset.role;
      }
    });
  });

  // Simulated Form Submissions
  const signinBtn = document.getElementById('signin-btn');
  if (signinBtn) {
    signinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      demoBanner.textContent = "Demo login — backend not connected.";
      demoBanner.style.display = 'block';
    });
  }

  const signupBtn = document.getElementById('signup-btn');
  if (signupBtn) {
    signupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      demoBanner.textContent = "Account created — demo mode. Redirecting...";
      demoBanner.style.display = 'block';
      setTimeout(() => {
        window.location.href = 'verify-otp.html';
      }, 1000);
    });
  }

  // 3. OTP Verification Interactions
  const otpFields = document.querySelectorAll('.otp-field');
  otpFields.forEach((field, index) => {
    field.addEventListener('input', (e) => {
      const val = e.target.value;
      if (!/^\d*$/.test(val)) {
        field.value = '';
        return;
      }
      if (val && index < otpFields.length - 1) {
        otpFields[index + 1].focus();
      }
    });

    field.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !field.value && index > 0) {
        otpFields[index - 1].focus();
      }
    });

    field.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text').trim();
      if (/^\d{6}$/.test(pasteData)) {
        otpFields.forEach((box, i) => {
          box.value = pasteData[i];
        });
        otpFields[otpFields.length - 1].focus();
      }
    });
  });

  // OTP Countdown Timer simulation
  const countdownEl = document.getElementById('countdown-timer');
  const resendBtn = document.getElementById('resend-btn');
  if (countdownEl && resendBtn) {
    let timeLeft = 60;
    const timer = setInterval(() => {
      timeLeft--;
      countdownEl.textContent = timeLeft + 's';
      if (timeLeft <= 0) {
        clearInterval(timer);
        countdownEl.parentElement.style.display = 'none';
        resendBtn.style.display = 'inline-block';
      }
    }, 1000);
  }

  // Verify Action
  const verifyBtn = document.getElementById('verify-btn');
  const successBanner = document.getElementById('success-banner');
  const continueBtn = document.getElementById('continue-btn');

  if (verifyBtn && successBanner && continueBtn) {
    verifyBtn.addEventListener('click', () => {
      let allFilled = true;
      otpFields.forEach(f => {
        if (!f.value) allFilled = false;
      });

      if (allFilled) {
        successBanner.style.display = 'block';
        verifyBtn.style.display = 'none';
        continueBtn.style.display = 'block';
      } else {
        alert('Please fill in all 6 digits of the verification code.');
      }
    });
  }

});