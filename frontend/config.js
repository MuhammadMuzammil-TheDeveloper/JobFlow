/**
 * config.js
 * Central place for API base URL and shared constants.
 * Every other JS file should read API_BASE_URL from here —
 * never hardcode the backend URL anywhere else.
 */

const API_BASE_URL = "http://localhost:5000/api";

// Keys used for browser storage (kept in one place so they never drift)
const STORAGE_KEYS = {
  TOKEN: "cf_token",
  USER: "cf_user",
};

// Where each role should land after login
const ROLE_DASHBOARD = {
  candidate: "candidate-dashboard.html",
  recruiter: "recruiter-dashboard.html",
  admin: "admin-dashboard.html",
};
