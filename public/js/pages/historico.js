/* js/pages/historico.js - Histórico y reportes */

async function renderHistorico() {
    setPageTitle('Histórico de Multas');
    const content = document.getElementById('content');

    content.innerHTML = `
    <div class="page-header">
      <div class="page-header__info">
        <h1>Histórico de Multas</h1>
        <p>Consulta avanzada de multas — por infractor, por artículo y rankings</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-8 mb-24" id="hist-tabs">
      <button class="btn btn--primary" data-tab="infractor" id="tab-infractor">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        Por Infractor
      </button>
      <button class="btn btn--ghost" data-tab="articulo" id="tab-articulo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
        Por Artículo
      </button>
      <button class="btn btn--ghost" data-tab="ranking" id="tab-ranking">
        ${Icons.chart}
        Rankings
      </button>
    </div>

    <!-- Tab content -->
    <div id="hist-tab-content"></div>
  `;

    // Tab switching
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-tab]').forEach(b => b.className = 'btn btn--ghost');
            btn.className = 'btn btn--primary';
            loadHistTab(btn.dataset.tab);
        });
    });

    loadHistTab('infractor');
}

function loadHistTab(tab) {
    const container = document.getElementById('hist-tab-content');

    if (tab === 'infractor') {
        container.innerHTML = `
      <div class="card mb-20">
        <div class="card__header">
          <span class="card__title">
            <div class="card__title-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            Filtros de búsqueda
          </span>
        </div>
        <div class="card__body">
          <div class="hist-filtros">
            <div class="hist-filtro-grupo">
              <label class="form-label">Cédula del Infractor</label>
              <div class="search-box">
                <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" id="hist-cedula" placeholder="Ej: V-12345678 (opcional)">
              </div>
            </div>

            <div class="hist-filtro-grupo">
              <label class="form-label">Fecha Desde</label>
              <input type="date" class="form-control" id="hist-desde">
            </div>

            <div class="hist-filtro-grupo">
              <label class="form-label">Fecha Hasta</label>
              <input type="date" class="form-control" id="hist-hasta">
            </div>

            <div class="hist-filtro-grupo">
              <label class="form-label">Estado</label>
              <select class="form-control" id="hist-estado">
                <option value="">— Todos los estados —</option>
                <option value="PENDIENTE">⏳ Pendiente</option>
                <option value="PAGADO">✅ Pagado</option>
                <option value="ANULADO">❌ Anulado</option>
              </select>
            </div>

            <div class="hist-filtro-grupo hist-filtro-grupo--actions">
              <label class="form-label">&nbsp;</label>
              <div class="hist-filtro-btns">
                <button class="btn btn--primary" id="btn-buscar-historico" onclick="buscarHistorico()">
                  ${Icons.search} Buscar
                </button>
                <button class="btn btn--ghost" onclick="limpiarFiltrosHistorico()">
                  Limpiar
                </button>
                <button class="btn btn--ghost" onclick="exportarHistoricoCSV()" title="Exportar a CSV">
                  ${Icons.download} CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="hist-results"></div>
    `;

        document.getElementById('hist-cedula')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') buscarHistorico();
        });

    } else if (tab === 'articulo') {
        container.innerHTML = `
      <div class="card mb-20">
        <div class="card__header">
          <span class="card__title">
            <div class="card__title-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            Filtros de búsqueda
          </span>
        </div>
        <div class="card__body">
          <div class="hist-filtros">
            <div class="hist-filtro-grupo" style="flex:2;min-width:260px">
              <label class="form-label">Artículo de Infracción</label>
              <select class="form-control" id="hist-articulo-id">
                <option value="">— Todos los artículos —</option>
              </select>
            </div>

            <div class="hist-filtro-grupo">
              <label class="form-label">Fecha Desde</label>
              <input type="date" class="form-control" id="hist-art-desde">
            </div>

            <div class="hist-filtro-grupo">
              <label class="form-label">Fecha Hasta</label>
              <input type="date" class="form-control" id="hist-art-hasta">
            </div>

            <div class="hist-filtro-grupo">
              <label class="form-label">Estado</label>
              <select class="form-control" id="hist-art-estado">
                <option value="">— Todos los estados —</option>
                <option value="PENDIENTE">⏳ Pendiente</option>
                <option value="PAGADO">✅ Pagado</option>
                <option value="ANULADO">❌ Anulado</option>
              </select>
            </div>

            <div class="hist-filtro-grupo hist-filtro-grupo--actions">
              <label class="form-label">&nbsp;</label>
              <div class="hist-filtro-btns">
                <button class="btn btn--primary" onclick="buscarPorArticulo()">
                  ${Icons.search} Buscar
                </button>
                <button class="btn btn--ghost" onclick="limpiarFiltrosArticulo()">
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="hist-art-results"></div>
    `;

        // Load articles for select
        Api.articulos.list().then(arts => {
            const sel = document.getElementById('hist-articulo-id');
            if (!sel) return;
            (Array.isArray(arts) ? arts : (arts.data || [])).forEach(a => {
                const opt = document.createElement('option');
                opt.value = a.id;
                opt.textContent = `Art. ${a.numero}${a.literal ? ' Lit. ' + a.literal : ''} — ${a.descripcion.substring(0, 55)}`;
                sel.appendChild(opt);
            });
        });

    } else if (tab === 'ranking') {
        container.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" id="ranking-grids">
        <div class="card">
          <div class="card__header">
            <span class="card__title">🏆 Top Infractores</span>
          </div>
          <div id="ranking-infractores"><div class="empty-state"><div class="spinner"></div></div></div>
        </div>
        <div class="card">
          <div class="card__header">
            <span class="card__title">📋 Artículos más infringidos</span>
          </div>
          <div id="ranking-articulos"><div class="empty-state"><div class="spinner"></div></div></div>
        </div>
      </div>
    `;

        loadRankings();
    }
}

// ==================== LIMPIAR FILTROS ====================
function limpiarFiltrosHistorico() {
    const campos = ['hist-cedula', 'hist-desde', 'hist-hasta', 'hist-estado'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('hist-results').innerHTML = '';
}

function limpiarFiltrosArticulo() {
    const campos = ['hist-articulo-id', 'hist-art-desde', 'hist-art-hasta', 'hist-art-estado'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('hist-art-results').innerHTML = '';
}

// ==================== BUSCAR POR INFRACTOR ====================
async function buscarHistorico() {
    const cedula  = document.getElementById('hist-cedula')?.value.trim();
    const desde   = document.getElementById('hist-desde')?.value;
    const hasta   = document.getElementById('hist-hasta')?.value;
    const estado  = document.getElementById('hist-estado')?.value;
    const resultsEl = document.getElementById('hist-results');
    if (!resultsEl) return;

    // Validar fechas
    if (desde && hasta && desde > hasta) {
        showToast('warning', 'Fechas inválidas', 'La fecha "Desde" no puede ser mayor a "Hasta"');
        return;
    }

    resultsEl.innerHTML = `<div class="card"><div class="empty-state"><div class="spinner"></div><p style="margin-top:12px">Buscando...</p></div></div>`;

    try {
        const params = { limit: 200 };
        if (cedula) params.cedula = cedula;
        if (desde)  params.fecha_desde = desde;
        if (hasta)  params.fecha_hasta = hasta;
        if (estado) params.estado = estado;

        const result = await Api.multas.list(params);

        if (!result.data || result.data.length === 0) {
            resultsEl.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state__icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div class="empty-state__title">Sin resultados</div>
            <div class="empty-state__message">No se encontraron multas para los criterios indicados</div>
          </div>
        </div>
      `;
            return;
        }

        // Calcular totales por estado
        const totales = _calcularTotales(result.data);
        const filtrosActivos = _buildFiltrosLabel({ cedula, desde, hasta, estado });

        // Tarjeta de resumen (solo si hay cedula o algún filtro)
        let summaryHtml = '';
        if (cedula) {
            const infractor = result.data[0];
            summaryHtml = `
        <div class="hist-resumen-card mb-16">
          <div class="hist-resumen-card__info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <div>
              <strong>${infractor.nombres} ${infractor.apellidos}</strong>
              <span class="hist-resumen-card__cedula">C.I.: ${infractor.cedula}</span>
            </div>
          </div>
          ${_buildTotalesBar(totales)}
        </div>
      `;
        } else {
            summaryHtml = `
        <div class="hist-resumen-card mb-16">
          <div class="hist-resumen-card__info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <div>
              <strong>Resultados de búsqueda</strong>
              ${filtrosActivos ? `<span class="hist-resumen-card__cedula">${filtrosActivos}</span>` : ''}
            </div>
          </div>
          ${_buildTotalesBar(totales)}
        </div>
      `;
        }

        resultsEl.innerHTML = summaryHtml + `
      <div class="card">
        <div class="card__header">
          <span class="card__title">
            Resultados — <strong>${formatNumber(result.total)}</strong> multas encontradas
            ${estado ? ` · <span class="badge badge--${estado.toLowerCase()}">${estado}</span>` : ''}
          </span>
          <button class="btn btn--ghost btn--sm" onclick="exportarHistoricoCSV()" title="Exportar CSV">
            ${Icons.download} Exportar CSV
          </button>
        </div>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>N° Acta</th>
                <th>Fecha</th>
                <th>Turno</th>
                <th>Infractor</th>
                <th>Cédula</th>
                <th>Artículo</th>
                <th>Descripción</th>
                <th>Importe (Bs.)</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${result.data.map(m => `
                <tr>
                  <td><span class="acta-number-badge">Nº ${m.numero_acta}</span></td>
                  <td>${formatDate(m.fecha)}</td>
                  <td><span class="badge badge--inactivo">${m.turno || '—'}</span></td>
                  <td><strong>${m.nombres} ${m.apellidos}</strong></td>
                  <td class="font-mono">${m.cedula}</td>
                  <td>${m.articulo_numero ? `Art. ${m.articulo_numero}${m.articulo_literal ? ' Lit. ' + m.articulo_literal : ''}` : '—'}</td>
                  <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                      title="${m.descripcion_infraccion || ''}">
                    ${m.descripcion_infraccion ? m.descripcion_infraccion.substring(0, 45) + (m.descripcion_infraccion.length > 45 ? '…' : '') : '—'}
                  </td>
                  <td class="font-mono"><strong>${m.importe_multa_bs ? formatCurrency(m.importe_multa_bs) : '—'}</strong></td>
                  <td>${statusBadge(m.estado)}</td>
                  <td>
                    <button class="btn btn--gold btn--sm" onclick="imprimirActa(${m.id})" title="Generar PDF">
                      ${Icons.pdf}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${result.total > result.data.length ? `
          <div class="hist-paginacion-aviso">
            Mostrando los primeros ${result.data.length} de ${result.total} registros. Use los filtros para refinar la búsqueda.
          </div>
        ` : ''}
      </div>
    `;

    } catch (err) {
        resultsEl.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state__title">Error: ${err.message}</div></div></div>`;
    }
}

