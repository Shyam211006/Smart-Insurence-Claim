// js/dashboard.js
// Loads the logged-in customer's claims and displays stats + a table.

const API_URL = "http://localhost:5000/api";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

// Protect this page: redirect to login if not authenticated
if (!token || !user) {
  window.location.href = "login.html";
}

const spinner = document.getElementById("spinner");
function showSpinner() { spinner.classList.remove("hidden"); }
function hideSpinner() { spinner.classList.add("hidden"); }

document.getElementById("welcomeText").textContent = `Hi, ${user?.name || ""}`;

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

function badgeClass(status) {
  if (status === "Approved") return "badge-approved";
  if (status === "Rejected") return "badge-rejected";
  return "badge-pending";
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
      alert(data.message || "Failed to load claims.");
      return;
    }

    const claims = data.claims || [];

    document.getElementById("totalClaims").textContent = claims.length;
    document.getElementById("approvedClaims").textContent = claims.filter((c) => c.status === "Approved").length;
    document.getElementById("pendingClaims").textContent = claims.filter((c) => c.status === "Pending").length;
    document.getElementById("rejectedClaims").textContent = claims.filter((c) => c.status === "Rejected").length;

    const tbody = document.getElementById("claimsTableBody");
    tbody.innerHTML = "";

    if (claims.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No claims submitted yet.</td></tr>`;
      return;
    }

    claims.forEach((claim) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${claim.policyNumber}</td>
        <td>₹${claim.claimAmount.toLocaleString()}</td>
        <td><span class="badge badge-${claim.fraudScore.toLowerCase()}">${claim.fraudScore}</span></td>
        <td><span class="badge ${badgeClass(claim.status)}">${claim.status}</span></td>
        <td>${new Date(claim.createdAt).toLocaleDateString()}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    hideSpinner();
    alert("Could not connect to server.");
  }
}

loadClaims();
