// js/register.js
// Handles the registration form: sends data to POST /api/register

const API_URL = "http://localhost:5000/api";

const registerForm = document.getElementById("registerForm");
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

// Validates that the email is a properly-formatted Gmail address.
// Gmail's real rules for the part before @: 6-30 characters, letters/numbers/dots only,
// cannot start or end with a dot, and cannot contain two dots in a row.
function isValidGmail(email) {
  const gmailPattern = /^[a-zA-Z0-9](?!.*\.\.)[a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@gmail\.com$/;
  return gmailPattern.test(email.trim().toLowerCase());
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!isValidGmail(email)) {
    showToast("Please enter a valid @gmail.com address.", "error");
    return;
  }

  showSpinner();
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    hideSpinner();

    if (!res.ok) {
      showToast(data.message || "Registration failed.", "error");
      return;
    }

    showToast("Verification code sent! Redirecting...", "success");
    // Pass the email along so the verify page knows which account to confirm
    sessionStorage.setItem("pendingVerificationEmail", email.trim().toLowerCase());
    setTimeout(() => (window.location.href = "verify-otp.html"), 1200);
  } catch (error) {
    hideSpinner();
    showToast("Could not connect to server.", "error");
  }
});
