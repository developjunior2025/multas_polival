/* js/pages/historico.js - Histórico y reportes */

async function renderHistorico() {
    setPageTitle('Histórico de Multas');
    const content = document.getElementById('content');

    content.innerHTML = `
    <div class="page-header">
      <div class="page-header__info">
        <h1>Histórico de Multas</h1>
        <p>Consulta avanzada de multas — por infractor y por artículo</p>
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
          <span class="card__title">Buscar por Infractor</span>
        </div>
        <div class="card__body">
          <div class="filters-bar">
            <div class="search-box">
              <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" id="hist-cedula" placeholder="Cédula del infractor (ej: V-12345678)">
            </div>
            <input type="date" class="filter-select" id="hist-desde" placeholder="Desde">
            <input type="date" class="filter-select" id="hist-hasta" placeholder="Hasta">
            <button class="btn btn--primary" onclick="buscarHistorico()">
              ${Icons.search} Buscar
            </button>
            <button class="btn btn--ghost" onclick="exportarHistoricoCSV()">
              ${Icons.download} Exportar CSV
            </button>
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
          <span class="card__title">Buscar por Artículo</span>
        </div>
        <div class="card__body">
          <div class="filters-bar">
            <select class="filter-select" id="hist-articulo-id" style="min-width:320px">
              <option value="">— Seleccionar artículo —</option>
            </select>
            <input type="date" class="filter-select" id="hist-art-desde">
            <input type="date" class="filter-select" id="hist-art-hasta">
            <button class="btn btn--primary" onclick="buscarPorArticulo()">
              ${Icons.search} Buscar
            </button>
          </div>
        </div>
      </div>
      <div id="hist-art-results"></div>
    `;

        // Load articles for select
        Api.articulos.list().then(arts => {
            const sel = document.getElementById('hist-articulo-id');
            if (!sel) return;
            arts.forEach(a => {
                const opt = document.createElement('option');
                opt.value = a.id;
                opt.textContent = `Art. ${a.numero}${a.literal ? ' Lit. ' + a.literal : ''} - ${a.descripcion.substring(0, 60)}`;
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

async function buscarHistorico() {
    const cedula = document.getElementById('hist-cedula')?.value.trim();
    const desde = document.getElementById('hist-desde')?.value;
    const hasta = document.getElementById('hist-hasta')?.value;
    const resultsEl = document.getElementById('hist-results');
    if (!resultsEl) return;

    resultsEl.innerHTML = `<div class="card"><div class="empty-state"><div class="spinner"></div><p style="margin-top:12px">Buscando...</p></div></div>`;

    try {
        const params = { limit: 100 };
        if (cedula) params.cedula = cedula;
        if (desde) params.fecha_desde = desde;
        if (hasta) params.fecha_hasta = hasta;

        const result = await Api.multas.list(params);

        if (!result.data || result.data.length === 0) {
            resultsEl.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state__title">Sin resultados</div>
            <div class="empty-state__message">No se encontraron multas para los criterios ingresados</div>
          </div>
        </div>
      `;
            return;
        }

        // Summary if searching by cedula
        let summaryHtml = '';
        if (cedula) {
            const total = result.data.reduce((s, m) => s + parseFloat(m.importe_multa_bs || 0), 0);
            const infractor = result.data[0];
            summaryHtml = `
        <div class="card mb-16">
          <div class="card__body">
            <div class="alert alert--info">
              <strong>${infractor.nombres} ${infractor.apellidos}</strong> (C.I.: ${infractor.cedula}) — 
              <strong>${result.total} multas</strong> registradas · 
              Total: <strong>Bs. ${formatCurrency(total)}</strong>
            </div>
          </div>
        </div>
      `;
        }

        resultsEl.innerHTML = summaryHtml + `
      <div class="card">
        <div class="card__header">
          <span class="card__title">Resultados — ${formatNumber(result.total)} multas encontradas</span>
        </div>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>N° Acta</th>
                <th>Fecha</th>
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
                  <td><strong>${m.nombres} ${m.apellidos}</strong></td>
                  <td class="font-mono">${m.cedula}</td>
                  <td>${m.articulo_numero ? `Art. ${m.articulo_numero}${m.articulo_literal ? ' Lit. ' + m.articulo_literal : ''}` : '—'}</td>
                  <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" 
                      title="${m.descripcion_infraccion || ''}">
                    ${m.descripcion_infraccion ? m.descripcion_infraccion.substring(0, 50) + (m.descripcion_infraccion.length > 50 ? '...' : '') : '—'}
                  </td>
                  <td class="font-mono">${m.importe_multa_bs ? formatCurrency(m.importe_multa_bs) : '—'}</td>
                  <td>${statusBadge(m.estado)}</td>
                  <td>
                    <button class="btn btn--gold btn--sm" onclick="imprimirActa(${m.id})" title="PDF">
                      ${Icons.pdf}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    } catch (err) {
        resultsEl.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state__title">Error: ${err.message}</div></div></div>`;
    }
}

async function buscarPorArticulo() {
    const articuloId = document.getElementById('hist-articulo-id')?.value;
    const desde = document.getElementById('hist-art-desde')?.value;
    const hasta = document.getElementById('hist-art-hasta')?.value;
    const resultsEl = document.getElementById('hist-art-results');
    if (!resultsEl) return;

    resultsEl.innerHTML = `<div class="card"><div class="empty-state"><div class="spinner"></div></div></div>`;

    try {
        const params = { limit: 100 };
        if (articuloId) params.articulo_id = articuloId;
        if (desde) params.fecha_desde = desde;
        if (hasta) params.fecha_hasta = hasta;

        const result = await Api.multas.list(params);

        if (!result.data || result.data.length === 0) {
            resultsEl.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state__title">Sin resultados</div></div></div>`;
            return;
        }

        const totalMonto = result.data.reduce((s, m) => s + parseFloat(m.importe_multa_bs || 0), 0);
        const first = result.data[0];
        const artDesc = first.articulo_descripcion || first.descripcion_infraccion || '';

        resultsEl.innerHTML = `
      <div class="card mb-16"><div class="card__body">
        <div class="alert alert--info">
          Artículo: <strong>Art. ${first.articulo_numero || '—'}${first.articulo_literal ? ' Lit. ' + first.articulo_literal : ''}</strong> — 
          <strong>${result.total} infracciones</strong> registradas · 
          Total acumulado: <strong>Bs. ${formatCurrency(totalMonto)}</strong>
        </div>
        ${artDesc ? `<p style="font-size:13px;color:var(--clr-text-mid);margin-top:8px">${artDesc}</p>` : ''}
      </div></div>

      <div class="card">
        <div class="card__header">
          <span class="card__title">Infracciones — ${formatNumber(result.total)} registros</span>
        </div>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>N° Acta</th>
                <th>Fecha</th>
                <th>Infractor</th>
                <th>Cédula</th>
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
                  <td><strong>${m.nombres} ${m.apellidos}</strong></td>
                  <td class="font-mono">${m.cedula}</td>
                  <td class="font-mono">${m.importe_multa_bs ? formatCurrency(m.importe_multa_bs) : '—'}</td>
                  <td>${statusBadge(m.estado)}</td>
                  <td>
                    <button class="btn btn--gold btn--sm" onclick="imprimirActa(${m.id})">
                      ${Icons.pdf}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    } catch (err) {
        resultsEl.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state__title">Error: ${err.message}</div></div></div>`;
    }
}

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
                <tr><th>#</th><th>Infractor</th><th>Cédula</th><th>Multas</th></tr>
              </thead>
              <tbody>
                ${infractores.slice(0, 15).map((r, i) => `
                  <tr>
                    <td><strong style="color:${i < 3 ? 'var(--clr-gold)' : 'inherit'}">${i + 1}</strong></td>
                    <td>${r.nombres} ${r.apellidos}</td>
                    <td class="font-mono">${r.cedula}</td>
                    <td><span class="badge badge--${r.cantidad_multas >= 3 ? 'pendiente' : 'activo'}">${r.cantidad_multas}</span></td>
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
                <tr><th>#</th><th>Artículo</th><th>Infracciones</th></tr>
              </thead>
              <tbody>
                ${articulos.slice(0, 15).map((r, i) => `
                  <tr>
                    <td><strong style="color:${i < 3 ? 'var(--clr-gold)' : 'inherit'}">${i + 1}</strong></td>
                    <td>
                      <strong>Art. ${r.numero || '—'}${r.literal ? ' Lit. ' + r.literal : ''}</strong>
                      <div class="clr-text-light" style="font-size:11px">${r.descripcion ? r.descripcion.substring(0, 50) : ''}</div>
                    </td>
                    <td><span class="badge badge--pendiente">${r.cantidad_multas}</span></td>
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

async function exportarHistoricoCSV() {
    const cedula = document.getElementById('hist-cedula')?.value.trim();
    const desde = document.getElementById('hist-desde')?.value;
    const hasta = document.getElementById('hist-hasta')?.value;

    try {
        showLoading();
        const params = { limit: 1000 };
        if (cedula) params.cedula = cedula;
        if (desde) params.fecha_desde = desde;
        if (hasta) params.fecha_hasta = hasta;

        const result = await Api.multas.list(params);
        hideLoading();

        if (!result.data || result.data.length === 0) {
            showToast('warning', 'Sin datos', 'No hay multas para exportar');
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
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `multas_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('success', 'Exportado', `${result.data.length} registros exportados`);
    } catch (err) {
        hideLoading();
        showToast('error', 'Error', err.message);
    }
}
