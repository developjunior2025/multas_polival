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

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
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

    // Auto-init DB on first load (silently)
    try {
        await Api.initDb();
    } catch (e) {
        console.warn('DB init warning:', e.message);
    }

    // Navigate to dashboard
    navigateTo('dashboard');
});

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }

    // Ctrl+N = New multa
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        navigateTo('nueva-multa');
    }
});
