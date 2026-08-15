/**
 * auth.js
 * Shared authentication helpers used across every page.
 *
 * NOTE ON SECURITY:
 * Anything stored in the browser (including localStorage) can be read
 * by anyone with access to the device or by malicious JS if the site is
 * ever compromised (XSS). The token stored here is only ever used to
 * *attach* requests to the backend — the backend is the only place that
 * actually authorizes anything. The frontend role checks below are for
 * UI/redirect convenience only, never for real access control.
 */

/* -------------------- Storage helpers -------------------- */

function saveSession(token, user) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

function getUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

function isLoggedIn() {
  return Boolean(getToken());
}

/* -------------------- Redirect helpers -------------------- */

function redirectByRole(role) {
  const destination = ROLE_DASHBOARD[role] || "login.html";
  window.location.href = destination;
}

// Call this at the top of protected pages (e.g. profile.html)
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}

// Call this at the top of login.html / signup.html
function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    const user = getUser();
    redirectByRole(user ? user.role : null);
  }
}

/* -------------------- API request helper -------------------- */

/**
 * Wraps fetch() with:
 * - JSON headers
 * - Optional auth token
 * - Consistent error handling
 *
 * Returns the parsed JSON body on success.
 * Throws an Error with a user-friendly message on failure.
 */
async function apiRequest(endpoint, { method = "GET", body = null, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    // fetch() itself only throws on network-level failures (offline, CORS, DNS, etc.)
    throw new Error("Network error. Please check your connection and try again.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Response had no JSON body — fall through with data = null
  }

  if (!response.ok) {
    const message = (data && data.message) || `Request failed (${response.status}).`;
    throw new Error(message);
  }

  if (response.status === 401 && auth) {
    // Token expired or invalid — force re-login
    clearSession();
    window.location.href = "login.html";
    return null;
  }

  return data;
}

/* -------------------- Logout -------------------- */

function logout() {
  clearSession();
  window.location.href = "login.html";
}

// Wire up any element with [data-logout] automatically, if present on the page
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-logout]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  });
});
