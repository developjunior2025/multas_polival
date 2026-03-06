/* js/tasa-dolar.js
   Gestión de la tasa del Dólar Oficial (BCV) y Paralelo
   - Widget en topbar
   - Cache en memoria con TTL de 1 hora
   - Autocompletar campo TCMMV en formulario de nueva multa
*/

// ==================== CACHE EN MEMORIA ====================
const TasaDolar = (() => {
    const CACHE_TTL = 60 * 60 * 1000; // 1 hora en ms
    let _cache = null;
    let _cachedAt = null;
    let _loading = false;
    const _listeners = [];

    async function _fetchTasa() {
        _loading = true;
        try {
            const data = await Api.tasaDolar.get();
            _cache = data;
            _cachedAt = Date.now();
            _loading = false;
            _listeners.forEach(fn => fn(data, null));
            return data;
        } catch (err) {
            _loading = false;
            _listeners.forEach(fn => fn(null, err));
            throw err;
        }
    }

    /** Retorna la tasa desde cache si es válida, sino la consulta */
    async function get(forceRefresh = false) {
        if (!forceRefresh && _cache && _cachedAt && (Date.now() - _cachedAt) < CACHE_TTL) {
            return _cache;
        }
        return _fetchTasa();
    }

    /** Tasa oficial como número (promedio BCV) */
    function getOficial() {
        return _cache?.oficial?.promedio || null;
    }

    /** Suscribirse a cambios */
    function onUpdate(fn) {
        _listeners.push(fn);
    }

    /** Formatea la tasa como string moneda */
    function formatTasa(val) {
        if (!val && val !== 0) return '—';
        return new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(val) + ' Bs./$';
    }

    /** Hace cuánto fue actualizada */
    function getEdad() {
        if (!_cache) return null;
        const fecha = _cache.oficial?.actualizado;
        if (!fecha) return null;
        const diff = Date.now() - new Date(fecha).getTime();
        const horas = Math.floor(diff / (1000 * 60 * 60));
        const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (horas > 0) return `Hace ${horas}h ${mins}m`;
        return `Hace ${mins} min`;
    }

    return { get, getOficial, onUpdate, formatTasa, getEdad };
})();

// ==================== WIDGET TOPBAR ====================
async function initDolarWidget() {
    const widgetEl        = document.getElementById('dolar-widget');
    const tasaOficialEl   = document.getElementById('dolar-tasa-oficial');
    const tasaParaleloEl  = document.getElementById('dolar-tasa-paralelo');
    const refreshBtn      = document.getElementById('dolar-refresh-btn');

    if (!widgetEl || !tasaOficialEl) return;

    const setLoading = () => {
        tasaOficialEl.innerHTML = `<div class="spinner" style="width:11px;height:11px;border-width:2px"></div>`;
        if (tasaParaleloEl) tasaParaleloEl.textContent = '…';
        refreshBtn?.classList.add('dolar-widget__refresh--spinning');
    };

    const setError = () => {
        tasaOficialEl.innerHTML = `<span title="Sin conexión">N/D</span>`;
        if (tasaParaleloEl) tasaParaleloEl.textContent = 'N/D';
        widgetEl.classList.add('dolar-widget--error');
        refreshBtn?.classList.remove('dolar-widget__refresh--spinning');
    };

    const setData = (data) => {
        widgetEl.classList.remove('dolar-widget--error');
        refreshBtn?.classList.remove('dolar-widget__refresh--spinning');

        const oficial  = data.oficial?.promedio;
        const paralelo = data.paralelo?.promedio;

        tasaOficialEl.textContent = oficial
            ? new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(oficial) + ' Bs.'
            : '—';

        if (tasaParaleloEl) {
            tasaParaleloEl.textContent = paralelo
                ? new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(paralelo) + ' Bs.'
                : '—';
        }

        // Tooltip con fecha
        const edad = TasaDolar.getEdad();
        widgetEl.title = `Dólar Oficial BCV: ${oficial ? oficial.toFixed(2) + ' Bs./$' : '—'}\nParalelo: ${paralelo ? paralelo.toFixed(2) + ' Bs./$' : '—'}${edad ? '\n' + edad : ''}`;

        // Animación flash al actualizar
        widgetEl.classList.add('dolar-widget--updated');
        setTimeout(() => widgetEl.classList.remove('dolar-widget--updated'), 800);
    };

    // Carga inicial
    setLoading();
    try {
        const data = await TasaDolar.get();
        setData(data);
    } catch {
        setError();
    }

    // Botón refresh manual
    refreshBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        setLoading();
        try {
            const data = await TasaDolar.get(true); // forceRefresh
            setData(data);
            showToast('success', 'Tasa actualizada', `BCV Oficial: ${data.oficial?.promedio?.toFixed(2)} Bs./$`);
        } catch {
            setError();
            showToast('error', 'Sin conexión', 'No se pudo obtener la tasa del dólar');
        }
    });

    // Auto-refresh cada hora
    setInterval(async () => {
        try {
            const data = await TasaDolar.get(true);
            setData(data);
        } catch { /* silencioso */ }
    }, 60 * 60 * 1000);
}

