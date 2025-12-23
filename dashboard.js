/* =====================================================
   TECHNOGHAR - Dashboard & Profile Logic (Firebase Edition)
   Separated logic for User Profile and Guest Status Check
   ===================================================== */

import { AuthService } from './auth.js';
import { db, collection, query, where, getDocs } from './firebase-config.js';

/* ===========================
   1. USER PROFILE PAGE
   =========================== */
async function initUserProfilePage() {
    const user = await AuthService.getCurrentUser();

    if (!user) {
        // Redirect if not logged in
        window.location.href = 'user-login.html';
        return;
    }

    // Populate Data
    updateUserInfo(user);
    updateProfileInfo(user);

    // Active Repair
    const currentRepair = user.activeRepair || { hasActiveRepair: false };
    updateCurrentRepair(currentRepair);

    // History
    updateRepairHistory(user.history || []);
}


/* ===========================
   2. CHECK STATUS PAGE (GUEST)
   =========================== */
function initCheckStatusPage() {
    // Guest page init logic
}

async function trackTicket() {
    const ticketInput = document.getElementById('ticketSearchInput');
    const ticketId = ticketInput.value.trim().toUpperCase();
    const resultContainer = document.getElementById('searchResult');

    if (!ticketId) {
        alert('Please enter a ticket ID');
        return;
    }

    resultContainer.style.display = 'block';
    resultContainer.innerHTML = '<div class="text-center">Searching Database...</div>';

    try {
        // Query users collection where activeRepair.ticketId matches
        // Note: Firestore requires an index for deep nested queries usually, 
        // but for small collections standard query might work if structure is simple.
        // ALTERNATIVE: Since we don't have a separate 'repairs' collection, we iterate users users (inefficient at scale but fine for demo)
        // OR better: Just fetch all users and find. Querying subfields 'activeRepair.ticketId' requires exact structure match.

        let foundRepair = null;

        // Strategy: Fetch all users (Demo Scale)
        const querySnapshot = await getDocs(collection(db, "users"));
        querySnapshot.forEach((doc) => {
            const user = doc.data();
            if (user.activeRepair && user.activeRepair.ticketId === ticketId) {
                foundRepair = { ...user.activeRepair, statusStep: parseInt(user.activeRepair.statusStep) };
            }
        });

        if (foundRepair) {
            resultContainer.innerHTML = generateRepairCard(foundRepair);
        } else {
            resultContainer.innerHTML = `
                <div class="repair-card text-center" style="padding: 2rem;">
                    <h3 style="color: #ef4444; margin-bottom: 1rem;">Ticket Not Found</h3>
                    <p>We couldn't find a repair with ID: <strong>${ticketId}</strong></p>
                </div>
            `;
        }

    } catch (e) {
        console.error(e);
        resultContainer.innerHTML = 'Error searching: ' + e.message;
    }
}


/* ===========================
   SHARED HELPER FUNCTIONS
   =========================== */

function handleLogout() { // Exposed via window
    AuthService.logout();
}

function updateUserInfo(user) {
    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg) {
        const firstName = user.name.split(' ')[0];
        welcomeMsg.textContent = `Welcome back, ${firstName}!`;
    }
}

function updateProfileInfo(user) {
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const sinceEl = document.getElementById('memberSince');
    const initEl = document.getElementById('profileInitials');

    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (sinceEl) sinceEl.textContent = user.memberSince;
    if (initEl && user.name) initEl.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function updateCurrentRepair(repair) {
    const activeContainer = document.getElementById('activeRepairCard');
    const noActiveMsg = document.getElementById('noActiveRepair');

    if (!repair || !repair.hasActiveRepair) {
        if (activeContainer) activeContainer.style.display = 'none';
        if (noActiveMsg) noActiveMsg.style.display = 'block';
        return;
    }

    if (noActiveMsg) noActiveMsg.style.display = 'none';
    if (activeContainer) activeContainer.style.display = 'block';

    if (activeContainer) {
        document.getElementById('ticketId').textContent = repair.ticketId;
        document.getElementById('deviceModel').textContent = repair.device;
        document.getElementById('repairIssue').textContent = repair.issue;
        document.getElementById('receivedDate').textContent = repair.receivedDate;
        document.getElementById('estDate').textContent = repair.estimatedDate;

        // Update Steps
        const steps = activeContainer.querySelectorAll('.progress-step');
        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index + 1 < repair.statusStep) step.classList.add('completed');
            else if (index + 1 == repair.statusStep) step.classList.add('active'); // loose equality for string/int safety
        });
    }
}

function updateRepairHistory(history) {
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;

    if (!history || history.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 2rem; color: var(--text-muted);">No repair history found</td></tr>';
        return;
    }

    const html = history.map(item => `
        <tr>
            <td><span class="history-id">${item.id}</span></td>
            <td>${item.date}</td>
            <td><div class="device-cell"><span class="device-name">${item.device}</span></div></td>
            <td>${item.issue}</td>
            <td><span class="status-badge status-completed">${item.status}</span></td>
            <td class="text-right">${item.cost}</td>
        </tr>
    `).join('');

    tableBody.innerHTML = html;
}

function generateRepairCard(repair) {
    return `
        <div class="repair-card">
            <div class="card-top">
                <div class="ticket-info">
                    <span class="ticket-id">${repair.ticketId}</span>
                    <h3>${repair.device}</h3>
                    <div class="repair-status-badge"><span class="status-dot">●</span>Processing</div>
                </div>
            </div>
            <div class="repair-details-grid">
                <div class="detail-item"><label>Issue</label><p>${repair.issue}</p></div>
                <div class="detail-item"><label>Received</label><p>${repair.receivedDate}</p></div>
                <div class="detail-item"><label>Est. Date</label><p style="color:var(--primary);">${repair.estimatedDate}</p></div>
            </div>
            <div class="progress-tracker">
                <div class="progress-bar-bg"></div>
                <div class="progress-steps">
                    <div class="progress-step ${repair.statusStep > 0 ? 'completed' : ''} ${repair.statusStep == 1 ? 'active' : ''}"><div class="step-icon">1</div><span>Received</span></div>
                    <div class="progress-step ${repair.statusStep > 1 ? 'completed' : ''} ${repair.statusStep == 2 ? 'active' : ''}"><div class="step-icon">2</div><span>Diagnosed</span></div>
                    <div class="progress-step ${repair.statusStep > 2 ? 'completed' : ''} ${repair.statusStep == 3 ? 'active' : ''}"><div class="step-icon">3</div><span>Repairing</span></div>
                    <div class="progress-step ${repair.statusStep > 3 ? 'completed' : ''} ${repair.statusStep == 4 ? 'active' : ''}"><div class="step-icon">4</div><span>Ready</span></div>
                </div>
            </div>
        </div>
    `;
}

// EXPOSE TO WINDOW (Important for inline scripts)
window.initUserProfilePage = initUserProfilePage;
window.initCheckStatusPage = initCheckStatusPage;
window.trackTicket = trackTicket;
window.handleLogout = handleLogout;
