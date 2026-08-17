/* ==========================================================
   CareerFlow — Config & Shared Auth Helpers
   ========================================================== */

// Single source of truth for the API origin. Change this in one
// place (e.g. when you deploy) instead of editing every file.
const API_BASE_URL = "http://localhost:5000";

// Keys used in localStorage so the rest of the app never
// hardcodes raw strings.
const STORAGE_KEYS = {
  PENDING_EMAIL: "careerflow_pending_email", // email awaiting OTP verification
  TOKEN: "careerflow_token",                 // TODO: confirm this matches your /api/login response
  USER: "careerflow_user",                   // TODO: confirm this matches your /api/login response
};

/**
 * Wrapper around fetch() that talks to the CareerFlow API.
 * Centralizes JSON headers, base URL, and error normalization
 * so every page handles failures the same way.
 */
async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // fetch() itself throws on network failure / server unreachable
    const err = new Error("Unable to reach the server. Check your connection and try again.");
    err.status = 0;
    throw err;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response body — fall through with data = null
  }

  if (!response.ok) {
    const message = (data && data.message) || defaultMessageForStatus(response.status);
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

function defaultMessageForStatus(status) {
  switch (status) {
    case 400: return "That request wasn't valid. Please check the form and try again.";
    case 401: return "You're not authorized. Please log in again.";
    case 403: return "You don't have permission to do that.";
    case 404: return "We couldn't find what you're looking for.";
    case 409: return "That already exists.";
    case 500: return "Something went wrong on our end. Please try again shortly.";
    default:  return "Something went wrong. Please try again.";
  }
}

/* ---------- Pending signup email (used by the OTP page) ---------- */

function setPendingEmail(email) {
  localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);
}

function getPendingEmail() {
  return localStorage.getItem(STORAGE_KEYS.PENDING_EMAIL);
}

function clearPendingEmail() {
  localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
}

/* ---------- Auth session helpers ----------
   NOTE: getToken/getCurrentUser/isAuthenticated/logout are wired
   to STORAGE_KEYS.TOKEN / STORAGE_KEYS.USER as placeholders.
   These need to be confirmed once the real /api/login response
   shape is available — see login.js for the TODO. */

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

function isAuthenticated() {
  return Boolean(getToken() || getCurrentUser());
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  window.location.href = "login.html";
}
