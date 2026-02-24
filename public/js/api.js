/* js/api.js - API client for backend functions */

const API_BASE = '/api';

// Helper for fetch requests
async function apiRequest(endpoint, method = 'GET', data = null, params = null) {
    let url = `${API_BASE}${endpoint}`;

    if (params) {
        const query = new URLSearchParams(
            Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== ''))
        );
        if (query.toString()) url += `?${query}`;
    }

    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    const res = await fetch(url, options);

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
}

// ==================== INIT ====================
const Api = {
    initDb: () => apiRequest('/init-db', 'POST'),

    // ==================== MULTAS ====================
    multas: {
        list: (params = {}) => apiRequest('/multas', 'GET', null, params),
        get: (id) => apiRequest('/multas', 'GET', null, { id }),
        create: (data) => apiRequest('/multas', 'POST', data),
        update: (data) => apiRequest('/multas', 'PUT', data),
        delete: (id) => apiRequest('/multas', 'DELETE', null, { id }),
    },

    // ==================== ARTICULOS ====================
    articulos: {
        list: (params = {}) => apiRequest('/articulos', 'GET', null, params),
        get: (id) => apiRequest('/articulos', 'GET', null, { id }),
        create: (data) => apiRequest('/articulos', 'POST', data),
        update: (data) => apiRequest('/articulos', 'PUT', data),
        delete: (id) => apiRequest('/articulos', 'DELETE', null, { id }),
    },

    // ==================== ESTADISTICAS ====================
    estadisticas: {
        resumen: () => apiRequest('/estadisticas', 'GET', null, { tipo: 'resumen' }),
        porInfractor: () => apiRequest('/estadisticas', 'GET', null, { tipo: 'por_infractor' }),
        porArticulo: () => apiRequest('/estadisticas', 'GET', null, { tipo: 'por_articulo' }),
        evolucionMensual: () => apiRequest('/estadisticas', 'GET', null, { tipo: 'evolucion_mensual' }),
    },

    // ==================== CONFIGURACION ====================
    configuracion: {
        get: () => apiRequest('/configuracion', 'GET'),
        update: (data) => apiRequest('/configuracion', 'PUT', data),
    },
};
