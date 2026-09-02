// js/verify-otp.js
// Handles the OTP verification form and the "Resend it" link.

const API_URL = "http://localhost:5000/api";

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

// Get the email of the account being verified. Prefer the value saved right after
// registration; fall back to asking the user to re-register if it's missing
// (e.g. they refreshed the page and lost sessionStorage).
let pendingEmail = sessionStorage.getItem("pendingVerificationEmail");

if (!pendingEmail) {
  pendingEmail = prompt("Please enter the Gmail address you registered with:");
  if (pendingEmail) {
    sessionStorage.setItem("pendingVerificationEmail", pendingEmail.trim().toLowerCase());
  }
}

document.getElementById("emailDisplay").textContent = pendingEmail || "your email";

const verifyForm = document.getElementById("verifyForm");

verifyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const otp = document.getElementById("otp").value.trim();

  if (!pendingEmail) {
    showToast("We don't know which account to verify. Please register again.", "error");
    return;
  }

  showSpinner();
  try {
    const res = await fetch(`${API_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingEmail, otp }),
    });

    const data = await res.json();
    hideSpinner();

    if (!res.ok) {
      showToast(data.message || "Verification failed.", "error");
      return;
    }

    showToast("Email verified! Redirecting to login...", "success");
    sessionStorage.removeItem("pendingVerificationEmail");
    setTimeout(() => (window.location.href = "login.html"), 1200);
  } catch (error) {
    hideSpinner();
    showToast("Could not connect to server.", "error");
  }
});

document.getElementById("resendLink").addEventListener("click", async (e) => {
  e.preventDefault();

  if (!pendingEmail) {
    showToast("We don't know which account to verify. Please register again.", "error");
    return;
  }

  showSpinner();
  try {
    const res = await fetch(`${API_URL}/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingEmail }),
    });

    const data = await res.json();
    hideSpinner();

    if (!res.ok) {
      showToast(data.message || "Could not resend code.", "error");
      return;
    }

    showToast("A new code has been sent to your Gmail.", "success");
  } catch (error) {
    hideSpinner();
    showToast("Could not connect to server.", "error");
  }
});
