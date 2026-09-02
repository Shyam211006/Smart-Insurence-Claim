// js/status.js
// Loads the logged-in customer's claims and renders them as detail cards.
// Supports search (by policy number / claim ID) and filter by status.

const API_URL = "http://localhost:5000/api";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

const spinner = document.getElementById("spinner");
function showSpinner() { spinner.classList.remove("hidden"); }
function hideSpinner() { spinner.classList.add("hidden"); }

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

let allClaims = [];

function badgeClass(status) {
  if (status === "Approved") return "badge-approved";
  if (status === "Rejected") return "badge-rejected";
  return "badge-pending";
}

function renderClaims(claims) {
  const container = document.getElementById("claimsContainer");
  container.innerHTML = "";

  if (claims.length === 0) {
    container.innerHTML = `<div class="card" style="text-align:center;">No matching claims found.</div>`;
    return;
  }

  claims.forEach((claim) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "16px";

    const isPending = claim.status === "Pending";

    card.innerHTML = `
      <div class="page-header" style="margin-bottom:14px;">
        <h3 style="color: var(--primary-dark);">Claim #${claim._id.slice(-6).toUpperCase()}</h3>
        <span class="badge ${badgeClass(claim.status)}">${claim.status}</span>
      </div>
      <p><strong>Customer Name:</strong> ${claim.customerName}</p>
      <p><strong>Policy Number:</strong> ${claim.policyNumber}</p>
      <p><strong>Claim Amount:</strong> ₹${claim.claimAmount.toLocaleString()}</p>
      <p><strong>Fraud Score:</strong> <span class="badge badge-${claim.fraudScore.toLowerCase()}">${claim.fraudScore}</span></p>
      <p style="margin-top:10px;"><strong>Document Hash (SHA-256):</strong></p>
      <div class="hash-box">${claim.documentHash}</div>
      <p style="margin-top:10px;"><strong>OCR Extracted Text:</strong></p>
      <div class="ocr-box">${claim.extractedText ? claim.extractedText : "(No text extracted)"}</div>
      ${
        isPending
          ? `<div style="margin-top:14px; text-align:right;">
               <button class="btn btn-danger btn-sm" data-withdraw-id="${claim._id}">Withdraw Claim</button>
             </div>`
          : ""
      }
    `;
    container.appendChild(card);
  });

  // Wire up any Withdraw buttons just rendered
  container.querySelectorAll("button[data-withdraw-id]").forEach((btn) => {
    btn.addEventListener("click", () => withdrawClaim(btn.dataset.withdrawId));
  });
}

async function withdrawClaim(claimId) {
  const confirmed = confirm("Are you sure you want to withdraw this claim? This cannot be undone.");
  if (!confirmed) return;

  showSpinner();
  try {
    const res = await fetch(`${API_URL}/claim/${claimId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    hideSpinner();

    if (!res.ok) {
      alert(data.message || "Failed to withdraw claim.");
      return;
    }

    loadClaims(); // refresh the list
  } catch (error) {
    hideSpinner();
    alert("Could not connect to server.");
  }
}

function applyFilters() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const statusValue = document.getElementById("statusFilter").value;

  const filtered = allClaims.filter((claim) => {
    const matchesSearch =
      claim.policyNumber.toLowerCase().includes(searchTerm) ||
      claim._id.toLowerCase().includes(searchTerm);
    const matchesStatus = statusValue ? claim.status === statusValue : true;
    return matchesSearch && matchesStatus;
  });

  renderClaims(filtered);
}

document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("statusFilter").addEventListener("change", applyFilters);

async function loadClaims() {
  showSpinner();
  try {
    const res = await fetch(`${API_URL}/claims`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    hideSpinner();

    if (!res.ok) {
      alert(data.message || "Failed to load claims.");
      return;
    }

    allClaims = data.claims || [];
    renderClaims(allClaims);
  } catch (error) {
    hideSpinner();
    alert("Could not connect to server.");
  }
}

loadClaims();
