/* =====================================================
   TECHNOGHAR - Admin Logic (Firebase Edition)
   Handles data aggregation from Firestore
   ===================================================== */

import { db, collection, getDocs, doc, updateDoc } from './firebase-config.js';

const ADMIN_STORAGE_KEY = 'tg_admin_session';

document.addEventListener('DOMContentLoaded', () => {
    // Check Admin Auth (Skip for login page)
    if (!window.location.href.includes('admin-login.html')) {
        checkAdminAuth();
        initDashboard();
    }
});

/* ===========================
   AUTH
   =========================== */
function checkAdminAuth() {
    const session = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (!session) {
        window.location.href = 'admin-login.html';
    }
}

// Make globally available for the form in admin-login.html
window.adminLogin = function (email, password) {
    // Hardcoded for now, could be Firestore 'admins' collection
    if (email === 'admin@technoghar.com' && password === 'admin123') {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        return true;
    }
    return false;
};

window.adminLogout = function () {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    window.location.href = 'admin-login.html';
};

/* ===========================
   DATA AGGREGATION
   =========================== */
async function getAllRepairsAndUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = [];
        const repairs = [];

        querySnapshot.forEach((doc) => {
            const user = doc.data();
            users.push(user);

            // Extract active repair
            if (user.activeRepair && user.activeRepair.hasActiveRepair) {
                repairs.push({
                    ...user.activeRepair,
                    customerName: user.name,
                    customerEmail: user.email, // Use email as ID
                    userId: user.email
                });
            }
        });

        // Sort repairs by date (newest first)
        repairs.sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate));

        return { users, repairs };
    } catch (e) {
        console.error("Error fetching data:", e);
        return { users: [], repairs: [] };
    }
}

/* ===========================
   ACTIONS
   =========================== */
window.handleStatusChange = async function (select, userId, ticketId) {
    const newStep = select.value;
    const originalBg = select.style.backgroundColor;

    // UI Feedback: Loading
    select.disabled = true;
    select.style.opacity = '0.5';

    try {
        const docRef = doc(db, "users", userId);

        // We need to fetch the user again to ensure we update safe nested fields
        // Firestore update works with dot notation "activeRepair.statusStep"
        const updatePayload = {
            "activeRepair.statusStep": parseInt(newStep)
        };

        if (newStep == 4) {
            updatePayload["activeRepair.estimatedDate"] = "Ready for Pickup";
        }

        await updateDoc(docRef, updatePayload);

        // Success Feedback
        select.style.backgroundColor = '#d1fae5'; // Green
        setTimeout(() => {
            select.style.backgroundColor = originalBg;
            select.disabled = false;
            select.style.opacity = '1';
        }, 1000);

    } catch (error) {
        console.error("Update failed", error);
        alert('Failed to update status: ' + error.message);
        select.disabled = false;
        select.style.opacity = '1';
    }
};

/* ===========================
   DASHBOARD UI
   =========================== */
async function initDashboard() {
    const { users, repairs } = await getAllRepairsAndUsers();

    // 1. KPI Stats
    updateKPI('kpiTotalRepairs', repairs.length);
    updateKPI('kpiTotalUsers', users.length);
    updateKPI('kpiRevenue', '$' + (repairs.length * 50)); // Mock revenue

    // 2. Repairs Table
    renderRepairsTable(repairs);

    // 3. Users Table (if on users page)
    if (document.getElementById('usersTableBody')) {
        renderUsersTable(users);
    }
}

function updateKPI(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderRepairsTable(repairs) {
    const tbody = document.getElementById('repairsTableBody');
    if (!tbody) return;

    if (repairs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No active repairs found.</td></tr>';
        return;
    }

    tbody.innerHTML = repairs.map(repair => `
        <tr>
            <td><strong>${repair.ticketId}</strong></td>
            <td>
                <div>${repair.customerName}</div>
                <div style="font-size: 0.8rem; color: #888;">${repair.customerEmail}</div>
            </td>
            <td>${repair.device}</td>
            <td>${repair.issue}</td>
            <td>
                <select class="status-select" onchange="handleStatusChange(this, '${repair.userId}', '${repair.ticketId}')">
                    <option value="1" ${repair.statusStep == 1 ? 'selected' : ''}>Received</option>
                    <option value="2" ${repair.statusStep == 2 ? 'selected' : ''}>Diagnosed</option>
                    <option value="3" ${repair.statusStep == 3 ? 'selected' : ''}>Repairing</option>
                    <option value="4" ${repair.statusStep == 4 ? 'selected' : ''}>Ready</option>
                </select>
            </td>
            <td>${repair.receivedDate}</td>
        </tr>
    `).join('');
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.memberSince}</td>
            <td>${user.history ? user.history.length : 0} orders</td>
        </tr>
    `).join('');
}