// ==================== INTEGRACIÓN EN FORMULARIO DE MULTA ====================

/** Llamar después de que el formulario se renderice */
async function inyectarTasaEnFormulario() {
    const campoTcmmv  = document.getElementById('f-tcmmv');
    const campoImporte = document.getElementById('f-importe');
    const campoUt      = document.getElementById('f-ut');
    if (!campoTcmmv) return;

    // Si ya tiene valor, no sobreescribir
    const yaConValor = campoTcmmv.value && parseFloat(campoTcmmv.value) > 0;

    try {
        const data   = await TasaDolar.get();
        const oficial = data.oficial?.promedio;
        if (!oficial) return;

        // Crear badge informativo junto al campo TCMMV
        _insertarBadgeTasa(campoTcmmv, oficial, data.oficial?.actualizado);

        // Auto-completar solo si el campo está vacío
        if (!yaConValor) {
            campoTcmmv.value = oficial.toFixed(2);
            // Disparar recálculo del importe si aplica
            _calcularImporte();
        }

        // Al cambiar UT o TCMMV, recalcular importe automáticamente
        campoUt?.addEventListener('input', _calcularImporte);
        campoTcmmv?.addEventListener('input', _calcularImporte);

    } catch {
        // Si falla, solo mostrar un link manual
        _insertarBadgeTasa(campoTcmmv, null, null);
    }
}

function _insertarBadgeTasa(campoTcmmv, oficial, fechaActualizado) {
    // Eliminar badge previo si existe
    document.getElementById('tasa-dolar-badge')?.remove();

    const wrapper = campoTcmmv.closest('.form-group');
    if (!wrapper) return;

    const badge = document.createElement('div');
    badge.id = 'tasa-dolar-badge';
    badge.className = 'tasa-dolar-badge';

    if (oficial) {
        const fecha = fechaActualizado
            ? new Date(fechaActualizado).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            : '';

        badge.innerHTML = `
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>BCV Oficial: <strong>${oficial.toFixed(2)} Bs./$</strong>${fecha ? ` · ${fecha}` : ''}</span>
          <button type="button" class="tasa-dolar-badge__btn" id="btn-usar-tasa" title="Usar esta tasa en el campo TCMMV">
            Usar tasa →
          </button>
        `;
        wrapper.appendChild(badge);

        document.getElementById('btn-usar-tasa')?.addEventListener('click', () => {
            campoTcmmv.value = oficial.toFixed(2);
            _calcularImporte();
            showToast('info', 'Tasa aplicada', `TCMMV = ${oficial.toFixed(2)} Bs./$ (BCV Oficial)`);
        });
    } else {
        badge.innerHTML = `
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style="color:var(--clr-warning)">No se pudo obtener la tasa BCV. Ingrese el valor manualmente.</span>
        `;
        wrapper.appendChild(badge);
    }
}

/** Calcula el Importe en Bs. = UT * TCMMV automáticamente */
function _calcularImporte() {
    const ut     = parseFloat(document.getElementById('f-ut')?.value || 0);
    const tcmmv  = parseFloat(document.getElementById('f-tcmmv')?.value || 0);
    const campoIm = document.getElementById('f-importe');
    if (!campoIm || ut <= 0 || tcmmv <= 0) return;
    // Solo auto-calcular si el campo importe está vacío o fue auto-calculado previamente
    if (campoIm.dataset.autoCalc === 'true' || !campoIm.value) {
        campoIm.value = (ut * tcmmv).toFixed(2);
        campoIm.dataset.autoCalc = 'true';
    }
}
