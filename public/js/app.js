/* js/app.js - Main application router */

// ==================== ROUTER ====================
const routes = {
    'dashboard': { render: renderDashboard, title: 'Dashboard' },
    'nueva-multa': { render: renderNuevaMulta, title: 'Nueva Multa' },
    'multas': { render: renderMultas, title: 'Actas de Infracción' },
    'historico': { render: renderHistorico, title: 'Histórico' },
    'articulos': { render: renderArticulos, title: 'Artículos' },
    'configuracion': { render: renderConfiguracion, title: 'Configuración' },
};

let currentPage = 'dashboard';

function navigateTo(page, data = null) {
    const route = routes[page];
    if (!route) return;

    currentPage = page;

    // Update nav links
    document.querySelectorAll('.sidebar__link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) link.classList.add('active');
    });

    // Render page
    try {
        route.render(data);
    } catch (err) {
        console.error('Error rendering page:', err);
        showToast('error', 'Error', 'Error al cargar la página');
    }
}

// ==================== INIT APP (called after login) ====================
function initApp() {
    // Set current date in topbar
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('es-VE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).replace(/^\w/, c => c.toUpperCase());
    }

    // Update user display
    const usernameEl = document.getElementById('sidebar-username');
    if (usernameEl) usernameEl.textContent = Auth.getUser();

    // Logout button
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        confirmDialog(
            'Cerrar Sesión',
            '¿Está seguro que desea cerrar la sesión del sistema?',
            () => Auth.logout()
        );
    });

    // Sidebar toggle for mobile
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.getElementById('main')?.addEventListener('click', () => {
        if (window.innerWidth < 900) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });

    // Nav link listeners
    document.querySelectorAll('.sidebar__link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page) navigateTo(page);

            // Close sidebar on mobile after navigation
            if (window.innerWidth < 900) {
                document.getElementById('sidebar').classList.remove('open');
            }
        });
    });

    // Navigate to dashboard
    navigateTo('dashboard');

    // Load logo from config
    loadSidebarLogo();
}

// ==================== SIDEBAR LOGO ====================
async function loadSidebarLogo() {
    try {
        const config = await Api.configuracion.get();
        if (config.logo_base64) {
            updateSidebarLogo(config.logo_base64);
        }
    } catch (e) {
        // ignore - logo is optional
    }
}

function updateSidebarLogo(base64) {
    const shieldEl = document.getElementById('sidebar-shield');
    if (shieldEl && base64) {
        shieldEl.innerHTML = `<img src="${base64}" alt="Logo IAPMLG" 
            style="width:44px;height:52px;object-fit:contain;border-radius:4px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">`;
    }
}

// ==================== MAIN INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Always init login form listeners
    initLoginForm();

    // Check if already logged in
    if (Auth.isLoggedIn()) {
        // Verify token is still valid
        const valid = await Auth.verify();
        if (valid) {
            showApp(Auth.getUser());
            // Auto-init DB (silently)
            try {
                await Api.initDb();
            } catch (e) {
                console.warn('DB init warning:', e.message);
            }
            initApp();
        } else {
            Auth.clearSession();
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
});

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }

    // Ctrl+N = New multa (only if logged in)
    if (e.ctrlKey && e.key === 'n' && Auth.isLoggedIn()) {
        e.preventDefault();
        navigateTo('nueva-multa');
    }
});
