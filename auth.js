/* =====================================================
   TECHNOGHAR - Authentication Logic (Firebase Edition)
   Handles login, signup, and session management via Cloud Firestore
   ===================================================== */

import { db, doc, setDoc, getDoc, updateDoc } from './firebase-config.js';

// Session Helper (still use localStorage for "Who am I logged in as" purely for session ID)
// But data verification happens against Firestore
const SESSION_KEY = 'tg_current_user_email';

export const AuthService = {
    // CURRENT USER: Fetch full profile from Firestore using session email
    getCurrentUser: async () => {
        const email = localStorage.getItem(SESSION_KEY);
        if (!email) return null;

        try {
            const docRef = doc(db, "users", email);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
        } catch (e) {
            console.error("Auth Error", e);
        }
        return null; // Invalid session
    },

    // LOGIN
    login: async (email, password) => {
        try {
            const docRef = doc(db, "users", email);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const user = docSnap.data();
                if (user.password === password) { // Note: Plaintext for demo only. Use Firebase Auth in prod.
                    localStorage.setItem(SESSION_KEY, email);
                    return { success: true, user };
                }
            }
            return { success: false, message: "Invalid credentials" };
        } catch (error) {
            console.error(error);
            return { success: false, message: "Login Error: " + error.message };
        }
    },

    // SIGNUP
    signup: async (userData) => {
        try {
            // Check existence
            const docRef = doc(db, "users", userData.email);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { success: false, message: "User already exists" };
            }

            // Create User
            await setDoc(docRef, userData);
            localStorage.setItem(SESSION_KEY, userData.email);
            return { success: true, user: userData };
        } catch (error) {
            console.error(error);
            return { success: false, message: "Signup Error: " + error.message };
        }
    },

    // LOGOUT
    logout: () => {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'user-login.html';
    },

    // UPDATE USER DOsC
    updateUser: async (email, newData) => {
        const docRef = doc(db, "users", email);
        await updateDoc(docRef, newData);
    }
};

// ================= UI HANDLERS =================

// Init Forms (only if on login page)
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('authTabs')) {
        initAuthForms();
    }
});

function initAuthForms() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    // Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    // Login Submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Signing In...';
            btn.disabled = true;

            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            const result = await AuthService.login(email, password);

            if (result.success) {
                window.location.href = 'user-profile.html'; // Changed from dashboard to profile
            } else {
                showError(loginForm, result.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // Signup Submit
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Creating Account...';
            btn.disabled = true;

            const name = signupForm.querySelector('input[name="fullname"]').value;
            const email = signupForm.querySelector('input[name="email"]').value;
            const password = signupForm.querySelector('input[name="password"]').value;

            const newUser = {
                name,
                email,
                password,
                memberSince: new Date().getFullYear().toString(),
                activeRepair: { hasActiveRepair: false }, // Explicit init
                history: []
            };

            // Add demo history
            newUser.history.push({
                id: "TG-DEMO-001",
                date: new Date().toLocaleDateString(),
                device: "Welcome Device",
                issue: "Account Created",
                status: "Completed",
                cost: "₹0"
            });

            const result = await AuthService.signup(newUser);

            if (result.success) {
                window.location.href = 'user-profile.html';
            } else {
                showError(signupForm, result.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
}

function showError(form, message) {
    let errorDiv = form.querySelector('.form-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.style.color = 'salmon';
        errorDiv.style.marginBottom = '1rem';
        errorDiv.style.fontSize = '0.9rem';
        form.prepend(errorDiv); // Prepend to top
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 3000);
}

// Global Expose for onclicks
window.handleLogout = AuthService.logout;
window.AuthService = AuthService; // Expose for other modules to use easily
