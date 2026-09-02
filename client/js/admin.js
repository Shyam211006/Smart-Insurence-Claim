// js/admin.js
// Loads ALL claims (admin only), shows stats, supports search/filter,
// and lets the admin Approve or Reject each claim.

const API_URL = "http://localhost:5000/api";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

// Protect this page: only logged-in admins may view it
if (!token || !user || user.role !== "admin") {
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

document.getElementById("welcomeText").textContent = `Hi, ${user?.name || ""}`;

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

// Export all claims to a downloadable CSV file
document.getElementById("exportBtn").addEventListener("click", async () => {
  showSpinner();
  try {
    const res = await fetch(`${API_URL}/claims/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      hideSpinner();
      showToast(data.message || "Failed to export claims.", "error");
      return;
    }

    const blob = await res.blob();
    hideSpinner();

    // Trigger a browser download of the CSV file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartclaim_export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    showToast("Claims exported successfully.", "success");
  } catch (error) {
    hideSpinner();
    showToast("Could not connect to server.", "error");
  }
});

let allClaims = [];

function badgeClass(status) {
  if (status === "Approved") return "badge-approved";
  if (status === "Rejected") return "badge-rejected";
  return "badge-pending";
}

function renderStats(claims) {
  document.getElementById("totalClaims").textContent = claims.length;
  document.getElementById("approvedClaims").textContent = claims.filter((c) => c.status === "Approved").length;
  document.getElementById("pendingClaims").textContent = claims.filter((c) => c.status === "Pending").length;
  document.getElementById("rejectedClaims").textContent = claims.filter((c) => c.status === "Rejected").length;
}

function renderTable(claims) {
  const tbody = document.getElementById("claimsTableBody");
  tbody.innerHTML = "";

  if (claims.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No claims found.</td></tr>`;
    return;
  }

  claims.forEach((claim) => {
    const row = document.createElement("tr");
    const shortHash = claim.documentHash.slice(0, 14) + "...";
    const isPending = claim.status === "Pending";

    row.innerHTML = `
      <td>${claim.customerName}</td>
      <td>${claim.policyNumber}</td>
      <td>₹${claim.claimAmount.toLocaleString()}</td>
      <td><span class="badge badge-${claim.fraudScore.toLowerCase()}">${claim.fraudScore}</span></td>
      <td title="${claim.documentHash}" class="hash-box" style="padding:6px 10px;">${shortHash}</td>
      <td><span class="badge ${badgeClass(claim.status)}">${claim.status}</span></td>
      <td>
        ${
          isPending
            ? `<button class="btn btn-success btn-sm" data-action="approve" data-id="${claim._id}">Approve</button>
               <button class="btn btn-danger btn-sm" data-action="reject" data-id="${claim._id}">Reject</button>`
            : `<span style="color: var(--gray); font-size: 13px;">No action</span>`
        }
      </td>
    `;
    tbody.appendChild(row);
  });

  // Wire up approve/reject buttons after rendering
  tbody.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => handleAction(btn.dataset.id, btn.dataset.action));
  });
}

function applyFilters() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const statusValue = document.getElementById("statusFilter").value;

  const filtered = allClaims.filter((claim) => {
    const matchesSearch =
      claim.customerName.toLowerCase().includes(searchTerm) ||
      claim.policyNumber.toLowerCase().includes(searchTerm) ||
      claim._id.toLowerCase().includes(searchTerm);
    const matchesStatus = statusValue ? claim.status === statusValue : true;
    return matchesSearch && matchesStatus;
  });

  renderTable(filtered);
}

document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("statusFilter").addEventListener("change", applyFilters);

async function handleAction(claimId, action) {
  showSpinner();
  try {
    const res = await fetch(`${API_URL}/${action}/${claimId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    hideSpinner();

    if (!res.ok) {
      showToast(data.message || "Action failed.", "error");
      return;
    }

    showToast(`Claim ${action === "approve" ? "approved" : "rejected"} successfully.`, "success");
    loadClaims(); // refresh table + stats
  } catch (error) {
    hideSpinner();
    showToast("Could not connect to server.", "error");
  }
}

async function loadClaims() {
  showSpinner();
  try {
    const res = await fetch(`${API_URL}/claims`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    hideSpinner();

    if (!res.ok) {
      showToast(data.message || "Failed to load claims.", "error");
      return;
    }

    allClaims = data.claims || [];
    renderStats(allClaims);
    renderTable(allClaims);
  } catch (error) {
    hideSpinner();
    showToast("Could not connect to server.", "error");
  }
}

loadClaims();
