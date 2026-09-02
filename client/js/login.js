// js/login.js
// Handles the login form: sends credentials to POST /api/login,
// then stores the returned JWT token + user info in localStorage.

const API_URL = "http://localhost:5000/api";

const loginForm = document.getElementById("loginForm");
const spinner = document.getElementById("spinner");

function showSpinner() { spinner.classList.remove("hidden"); }
function hideSpinner() { spinner.classList.add("hidden"); }

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Show/Hide password toggle
const togglePasswordBtn = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePasswordBtn.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePasswordBtn.textContent = isHidden ? "Hide" : "Show";
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  showSpinner();
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    hideSpinner();

    if (!res.ok) {
      showToast(data.message || "Login failed.", "error");

      // If the account exists but hasn't verified its Gmail yet, send them to
      // the verification page instead of leaving them stuck on a login error.
      if (data.needsVerification && data.email) {
        sessionStorage.setItem("pendingVerificationEmail", data.email);
        setTimeout(() => (window.location.href = "verify-otp.html"), 1400);
      }
      return;
    }

    // Save token and user info so other pages can use them
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    showToast("Login successful!", "success");

    // Redirect based on role
    setTimeout(() => {
      if (data.user.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }, 1000);
  } catch (error) {
    hideSpinner();
    showToast("Could not connect to server.", "error");
  }
});
