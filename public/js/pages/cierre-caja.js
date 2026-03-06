/* js/pages/cierre-caja.js */

// Estado global de la vista
let _cierreDatos = null;
let _pendientesHistData = null;
let _pendientesPage = 1;
const _pendientesLimit = 15;

// ==================== RENDER PRINCIPAL ====================
async function renderCierreCaja() {
    setPageTitle('Cierre de Caja');
    const content = document.getElementById('content');

    const hoy = formatDateISO(new Date());

    content.innerHTML = `
    <div class="page-header">
      <div class="page-header__info">
        <h1>Cierre de Caja</h1>
        <p>Totalización y verificación de multas por período</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--ghost" id="cc-btn-historial">
          ${Icons.list || svgIcon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2')}
          Historial de Cierres
        </button>
      </div>
    </div>

    <!-- FILTROS DE PERÍODO -->
    <div class="card mb-24" id="cc-card-filtros">
      <div class="card__header">
        <span class="card__title">
          <div class="card__title-icon">${svgIcon('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z')}</div>
          Seleccionar Período
        </span>
      </div>
      <div class="card__body">
        <div class="cierre-filtros">
          <div class="form-group">
            <label class="form-label">Tipo de Período</label>
            <select class="form-control" id="cc-tipo-periodo">
              <option value="dia">Día específico</option>
              <option value="rango">Rango de fechas</option>
              <option value="mes">Mes actual</option>
              <option value="semana">Semana actual</option>
            </select>
          </div>

          <div class="form-group" id="cc-grupo-fecha-unica">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-control" id="cc-fecha-unica" value="${hoy}">
          </div>

          <div class="form-group hidden" id="cc-grupo-fecha-desde">
            <label class="form-label">Fecha Desde</label>
            <input type="date" class="form-control" id="cc-fecha-desde" value="${hoy}">
          </div>

          <div class="form-group hidden" id="cc-grupo-fecha-hasta">
            <label class="form-label">Fecha Hasta</label>
            <input type="date" class="form-control" id="cc-fecha-hasta" value="${hoy}">
          </div>

          <div class="form-group">
            <label class="form-label">Turno (opcional)</label>
            <select class="form-control" id="cc-turno">
              <option value="">Todos los turnos</option>
              <option value="AM">AM (Mañana)</option>
              <option value="PM">PM (Tarde)</option>
            </select>
          </div>

          <div class="form-group form-group--actions">
            <label class="form-label">&nbsp;</label>
            <button class="btn btn--primary" id="cc-btn-consultar">
              ${svgIcon('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0')}
              Generar Cierre
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ÁREA DE RESULTADOS -->
    <div id="cc-resultados" class="hidden">

      <!-- BANNER DE PERÍODO -->
      <div class="cierre-banner" id="cc-banner-periodo"></div>

      <!-- TARJETAS DE TOTALES -->
      <div class="cierre-stats" id="cc-stats-grid"></div>

      <!-- DESGLOSE POR ESTADO -->
      <div class="cierre-desglose-row">

        <!-- DESGLOSE MONETARIO -->
        <div class="card">
          <div class="card__header">
            <span class="card__title">
              <div class="card__title-icon">${svgIcon('M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z')}</div>
              Desglose Monetario (Bs.)
            </span>
          </div>
          <div class="card__body" id="cc-desglose-monetario"></div>
        </div>

        <!-- TOP ARTÍCULOS -->
        <div class="card">
          <div class="card__header">
            <span class="card__title">
              <div class="card__title-icon">${svgIcon('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z')}</div>
              Infracciones Más Frecuentes
            </span>
          </div>
          <div class="card__body" id="cc-top-articulos"></div>
        </div>
      </div>

      <!-- MULTAS PENDIENTES HISTÓRICAS -->
      <div class="card mt-24" id="cc-card-pendientes">
        <div class="card__header">
          <span class="card__title">
            <div class="card__title-icon cierre-pendientes-icon">${svgIcon('M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z')}</div>
            Multas Pendientes Anteriores al Período
          </span>
          <button class="btn btn--ghost btn--sm" id="cc-toggle-pendientes">Ver detalle</button>
        </div>
        <div class="card__body">
          <div id="cc-pendientes-resumen"></div>
          <div id="cc-pendientes-tabla" class="hidden"></div>
        </div>
      </div>

      <!-- OBSERVACIONES Y ACCIONES -->
      <div class="card mt-24" id="cc-card-acciones">
        <div class="card__header">
          <span class="card__title">
            <div class="card__title-icon">${svgIcon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2')}</div>
            Guardar Cierre
          </span>
        </div>
        <div class="card__body">
          <div class="form-group" style="max-width:600px">
            <label class="form-label">Funcionario responsable del cierre</label>
            <input type="text" class="form-control" id="cc-funcionario" placeholder="Nombre completo del funcionario">
          </div>
          <div class="form-group" style="max-width:600px">
            <label class="form-label">Observaciones</label>
            <textarea class="form-control" id="cc-observaciones" rows="3" 
              placeholder="Observaciones adicionales del cierre..."></textarea>
          </div>
          <div class="cierre-botones-acciones">
            <button class="btn btn--primary" id="cc-btn-guardar">
              ${svgIcon('M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4')}
              Guardar Cierre
            </button>
            <button class="btn btn--ghost" id="cc-btn-pdf">
              ${svgIcon('M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z')}
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- MODAL HISTORIAL -->
    <div id="cc-modal-historial" class="cierre-modal-overlay hidden">
      <div class="cierre-modal">
        <div class="cierre-modal__header">
          <h3>Historial de Cierres de Caja</h3>
          <button class="cierre-modal__close" id="cc-modal-close">&times;</button>
        </div>
        <div class="cierre-modal__body" id="cc-historial-content">
          <div class="empty-state"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
    `;

    // Inicializar eventos
    _initCierreEvents();
}

