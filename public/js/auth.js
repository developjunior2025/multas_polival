/* js/auth.js - Authentication module */

const AUTH_TOKEN_KEY = 'iapmlg_auth_token';
const AUTH_USER_KEY = 'iapmlg_auth_user';

const Auth = {
    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    getUser() {
        return localStorage.getItem(AUTH_USER_KEY) || 'admin';
    },

    saveSession(token, username) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(AUTH_USER_KEY, username);
    },

    clearSession() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    async verify() {
        const token = this.getToken();
        if (!token) return false;
        try {
            const res = await apiRequest(`/auth?token=${token}`, 'GET');
            return res.valid === true;
        } catch (e) {
            return false;
        }
    },

    async login(username, password) {
        const res = await apiRequest('/auth', 'POST', { username, password });
        if (res.token) {
            this.saveSession(res.token, res.username);
            return res;
        }
        throw new Error(res.error || 'Error de autenticación');
    },

    logout() {
        this.clearSession();
        showLoginScreen();
    }
};

// ==================== LOGIN UI ====================

function showLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    // Focus username field
    setTimeout(() => document.getElementById('login-username')?.focus(), 100);
}

function showApp(username) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    // Update username display
    const usernameEl = document.getElementById('sidebar-username');
    if (usernameEl) usernameEl.textContent = username || Auth.getUser();
}

function initLoginForm() {
    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');
    const errorMsgEl = document.getElementById('login-error-msg');
    const submitBtn = document.getElementById('login-submit');

    // Toggle password visibility
    document.getElementById('toggle-password')?.addEventListener('click', () => {
        const pwInput = document.getElementById('login-password');
        const eyeIcon = document.getElementById('pw-eye');
        if (pwInput.type === 'password') {
            pwInput.type = 'text';
            eyeIcon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            `;
        } else {
            pwInput.type = 'password';
            eyeIcon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            `;
        }
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.classList.add('hidden');

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            errorMsgEl.textContent = 'Complete todos los campos';
            errorEl.classList.remove('hidden');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<div class="spinner" style="width:18px;height:18px;border-width:3px;"></div> Verificando...`;

        try {
            const res = await Auth.login(username, password);
            showApp(res.username);
            // Initialize the app after login
            initApp();
        } catch (err) {
            errorMsgEl.textContent = err.message || 'Usuario o contraseña incorrectos';
            errorEl.classList.remove('hidden');
            document.getElementById('login-password').value = '';
            document.getElementById('login-password').focus();
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Ingresar al Sistema
            `;
        }
    });
}