// ==================== BUSCAR POR ARTÍCULO ====================
async function buscarPorArticulo() {
    const articuloId = document.getElementById('hist-articulo-id')?.value;
    const desde      = document.getElementById('hist-art-desde')?.value;
    const hasta      = document.getElementById('hist-art-hasta')?.value;
    const estado     = document.getElementById('hist-art-estado')?.value;
    const resultsEl  = document.getElementById('hist-art-results');
    if (!resultsEl) return;

    if (desde && hasta && desde > hasta) {
        showToast('warning', 'Fechas inválidas', 'La fecha "Desde" no puede ser mayor a "Hasta"');
        return;
    }

    resultsEl.innerHTML = `<div class="card"><div class="empty-state"><div class="spinner"></div></div></div>`;

    try {
        const params = { limit: 200 };
        if (articuloId) params.articulo_id = articuloId;
        if (desde)      params.fecha_desde = desde;
        if (hasta)      params.fecha_hasta = hasta;
        if (estado)     params.estado = estado;

        const result = await Api.multas.list(params);

        if (!result.data || result.data.length === 0) {
            resultsEl.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state__title">Sin resultados</div>
            <div class="empty-state__message">No se encontraron infracciones para los criterios indicados</div>
          </div>
        </div>
      `;
            return;
        }

        const totales = _calcularTotales(result.data);
        const first   = result.data[0];
        const artDesc = first.articulo_descripcion || first.descripcion_infraccion || '';

        const artLabel = articuloId
            ? `Art. ${first.articulo_numero || '—'}${first.articulo_literal ? ' Lit. ' + first.articulo_literal : ''}`
            : 'Todos los artículos';

        resultsEl.innerHTML = `
      <div class="hist-resumen-card mb-16">
        <div class="hist-resumen-card__info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          </svg>
          <div>
            <strong>${artLabel}</strong>
            ${artDesc && articuloId ? `<span class="hist-resumen-card__cedula">${artDesc.substring(0,80)}</span>` : ''}
          </div>
        </div>
        ${_buildTotalesBar(totales)}
      </div>

      <div class="card">
        <div class="card__header">
          <span class="card__title">
            Infracciones — <strong>${formatNumber(result.total)}</strong> registros
            ${estado ? ` · <span class="badge badge--${estado.toLowerCase()}">${estado}</span>` : ''}
          </span>
        </div>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>N° Acta</th>
                <th>Fecha</th>
                <th>Turno</th>
                <th>Infractor</th>
                <th>Cédula</th>
                <th>Artículo</th>
                <th>Importe (Bs.)</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${result.data.map(m => `
                <tr>
                  <td><span class="acta-number-badge">Nº ${m.numero_acta}</span></td>
                  <td>${formatDate(m.fecha)}</td>
                  <td><span class="badge badge--inactivo">${m.turno || '—'}</span></td>
                  <td><strong>${m.nombres} ${m.apellidos}</strong></td>
                  <td class="font-mono">${m.cedula}</td>
                  <td>${m.articulo_numero ? `Art. ${m.articulo_numero}${m.articulo_literal ? ' Lit. ' + m.articulo_literal : ''}` : '—'}</td>
                  <td class="font-mono"><strong>${m.importe_multa_bs ? formatCurrency(m.importe_multa_bs) : '—'}</strong></td>
                  <td>${statusBadge(m.estado)}</td>
                  <td>
                    <button class="btn btn--gold btn--sm" onclick="imprimirActa(${m.id})" title="Generar PDF">
                      ${Icons.pdf}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${result.total > result.data.length ? `
          <div class="hist-paginacion-aviso">
            Mostrando los primeros ${result.data.length} de ${result.total} registros.
          </div>
        ` : ''}
      </div>
    `;
    } catch (err) {
        resultsEl.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state__title">Error: ${err.message}</div></div></div>`;
    }
}

// ==================== HELPERS INTERNOS ====================

/** Calcula totales por estado de un array de multas */
function _calcularTotales(data) {
    const totales = {
        total:     data.length,
        pendiente: 0,
        pagado:    0,
        anulado:   0,
        montoPendiente: 0,
        montoPagado:    0,
        montoAnulado:   0,
        montoTotal:     0,
    };
    data.forEach(m => {
        const monto = parseFloat(m.importe_multa_bs || 0);
        totales.montoTotal += monto;
        if (m.estado === 'PENDIENTE') { totales.pendiente++; totales.montoPendiente += monto; }
        else if (m.estado === 'PAGADO')  { totales.pagado++;    totales.montoPagado    += monto; }
        else if (m.estado === 'ANULADO') { totales.anulado++;   totales.montoAnulado   += monto; }
    });
    return totales;
}

/** Construye la barra de totales por estado */
function _buildTotalesBar(t) {
    return `
    <div class="hist-totales-bar">
      <div class="hist-totales-bar__item hist-totales-bar__item--total">
        <span class="hist-totales-bar__num">${t.total}</span>
        <span class="hist-totales-bar__label">Total</span>
        <span class="hist-totales-bar__monto">${formatCurrency(t.montoTotal)} Bs.</span>
      </div>
      <div class="hist-totales-bar__divider"></div>
      <div class="hist-totales-bar__item hist-totales-bar__item--pendiente">
        <span class="hist-totales-bar__num">${t.pendiente}</span>
        <span class="hist-totales-bar__label">Pendientes</span>
        <span class="hist-totales-bar__monto">${formatCurrency(t.montoPendiente)} Bs.</span>
      </div>
      <div class="hist-totales-bar__divider"></div>
      <div class="hist-totales-bar__item hist-totales-bar__item--pagado">
        <span class="hist-totales-bar__num">${t.pagado}</span>
        <span class="hist-totales-bar__label">Pagadas</span>
        <span class="hist-totales-bar__monto">${formatCurrency(t.montoPagado)} Bs.</span>
      </div>
      <div class="hist-totales-bar__divider"></div>
      <div class="hist-totales-bar__item hist-totales-bar__item--anulado">
        <span class="hist-totales-bar__num">${t.anulado}</span>
        <span class="hist-totales-bar__label">Anuladas</span>
        <span class="hist-totales-bar__monto">${formatCurrency(t.montoAnulado)} Bs.</span>
      </div>
    </div>
  `;
}

/** Texto de filtros activos */
function _buildFiltrosLabel({ cedula, desde, hasta, estado }) {
    const partes = [];
    if (desde)  partes.push(`desde ${formatDate(desde)}`);
    if (hasta)  partes.push(`hasta ${formatDate(hasta)}`);
    if (estado) partes.push(`estado: ${estado}`);
    return partes.length ? partes.join(' · ') : '';
}

// ==================== RANKINGS ====================
async function loadRankings() {
    try {
        const [infractores, articulos] = await Promise.all([
            Api.estadisticas.porInfractor(),
            Api.estadisticas.porArticulo()
        ]);

        const infEl = document.getElementById('ranking-infractores');
        const artEl = document.getElementById('ranking-articulos');

        if (infEl) {
            if (!infractores || infractores.length === 0) {
                infEl.innerHTML = '<div class="empty-state"><div class="empty-state__title">Sin datos</div></div>';
            } else {
                infEl.innerHTML = `
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr><th>#</th><th>Infractor</th><th>Cédula</th><th>Multas</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                ${infractores.slice(0, 15).map((r, i) => `
                  <tr>
                    <td><strong style="color:${i < 3 ? 'var(--clr-gold)' : 'inherit'}">${i + 1}</strong></td>
                    <td>${r.nombres} ${r.apellidos}</td>
                    <td class="font-mono">${r.cedula}</td>
                    <td><span class="badge badge--${r.cantidad_multas >= 3 ? 'pendiente' : 'activo'}">${r.cantidad_multas}</span></td>
                    <td>
                      <button class="btn btn--ghost btn--sm"
                        onclick="navigateTo('historico'); setTimeout(() => { document.getElementById('hist-cedula').value = '${r.cedula}'; buscarHistorico(); }, 300)">
                        Ver historial
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
            }
        }

        if (artEl) {
            if (!articulos || articulos.length === 0) {
                artEl.innerHTML = '<div class="empty-state"><div class="empty-state__title">Sin datos</div></div>';
            } else {
                artEl.innerHTML = `
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr><th>#</th><th>Artículo</th><th>Infracciones</th><th>Monto Total</th></tr>
              </thead>
              <tbody>
                ${articulos.slice(0, 15).map((r, i) => `
                  <tr>
                    <td><strong style="color:${i < 3 ? 'var(--clr-gold)' : 'inherit'}">${i + 1}</strong></td>
                    <td>
                      <strong>Art. ${r.numero || '—'}${r.literal ? ' Lit. ' + r.literal : ''}</strong>
                      <div class="clr-text-light" style="font-size:11px">${r.descripcion ? r.descripcion.substring(0, 55) : ''}</div>
                    </td>
                    <td><span class="badge badge--pendiente">${r.cantidad_multas}</span></td>
                    <td class="font-mono">${formatCurrency(r.total_multa_bs || 0)} Bs.</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
            }
        }
    } catch (err) {
        showToast('error', 'Error', err.message);
    }
}

// ==================== EXPORTAR CSV ====================
async function exportarHistoricoCSV() {
    const cedula = document.getElementById('hist-cedula')?.value.trim();
    const desde  = document.getElementById('hist-desde')?.value;
    const hasta  = document.getElementById('hist-hasta')?.value;
    const estado = document.getElementById('hist-estado')?.value;

    try {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) loadingOverlay.classList.remove('hidden');

        const params = { limit: 1000 };
        if (cedula) params.cedula = cedula;
        if (desde)  params.fecha_desde = desde;
        if (hasta)  params.fecha_hasta = hasta;
        if (estado) params.estado = estado;

        const result = await Api.multas.list(params);

        if (loadingOverlay) loadingOverlay.classList.add('hidden');

        if (!result.data || result.data.length === 0) {
            showToast('warning', 'Sin datos', 'No hay multas para exportar con los filtros actuales');
            return;
        }

        const headers = ['N° Acta', 'Fecha', 'Hora', 'Turno', 'Nombres', 'Apellidos', 'Cédula',
            'Teléfono', 'Dirección Infractor', 'Marca', 'Modelo', 'Año', 'Tipo', 'Color',
            'Matrícula', 'Artículo', 'Literal', 'Descripción', 'UT', 'TCMMV', 'Importe Bs.',
            'Funcionario', 'CI Funcionario', 'Estado'];

        const rows = result.data.map(m => [
            m.numero_acta, m.fecha, m.hora || '', m.turno || '', m.nombres, m.apellidos, m.cedula,
            m.telefono || '', m.direccion_infractor || '', m.marca || '', m.modelo || '', m.anio || '',
            m.tipo || '', m.color || '', m.matricula || '', m.articulo_numero || '', m.articulo_literal || '',
            m.descripcion_infraccion || '', m.valor_ut || '', m.valor_tcmmv || '', m.importe_multa_bs || '',
            m.funcionario || '', m.ci_funcionario || '', m.estado
        ]);

        const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `multas_historico_${new Date().toISOString().split('T')[0]}${estado ? '_' + estado : ''}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('success', 'Exportado', `${result.data.length} registros exportados`);
    } catch (err) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        showToast('error', 'Error', err.message);
    }
}
