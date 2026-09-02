// js/theme.js
// Adds dark mode support across the whole app.
// The choice is remembered for the current browser tab session using sessionStorage
// (not localStorage/cookies, so it resets naturally between visits — simple and demo-friendly).

(function () {
  const THEME_KEY = "smartclaim_theme";

  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  function getSavedTheme() {
    return sessionStorage.getItem(THEME_KEY) || "light";
  }

  function toggleTheme() {
    const current = getSavedTheme();
    const next = current === "dark" ? "light" : "dark";
    sessionStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    updateButtonLabel(next);
  }

  function updateButtonLabel(theme) {
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      btn.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
    }
  }

  // Apply the saved theme immediately on page load
  applyTheme(getSavedTheme());

  // Wait for the DOM (and the navbar's toggle button) to be ready
  document.addEventListener("DOMContentLoaded", () => {
    updateButtonLabel(getSavedTheme());
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      btn.addEventListener("click", toggleTheme);
    }
  });
})();
