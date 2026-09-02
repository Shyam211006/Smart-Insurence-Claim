// js/upload.js
// Handles the "Upload Claim" form: sends multipart/form-data to POST /api/uploadClaim

const API_URL = "http://localhost:5000/api";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

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

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

const uploadForm = document.getElementById("uploadForm");

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const customerName = document.getElementById("customerName").value.trim();
  const policyNumber = document.getElementById("policyNumber").value.trim();
  const claimAmount = document.getElementById("claimAmount").value;
  const documentFile = document.getElementById("document").files[0];

  if (!documentFile) {
    showToast("Please select a document to upload.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("customerName", customerName);
  formData.append("policyNumber", policyNumber);
  formData.append("claimAmount", claimAmount);
  formData.append("document", documentFile);

  showSpinner();
  try {
    const res = await fetch(`${API_URL}/uploadClaim`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // do NOT set Content-Type manually with FormData
      body: formData,
    });

    const data = await res.json();
    hideSpinner();

    if (!res.ok) {
      showToast(data.message || "Upload failed.", "error");
      return;
    }

    showToast("Claim submitted successfully!", "success");
    setTimeout(() => (window.location.href = "status.html"), 1200);
  } catch (error) {
    hideSpinner();
    showToast("Could not connect to server.", "error");
  }
});