// ==================== HELPERS SVG ====================
function svgIcon(pathD) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${pathD}"/></svg>`;
}

function svgIcon2(paths) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

// ==================== EVENTOS ====================
function _initCierreEvents() {
    // Tipo de período
    document.getElementById('cc-tipo-periodo')?.addEventListener('change', _onTipoPeriodoChange);

    // Botón consultar
    document.getElementById('cc-btn-consultar')?.addEventListener('click', _ejecutarCierre);

    // Botón guardar
    document.getElementById('cc-btn-guardar')?.addEventListener('click', _guardarCierre);

    // Botón PDF
    document.getElementById('cc-btn-pdf')?.addEventListener('click', _exportarPDF);

    // Toggle pendientes
    document.getElementById('cc-toggle-pendientes')?.addEventListener('click', _togglePendientes);

    // Historial
    document.getElementById('cc-btn-historial')?.addEventListener('click', _abrirHistorial);
    document.getElementById('cc-modal-close')?.addEventListener('click', _cerrarHistorial);
    document.getElementById('cc-modal-historial')?.addEventListener('click', (e) => {
        if (e.target.id === 'cc-modal-historial') _cerrarHistorial();
    });
}

function _onTipoPeriodoChange() {
    const tipo = document.getElementById('cc-tipo-periodo').value;
    const grupoUnica = document.getElementById('cc-grupo-fecha-unica');
    const grupoDesde = document.getElementById('cc-grupo-fecha-desde');
    const grupoHasta = document.getElementById('cc-grupo-fecha-hasta');

    const hoy = formatDateISO(new Date());

    grupoUnica.classList.add('hidden');
    grupoDesde.classList.add('hidden');
    grupoHasta.classList.add('hidden');

    if (tipo === 'dia') {
        grupoUnica.classList.remove('hidden');
    } else if (tipo === 'rango') {
        grupoDesde.classList.remove('hidden');
        grupoHasta.classList.remove('hidden');
    } else if (tipo === 'mes') {
        // Calcular primer y último día del mes
        const now = new Date();
        const primerDia = new Date(now.getFullYear(), now.getMonth(), 1);
        const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        document.getElementById('cc-fecha-desde').value = formatDateISO(primerDia);
        document.getElementById('cc-fecha-hasta').value = formatDateISO(ultimoDia);
        grupoDesde.classList.remove('hidden');
        grupoHasta.classList.remove('hidden');
    } else if (tipo === 'semana') {
        const now = new Date();
        const diaSemana = now.getDay();
        const lunes = new Date(now);
        lunes.setDate(now.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        document.getElementById('cc-fecha-desde').value = formatDateISO(lunes);
        document.getElementById('cc-fecha-hasta').value = formatDateISO(domingo);
        grupoDesde.classList.remove('hidden');
        grupoHasta.classList.remove('hidden');
    }
}

// ==================== OBTENER PARÁMETROS ====================
function _getParams() {
    const tipo = document.getElementById('cc-tipo-periodo').value;
    const turno = document.getElementById('cc-turno').value;

    let fechaDesde, fechaHasta;

    if (tipo === 'dia') {
        fechaDesde = fechaHasta = document.getElementById('cc-fecha-unica').value;
    } else {
        fechaDesde = document.getElementById('cc-fecha-desde').value;
        fechaHasta = document.getElementById('cc-fecha-hasta').value;
    }

    if (!fechaDesde || !fechaHasta) {
        showToast('warning', 'Advertencia', 'Seleccione un período válido');
        return null;
    }

    if (fechaDesde > fechaHasta) {
        showToast('warning', 'Advertencia', 'La fecha inicial no puede ser mayor a la final');
        return null;
    }

    return { fechaDesde, fechaHasta, turno };
}

// ==================== EJECUTAR CIERRE ====================
async function _ejecutarCierre() {
    const params = _getParams();
    if (!params) return;

    const btn = document.getElementById('cc-btn-consultar');
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Calculando...`;

    try {
        const qp = {
            tipo: 'resumen_actual',
            fecha_desde: params.fechaDesde,
            fecha_hasta: params.fechaHasta,
        };
        if (params.turno) qp.turno = params.turno;

        const data = await apiRequest('/cierres', 'GET', null, qp);
        _cierreDatos = { ...data, params };
        _pendientesPage = 1;
        _pendientesHistData = null;

        _renderResultados(data, params);

        document.getElementById('cc-resultados').classList.remove('hidden');
        document.getElementById('cc-resultados').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        showToast('error', 'Error', 'No se pudo obtener el cierre: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `${svgIcon('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0')} Generar Cierre`;
    }
}

// ==================== RENDER RESULTADOS ====================
function _renderResultados(data, params) {
    const { resumen, top_articulos, pendientes_historicas } = data;

    // Banner período
    const bannerEl = document.getElementById('cc-banner-periodo');
    const turnoLabel = params.turno ? ` · Turno ${params.turno}` : '';
    const esRango = params.fechaDesde !== params.fechaHasta;
    const periodoTexto = esRango
        ? `${formatDate(params.fechaDesde)} al ${formatDate(params.fechaHasta)}`
        : `${formatDate(params.fechaDesde)}`;

    bannerEl.innerHTML = `
      <div class="cierre-banner__content">
        <div class="cierre-banner__left">
          <div class="cierre-banner__icon">${svgIcon('M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z')}</div>
          <div>
            <div class="cierre-banner__titulo">Cierre de Caja</div>
            <div class="cierre-banner__periodo">Período: ${periodoTexto}${turnoLabel}</div>
          </div>
        </div>
        <div class="cierre-banner__right">
          <div class="cierre-banner__fecha-gen">Generado: ${new Date().toLocaleString('es-VE')}</div>
        </div>
      </div>
    `;

    // Stats grid
    const statsEl = document.getElementById('cc-stats-grid');
    statsEl.innerHTML = `
      <div class="cierre-stat cierre-stat--blue">
        <div class="cierre-stat__label">Total Multas</div>
        <div class="cierre-stat__value">${formatNumber(resumen.total_multas || 0)}</div>
        <div class="cierre-stat__sub">Actas registradas</div>
      </div>
      <div class="cierre-stat cierre-stat--amber">
        <div class="cierre-stat__label">Pendientes</div>
        <div class="cierre-stat__value">${formatNumber(resumen.total_pendientes || 0)}</div>
        <div class="cierre-stat__sub">Sin pagar en período</div>
      </div>
      <div class="cierre-stat cierre-stat--green">
        <div class="cierre-stat__label">Pagadas</div>
        <div class="cierre-stat__value">${formatNumber(resumen.total_pagadas || 0)}</div>
        <div class="cierre-stat__sub">En período</div>
      </div>
      <div class="cierre-stat cierre-stat--gray">
        <div class="cierre-stat__label">Anuladas</div>
        <div class="cierre-stat__value">${formatNumber(resumen.total_anuladas || 0)}</div>
        <div class="cierre-stat__sub">En período</div>
      </div>
      <div class="cierre-stat cierre-stat--indigo">
        <div class="cierre-stat__label">Infractores Únicos</div>
        <div class="cierre-stat__value">${formatNumber(resumen.infractores_unicos || 0)}</div>
        <div class="cierre-stat__sub">Cédulas distintas</div>
      </div>
    `;

    // Desglose monetario
    const totalBs = parseFloat(resumen.monto_total_bs || 0);
    const pendBs = parseFloat(resumen.monto_pendiente_bs || 0);
    const pagBs = parseFloat(resumen.monto_pagado_bs || 0);
    const anuBs = parseFloat(resumen.monto_anulado_bs || 0);

    const desgloseEl = document.getElementById('cc-desglose-monetario');
    desgloseEl.innerHTML = `
      <div class="cierre-desglose">
        <div class="cierre-desglose__row cierre-desglose__row--total">
          <span class="cierre-desglose__label">MONTO TOTAL EMITIDO</span>
          <span class="cierre-desglose__value cierre-desglose__value--primary">${formatMonto(totalBs)} Bs.</span>
        </div>
        <div class="cierre-desglose__separator"></div>
        <div class="cierre-desglose__row">
          <div class="cierre-desglose__indicator cierre-desglose__indicator--green"></div>
          <span class="cierre-desglose__label">Monto Pagado</span>
          <span class="cierre-desglose__value cierre-desglose__value--green">${formatMonto(pagBs)} Bs.</span>
        </div>
        <div class="cierre-desglose__row">
          <div class="cierre-desglose__indicator cierre-desglose__indicator--amber"></div>
          <span class="cierre-desglose__label">Monto Pendiente (período)</span>
          <span class="cierre-desglose__value cierre-desglose__value--amber">${formatMonto(pendBs)} Bs.</span>
        </div>
        <div class="cierre-desglose__row">
          <div class="cierre-desglose__indicator cierre-desglose__indicator--gray"></div>
          <span class="cierre-desglose__label">Monto Anulado</span>
          <span class="cierre-desglose__value cierre-desglose__value--gray">${formatMonto(anuBs)} Bs.</span>
        </div>
        ${parseFloat(pendientes_historicas?.monto_total || 0) > 0 ? `
        <div class="cierre-desglose__separator"></div>
        <div class="cierre-desglose__row cierre-desglose__row--warning">
          <div class="cierre-desglose__indicator cierre-desglose__indicator--red"></div>
          <span class="cierre-desglose__label">Pendientes Históricos</span>
          <span class="cierre-desglose__value cierre-desglose__value--red">${formatMonto(parseFloat(pendientes_historicas?.monto_total || 0))} Bs.</span>
        </div>
        ` : ''}
      </div>
    `;

    // Top artículos
    const artEl = document.getElementById('cc-top-articulos');
    if (!top_articulos || top_articulos.length === 0) {
        artEl.innerHTML = `<div class="empty-state"><p class="empty-state__message">Sin datos de infracciones</p></div>`;
    } else {
        const maxCant = Math.max(...top_articulos.map(a => parseInt(a.cantidad)));
        artEl.innerHTML = `
          <div class="cierre-top-art">
            ${top_articulos.map((art, idx) => `
              <div class="cierre-top-art__row">
                <div class="cierre-top-art__rank">${idx + 1}</div>
                <div class="cierre-top-art__info">
                  <div class="cierre-top-art__nombre">
                    Art. ${art.articulo_numero}${art.articulo_literal ? ` lit. ${art.articulo_literal}` : ''}
                  </div>
                  <div class="cierre-top-art__bar-wrap">
                    <div class="cierre-top-art__bar" style="width: ${Math.round((parseInt(art.cantidad) / maxCant) * 100)}%"></div>
                  </div>
                </div>
                <div class="cierre-top-art__meta">
                  <span class="badge badge--activo">${art.cantidad}</span>
                  <span class="cierre-top-art__monto">${formatMonto(parseFloat(art.monto_total || 0))} Bs.</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
    }

    // Pendientes históricas resumen
    const pendH = pendientes_historicas;
    const totalPendH = parseInt(pendH?.total || 0);
    const montoPendH = parseFloat(pendH?.monto_total || 0);
    const pendResEl = document.getElementById('cc-pendientes-resumen');

    if (totalPendH === 0) {
        pendResEl.innerHTML = `
          <div class="cierre-pendientes-ok">
            ${svgIcon('M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0')}
            <span>No hay multas pendientes anteriores al período seleccionado</span>
          </div>
        `;
        document.getElementById('cc-toggle-pendientes').style.display = 'none';
    } else {
        pendResEl.innerHTML = `
          <div class="cierre-pendientes-alerta">
            <div class="cierre-pendientes-alerta__datos">
              <div class="cierre-pendientes-alerta__item">
                <span class="cierre-pendientes-alerta__num">${formatNumber(totalPendH)}</span>
                <span class="cierre-pendientes-alerta__desc">multas pendientes históricas</span>
              </div>
              <div class="cierre-pendientes-alerta__divider"></div>
              <div class="cierre-pendientes-alerta__item">
                <span class="cierre-pendientes-alerta__num">${formatMonto(montoPendH)} Bs.</span>
                <span class="cierre-pendientes-alerta__desc">monto total adeudado</span>
              </div>
            </div>
            <p class="cierre-pendientes-alerta__info">
              Estas multas fueron emitidas antes del período seleccionado y aún no han sido pagadas.
              Haga clic en "Ver detalle" para verificarlas.
            </p>
          </div>
        `;
        document.getElementById('cc-toggle-pendientes').style.display = '';
    }
}

// ==================== PENDIENTES HISTÓRICAS (TOGGLE) ====================
let _pendientesVisible = false;

async function _togglePendientes() {
    _pendientesVisible = !_pendientesVisible;
    const tablaEl = document.getElementById('cc-pendientes-tabla');
    const btnToggle = document.getElementById('cc-toggle-pendientes');

    if (!_pendientesVisible) {
        tablaEl.classList.add('hidden');
        btnToggle.textContent = 'Ver detalle';
        return;
    }

    tablaEl.classList.remove('hidden');
    btnToggle.textContent = 'Ocultar detalle';
    await _cargarPendientesHistoricas();
}

async function _cargarPendientesHistoricas(pagina = 1) {
    const tablaEl = document.getElementById('cc-pendientes-tabla');
    const params = _cierreDatos?.params;
    if (!params) return;

    tablaEl.innerHTML = `<div class="empty-state"><div class="spinner"></div></div>`;

    try {
        const fechaCorte = params.fechaDesde;
        const data = await apiRequest('/cierres', 'GET', null, {
            tipo: 'pendientes_historicas',
            fecha_corte: fechaCorte,
            page: pagina,
            limit: _pendientesLimit
        });
        _pendientesHistData = data;
        _pendientesPage = pagina;
        _renderTablaPendientes(data);
    } catch (err) {
        tablaEl.innerHTML = `<p style="color:var(--danger);padding:16px">Error: ${err.message}</p>`;
    }
}

function _renderTablaPendientes(data) {
    const tablaEl = document.getElementById('cc-pendientes-tabla');
    const { data: rows, total, page, limit } = data;
    const totalPages = Math.ceil(total / limit);

    if (!rows || rows.length === 0) {
        tablaEl.innerHTML = `<div class="empty-state"><p>No se encontraron multas pendientes históricas.</p></div>`;
        return;
    }

    tablaEl.innerHTML = `
      <div style="padding: 0 0 8px; font-size: 13px; color: var(--text-muted);">
        Mostrando ${rows.length} de ${total} multas pendientes · Página ${page} de ${totalPages}
      </div>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nº Acta</th>
              <th>Fecha</th>
              <th>Infractor</th>
              <th>Cédula</th>
              <th>Artículo</th>
              <th>Importe Bs.</th>
              <th>Días Pendiente</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(m => {
                const dias = Math.floor((new Date() - new Date(m.fecha)) / (1000 * 60 * 60 * 24));
                const diasClass = dias > 90 ? 'badge--pendiente' : dias > 30 ? 'badge--draft' : 'badge--activo';
                return `
                  <tr>
                    <td class="font-mono"><strong>${m.numero_acta}</strong></td>
                    <td>${formatDate(m.fecha)}</td>
                    <td>${m.nombres} ${m.apellidos}</td>
                    <td class="font-mono">${m.cedula}</td>
                    <td>Art. ${m.articulo_numero || 'N/A'}${m.articulo_literal ? ' ' + m.articulo_literal : ''}</td>
                    <td><strong>${formatMonto(parseFloat(m.importe_multa_bs || 0))}</strong></td>
                    <td><span class="badge ${diasClass}">${dias}d</span></td>
                    <td>
                      <button class="btn btn--ghost btn--sm" 
                        onclick="navigateTo('multas')">
                        Ver
                      </button>
                    </td>
                  </tr>
                `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${totalPages > 1 ? `
        <div class="pagination" style="margin-top:12px">
          ${page > 1 ? `<button class="btn btn--ghost btn--sm" onclick="_cargarPendientesHistoricas(${page - 1})">← Anterior</button>` : ''}
          <span style="font-size:13px;color:var(--text-muted)">Pág. ${page}/${totalPages}</span>
          ${page < totalPages ? `<button class="btn btn--ghost btn--sm" onclick="_cargarPendientesHistoricas(${page + 1})">Siguiente →</button>` : ''}
        </div>
      ` : ''}
    `;
}

// ==================== GUARDAR CIERRE ====================
async function _guardarCierre() {
    if (!_cierreDatos) {
        showToast('warning', 'Atención', 'Primero genere el cierre');
        return;
    }

    const funcionario = document.getElementById('cc-funcionario').value.trim();
    const observaciones = document.getElementById('cc-observaciones').value.trim();

    if (!funcionario) {
        showToast('warning', 'Atención', 'Ingrese el nombre del funcionario responsable');
        document.getElementById('cc-funcionario').focus();
        return;
    }

    const { resumen, pendientes_historicas, params } = _cierreDatos;

    confirmDialog(
        'Guardar Cierre de Caja',
        `¿Confirma guardar el cierre del período ${formatDate(params.fechaDesde)}${params.fechaDesde !== params.fechaHasta ? ' al ' + formatDate(params.fechaHasta) : ''}?`,
        async () => {
            try {
                showLoading(true);
                const payload = {
                    fecha_desde: params.fechaDesde,
                    fecha_hasta: params.fechaHasta,
                    turno: params.turno || null,
                    total_multas: parseInt(resumen.total_multas || 0),
                    total_pendientes: parseInt(resumen.total_pendientes || 0),
                    total_pagadas: parseInt(resumen.total_pagadas || 0),
                    total_anuladas: parseInt(resumen.total_anuladas || 0),
                    monto_total_bs: parseFloat(resumen.monto_total_bs || 0),
                    monto_pendiente_bs: parseFloat(resumen.monto_pendiente_bs || 0),
                    monto_pagado_bs: parseFloat(resumen.monto_pagado_bs || 0),
                    monto_anulado_bs: parseFloat(resumen.monto_anulado_bs || 0),
                    infractores_unicos: parseInt(resumen.infractores_unicos || 0),
                    pendientes_historicas_count: parseInt(pendientes_historicas?.total || 0),
                    pendientes_historicas_monto: parseFloat(pendientes_historicas?.monto_total || 0),
                    observaciones,
                    funcionario_cierre: funcionario
                };

                const resultado = await apiRequest('/cierres', 'POST', payload);
                showToast('success', 'Cierre guardado', `Número de cierre: ${resultado.numero_cierre}`);

            } catch (err) {
                showToast('error', 'Error', 'No se pudo guardar el cierre: ' + err.message);
            } finally {
                showLoading(false);
            }
        }
    );
}

// ==================== HISTORIAL ====================
async function _abrirHistorial() {
    document.getElementById('cc-modal-historial').classList.remove('hidden');
    await _cargarHistorial();
}

function _cerrarHistorial() {
    document.getElementById('cc-modal-historial').classList.add('hidden');
}

async function _cargarHistorial() {
    const contenidoEl = document.getElementById('cc-historial-content');
    contenidoEl.innerHTML = `<div class="empty-state"><div class="spinner"></div></div>`;

    try {
        const rows = await apiRequest('/cierres', 'GET', null, { tipo: 'historial' });

        if (!rows || rows.length === 0) {
            contenidoEl.innerHTML = `
              <div class="empty-state">
                <div class="empty-state__icon">${svgIcon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2')}</div>
                <div class="empty-state__title">Sin cierres guardados</div>
                <p class="empty-state__message">Los cierres que guarde aparecerán aquí</p>
              </div>`;
            return;
        }

        contenidoEl.innerHTML = `
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Nº Cierre</th>
                  <th>Período</th>
                  <th>Turno</th>
                  <th>Total Multas</th>
                  <th>Monto Total Bs.</th>
                  <th>Pendientes Hist.</th>
                  <th>Funcionario</th>
                  <th>Fecha Guardado</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(c => `
                  <tr>
                    <td class="font-mono"><strong>${c.numero_cierre}</strong></td>
                    <td>${formatDate(c.fecha_desde)}${c.fecha_desde !== c.fecha_hasta ? ' → ' + formatDate(c.fecha_hasta) : ''}</td>
                    <td>${c.turno || '—'}</td>
                    <td>
                      <span class="badge badge--activo">${c.total_multas}</span>
                    </td>
                    <td><strong>${formatMonto(parseFloat(c.monto_total_bs || 0))} Bs.</strong></td>
                    <td>
                      ${parseInt(c.pendientes_historicas_count) > 0
                        ? `<span class="badge badge--pendiente">${c.pendientes_historicas_count}</span>`
                        : '<span class="badge badge--activo">0</span>'}
                    </td>
                    <td>${c.funcionario_cierre || '—'}</td>
                    <td>${formatDate(c.fecha_cierre)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
    } catch (err) {
        contenidoEl.innerHTML = `<p style="color:var(--danger);padding:16px">Error al cargar historial: ${err.message}</p>`;
    }
}

// ==================== EXPORTAR PDF ====================
function _exportarPDF() {
    if (!_cierreDatos) {
        showToast('warning', 'Atención', 'Primero genere el cierre');
        return;
    }

    const { resumen, top_articulos, pendientes_historicas, params } = _cierreDatos;
    const funcionario = document.getElementById('cc-funcionario').value.trim() || 'Sin especificar';
    const observaciones = document.getElementById('cc-observaciones').value.trim();

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = margin;

        // ---- Encabezado ----
        doc.setFillColor(10, 35, 100);
        doc.rect(0, 0, pageW, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('IAPMLG - Instituto Autónomo de Policía del Municipio Los Guayos', pageW / 2, 14, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Estado Carabobo, Venezuela · G-20009676-4', pageW / 2, 21, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('CIERRE DE CAJA - SISTEMA DE MULTAS DE TRÁNSITO', pageW / 2, 33, { align: 'center' });

        y = 48;
        doc.setTextColor(30, 30, 30);

        // ---- Info período ----
        doc.setFillColor(240, 244, 255);
        doc.roundedRect(margin, y, pageW - margin * 2, 22, 3, 3, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 120);
        const turnoLab = params.turno ? ` | Turno: ${params.turno}` : '';
        const periodoPDF = params.fechaDesde === params.fechaHasta
            ? `Fecha: ${formatDate(params.fechaDesde)}`
            : `Período: ${formatDate(params.fechaDesde)} al ${formatDate(params.fechaHasta)}`;
        doc.text(`${periodoPDF}${turnoLab}`, margin + 4, y + 8);
        doc.text(`Generado: ${new Date().toLocaleString('es-VE')}`, margin + 4, y + 15);
        doc.text(`Funcionario: ${funcionario}`, pageW / 2, y + 8);
        y += 28;

        // ---- Totales ----
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('I. TOTALIZACIÓN DE MULTAS', margin, y);
        y += 7;

        const totales = [
            ['Total Multas Registradas', formatNumber(resumen.total_multas || 0)],
            ['Multas Pendientes (período)', formatNumber(resumen.total_pendientes || 0)],
            ['Multas Pagadas (período)', formatNumber(resumen.total_pagadas || 0)],
            ['Multas Anuladas (período)', formatNumber(resumen.total_anuladas || 0)],
            ['Infractores Únicos', formatNumber(resumen.infractores_unicos || 0)],
        ];

        totales.forEach(([label, val], idx) => {
            const bgColor = idx % 2 === 0 ? [250, 250, 255] : [255, 255, 255];
            doc.setFillColor(...bgColor);
            doc.rect(margin, y, pageW - margin * 2, 7, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.text(label, margin + 3, y + 5);
            doc.setFont('helvetica', 'bold');
            doc.text(val, pageW - margin - 3, y + 5, { align: 'right' });
            y += 7;
        });

        y += 6;

        // ---- Montos ----
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('II. TOTALIZACIÓN MONETARIA (Bs.)', margin, y);
        y += 7;

        const montos = [
            ['MONTO TOTAL EMITIDO', formatMonto(parseFloat(resumen.monto_total_bs || 0)), true],
            ['Monto Pagado', formatMonto(parseFloat(resumen.monto_pagado_bs || 0)), false],
            ['Monto Pendiente (período)', formatMonto(parseFloat(resumen.monto_pendiente_bs || 0)), false],
            ['Monto Anulado', formatMonto(parseFloat(resumen.monto_anulado_bs || 0)), false],
        ];

        if (parseFloat(pendientes_historicas?.monto_total || 0) > 0) {
            montos.push(['Monto Pendientes Históricos', formatMonto(parseFloat(pendientes_historicas.monto_total)), false]);
        }

        montos.forEach(([label, val, isBold], idx) => {
            const bgColor = isBold ? [220, 230, 255] : idx % 2 === 0 ? [250, 250, 255] : [255, 255, 255];
            doc.setFillColor(...bgColor);
            doc.rect(margin, y, pageW - margin * 2, 8, 'F');
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.setFontSize(isBold ? 10 : 9.5);
            doc.text(label, margin + 3, y + 5.5);
            doc.setFont('helvetica', 'bold');
            doc.text(`${val} Bs.`, pageW - margin - 3, y + 5.5, { align: 'right' });
            y += 8;
        });

        y += 6;

        // ---- Pendientes históricas ----
        const totalPendH = parseInt(pendientes_historicas?.total || 0);
        if (totalPendH > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('III. MULTAS PENDIENTES HISTÓRICAS (ANTERIORES AL PERÍODO)', margin, y);
            y += 7;

            doc.setFillColor(255, 243, 220);
            doc.roundedRect(margin, y, pageW - margin * 2, 14, 3, 3, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(180, 80, 0);
            doc.text(`⚠ ALERTA: Se registran ${totalPendH} multas pendientes anteriores al período`, margin + 4, y + 6);
            doc.text(`con un monto total adeudado de ${formatMonto(parseFloat(pendientes_historicas.monto_total))} Bs.`, margin + 4, y + 12);
            doc.setTextColor(30, 30, 30);
            y += 20;
        }

        // ---- Top Artículos ----
        if (top_articulos && top_articulos.length > 0) {
            if (y > 230) { doc.addPage(); y = margin; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('IV. INFRACCIONES MÁS FRECUENTES', margin, y);
            y += 7;

            doc.setFillColor(220, 230, 255);
            doc.rect(margin, y, pageW - margin * 2, 7, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text('Artículo', margin + 3, y + 5);
            doc.text('Cantidad', pageW - margin - 40, y + 5, { align: 'right' });
            doc.text('Monto Bs.', pageW - margin - 3, y + 5, { align: 'right' });
            y += 7;

            top_articulos.forEach((art, idx) => {
                if (y > 270) { doc.addPage(); y = margin; }
                const bgColor = idx % 2 === 0 ? [250, 250, 255] : [255, 255, 255];
                doc.setFillColor(...bgColor);
                doc.rect(margin, y, pageW - margin * 2, 6.5, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                const artLabel = `Art. ${art.articulo_numero}${art.articulo_literal ? ' lit. ' + art.articulo_literal : ''}`;
                doc.text(artLabel, margin + 3, y + 4.5);
                doc.setFont('helvetica', 'bold');
                doc.text(String(art.cantidad), pageW - margin - 40, y + 4.5, { align: 'right' });
                doc.text(`${formatMonto(parseFloat(art.monto_total || 0))} Bs.`, pageW - margin - 3, y + 4.5, { align: 'right' });
                y += 6.5;
            });
        }

        // ---- Observaciones ----
        if (observaciones) {
            y += 6;
            if (y > 250) { doc.addPage(); y = margin; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('OBSERVACIONES:', margin, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const lines = doc.splitTextToSize(observaciones, pageW - margin * 2);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 4;
        }

        // ---- Firma ----
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();

            // Footer
            doc.setFillColor(10, 35, 100);
            doc.rect(0, ph - 12, pw, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.text('IAPMLG · Sistema de Gestión de Multas · Documento generado automáticamente', pw / 2, ph - 5, { align: 'center' });
            doc.text(`Pág. ${i} de ${pageCount}`, pw - margin, ph - 5, { align: 'right' });
        }

        // Firma centrada en última página
        if (y < 230) {
            y += 20;
            const firmaX = pageW / 2;
            doc.setDrawColor(80, 80, 80);
            doc.setLineWidth(0.5);
            doc.line(firmaX - 40, y, firmaX + 40, y);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(30, 30, 30);
            doc.text(funcionario.toUpperCase(), firmaX, y + 6, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.text('Responsable del Cierre de Caja', firmaX, y + 12, { align: 'center' });
        }

        const fecha = params.fechaDesde;
        doc.save(`Cierre_Caja_${fecha}_IAPMLG.pdf`);
        showToast('success', 'PDF generado', 'El cierre se exportó correctamente');

    } catch (err) {
        showToast('error', 'Error PDF', err.message);
    }
}

// ==================== UTILS LOCALES ====================
function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatMonto(val) {
    if (isNaN(val)) return '0,00';
    return val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showLoading(show) {
    const el = document.getElementById('loading-overlay');
    if (el) el.classList.toggle('hidden', !show);
}
