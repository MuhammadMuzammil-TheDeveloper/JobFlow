/* ==========================================================
   CareerFlow — Profile Page Logic

   Per the brief: no separate "get profile" API exists, so this
   reads the user object stored locally at login time (see the
   TODO in js/login.js — that's the same object used here).

   ⚠️ Field names below (fullName, role, isEmailVerified,
   createdAt) are taken directly from the User schema fields
   visible in your signup handler (UserModel.create({ email,
   fullName, role, isEmailVerified, ... })). The full schema
   file itself wasn't included, so if it defines different
   field names (e.g. `name` instead of `fullName`, or a
   different verification flag), update FIELD_MAP below —
   nothing else needs to change.
   ========================================================== */

const FIELD_MAP = {
  fullName: "fullName",
  email: "email",
  role: "role",
  isEmailVerified: "isEmailVerified",
  createdAt: "createdAt", // Mongoose timestamps default to this if `{ timestamps: true }` is set
};

document.addEventListener("DOMContentLoaded", () => {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  const user = getCurrentUser();
  const loadingEl = document.getElementById("profileLoading");
  const bodyEl = document.getElementById("profileBody");

  if (!user) {
    loadingEl.textContent =
      "We couldn't load your profile data. Please log in again.";
    setTimeout(() => logout(), 1500);
    return;
  }

  const fullName = user[FIELD_MAP.fullName] || "—";
  const email = user[FIELD_MAP.email] || "—";
  const role = user[FIELD_MAP.role] || "—";
  const isVerified = Boolean(user[FIELD_MAP.isEmailVerified]);
  const createdAt = user[FIELD_MAP.createdAt];

  document.getElementById("profileAvatar").textContent = initialsFor(fullName);
  document.getElementById("profileName").textContent = fullName;
  document.getElementById("profileEmail").textContent = email;

  document.getElementById("rowFullName").textContent = fullName;
  document.getElementById("rowEmail").textContent = email;

  const roleEl = document.getElementById("rowRole");
  roleEl.innerHTML = `<span class="badge badge-role">${escapeHtml(role)}</span>`;

  const verifiedEl = document.getElementById("rowVerified");
  verifiedEl.innerHTML = isVerified
    ? `<span class="badge badge-success">✓ Email verified</span>`
    : `<span class="badge badge-muted">Not verified</span>`;

  document.getElementById("rowCreatedAt").textContent = formatDate(createdAt);

  loadingEl.style.display = "none";
  bodyEl.style.display = "block";

  document.getElementById("logoutBtn").addEventListener("click", () => {
    logout();
  });
});

function initialsFor(name) {
  if (!name || name === "—") return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
