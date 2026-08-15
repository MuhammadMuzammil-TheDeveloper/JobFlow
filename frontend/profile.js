/**
 * profile.js
 * Loads the current user's profile, and handles the view/edit/save flow.
 */

requireAuth();

const loadingState = document.getElementById("loadingState");
const profileContent = document.getElementById("profileContent");
const pageAlert = document.getElementById("pageAlert");
const pageSuccessAlert = document.getElementById("pageSuccessAlert");

const editBtn = document.getElementById("editBtn");
const cancelBtn = document.getElementById("cancelBtn");
const editActions = document.getElementById("editActions");
const profileForm = document.getElementById("profileForm");
const saveBtn = document.getElementById("saveBtn");

// Fields the user is allowed to edit (sent to PATCH /users/me)
const EDITABLE_FIELDS = [
  "fullName",
  "phone",
  "location",
  "bio",
  "jobTitle",
  "experience",
  "skills",
  "linkedin",
  "github",
  "portfolio",
];

let currentUser = null;

/* -------------------- Alerts -------------------- */

function showAlert(el, message) {
  el.textContent = message;
  el.classList.add("is-visible");
}

function hideAlert(el) {
  el.classList.remove("is-visible");
  el.textContent = "";
}

/* -------------------- Render -------------------- */

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatJoinedDate(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return `Joined ${date.toLocaleDateString(undefined, { year: "numeric", month: "long" })}`;
}

function renderProfile(user) {
  document.getElementById("avatarInitials").textContent = initials(user.fullName);
  document.getElementById("summaryName").textContent = user.fullName || "—";
  document.getElementById("summaryEmail").textContent = user.email || "—";
  document.getElementById("summaryRole").textContent = user.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "—";
  document.getElementById("joinedDate").textContent = formatJoinedDate(user.createdAt);

  document.getElementById("verifiedBadge").style.display = user.isEmailVerified ? "inline-flex" : "none";
  document.getElementById("unverifiedBadge").style.display = user.isEmailVerified ? "none" : "inline-flex";

  document.getElementById("fullName").value = user.fullName || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = user.phone || "";
  document.getElementById("location").value = user.location || "";
  document.getElementById("bio").value = user.bio || "";

  document.getElementById("jobTitle").value = user.jobTitle || "";
  document.getElementById("experience").value = user.experience || "";
  document.getElementById("skills").value = Array.isArray(user.skills) ? user.skills.join(", ") : (user.skills || "");
  document.getElementById("linkedin").value = user.linkedin || "";
  document.getElementById("github").value = user.github || "";
  document.getElementById("portfolio").value = user.portfolio || "";
}

/* -------------------- Load -------------------- */

async function loadProfile() {
  try {
    const data = await apiRequest("/users/me", { method: "GET", auth: true });

    if (data && data.status && data.user) {
      currentUser = data.user;
      renderProfile(currentUser);
      loadingState.style.display = "none";
      profileContent.style.display = "block";
    } else {
      showAlert(pageAlert, (data && data.message) || "Could not load your profile.");
      loadingState.style.display = "none";
    }
  } catch (err) {
    loadingState.style.display = "none";
    showAlert(pageAlert, err.message);
  }
}

loadProfile();

/* -------------------- Edit mode -------------------- */

function setEditMode(isEditing) {
  EDITABLE_FIELDS.forEach((field) => {
    const el = document.getElementById(field);
    if (el) el.disabled = !isEditing;
  });

  editActions.style.display = isEditing ? "flex" : "none";
  editBtn.style.display = isEditing ? "none" : "inline-flex";
}

editBtn.addEventListener("click", () => {
  hideAlert(pageAlert);
  hideAlert(pageSuccessAlert);
  setEditMode(true);
  document.getElementById("fullName").focus();
});

cancelBtn.addEventListener("click", () => {
  hideAlert(pageAlert);
  hideAlert(pageSuccessAlert);
  if (currentUser) renderProfile(currentUser);
  setEditMode(false);
});

/* -------------------- Save -------------------- */

function setSaving(isSaving) {
  saveBtn.disabled = isSaving;
  saveBtn.classList.toggle("is-loading", isSaving);
}

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(pageAlert);
  hideAlert(pageSuccessAlert);

  if (!document.getElementById("fullName").value.trim()) {
    showAlert(pageAlert, "Full name cannot be empty.");
    return;
  }

  const payload = {
    fullName: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    location: document.getElementById("location").value.trim(),
    bio: document.getElementById("bio").value.trim(),
    jobTitle: document.getElementById("jobTitle").value.trim(),
    experience: document.getElementById("experience").value.trim(),
    skills: document
      .getElementById("skills")
      .value.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    linkedin: document.getElementById("linkedin").value.trim(),
    github: document.getElementById("github").value.trim(),
    portfolio: document.getElementById("portfolio").value.trim(),
  };

  setSaving(true);

  try {
    const data = await apiRequest("/users/me", {
      method: "PATCH",
      auth: true,
      body: payload,
    });

    if (data && data.status && data.user) {
      currentUser = data.user;
      renderProfile(currentUser);

      // Keep the cached user (used for role-based redirects elsewhere) in sync.
      saveSession(getToken(), currentUser);

      setEditMode(false);
      showAlert(pageSuccessAlert, "Your profile has been updated.");
    } else {
      showAlert(pageAlert, (data && data.message) || "Could not save your changes.");
    }
  } catch (err) {
    showAlert(pageAlert, err.message);
  } finally {
    setSaving(false);
  }
});
