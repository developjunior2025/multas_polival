/* js/pages/multas.js - Listado de actas de infracción */

let multasPage = 1;
let multasTotal = 0;
const multasLimit = 15;
let multasFilters = {};

async function renderMultas() {
    setPageTitle('Actas de Infracción');
    multasPage = 1;
    multasFilters = {};

    const content = document.getElementById('content');
    content.innerHTML = `
    <div class="page-header">
      <div class="page-header__info">
        <h1>Actas de Infracción</h1>
        <p>Listado y gestión de multas registradas</p>
      </div>
      <button class="btn btn--primary" onclick="navigateTo('nueva-multa')" id="btn-new-multa">
        ${Icons.plus} Nueva Multa
      </button>
    </div>

    <div class="card mb-16">
      <div class="card__body">
        <div class="filters-bar">
          <div class="search-box">
            <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="filter-search" placeholder="Buscar por cédula o nombre..." />
          </div>
          <input type="date" class="filter-select" id="filter-desde" placeholder="Desde">
          <input type="date" class="filter-select" id="filter-hasta" placeholder="Hasta">
          <select class="filter-select" id="filter-estado">
            <option value="">— Estado —</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="PAGADO">PAGADO</option>
            <option value="ANULADO">ANULADO</option>
          </select>
          <button class="btn btn--primary" id="btn-buscar">
            ${Icons.search} Buscar
          </button>
          <button class="btn btn--ghost" id="btn-limpiar">Limpiar</button>
        </div>
      </div>
    </div>

    <div class="card" id="multas-card">
      <div class="empty-state"><div class="spinner"></div></div>
    </div>
  `;

    document.getElementById('btn-buscar')?.addEventListener('click', () => {
        multasPage = 1;
        multasFilters = buildMultasFilters();
        loadMultasTable();
    });

    document.getElementById('btn-limpiar')?.addEventListener('click', () => {
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-desde').value = '';
        document.getElementById('filter-hasta').value = '';
        document.getElementById('filter-estado').value = '';
        multasPage = 1;
        multasFilters = {};
        loadMultasTable();
    });

    document.getElementById('filter-search')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            multasPage = 1;
            multasFilters = buildMultasFilters();
            loadMultasTable();
        }
    });

    await loadMultasTable();
}

function buildMultasFilters() {
    const search = document.getElementById('filter-search')?.value.trim();
    const desde = document.getElementById('filter-desde')?.value;
    const hasta = document.getElementById('filter-hasta')?.value;
    const estado = document.getElementById('filter-estado')?.value;

    const filters = {};
    if (search) filters.cedula = search; // searches by cedula
    if (desde) filters.fecha_desde = desde;
    if (hasta) filters.fecha_hasta = hasta;
    if (estado) filters.estado = estado;
    return filters;
}

async function loadMultasTable() {
    const card = document.getElementById('multas-card');
    if (!card) return;

    card.innerHTML = `<div class="empty-state"><div class="spinner"></div><p style="margin-top:12px">Cargando actas...</p></div>`;

    try {
        const result = await Api.multas.list({
            ...multasFilters,
            page: multasPage,
            limit: multasLimit,
        });

        multasTotal = result.total;
        const totalPages = Math.ceil(multasTotal / multasLimit);

        if (!result.data || result.data.length === 0) {
            card.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <div class="empty-state__title">No hay actas registradas</div>
          <div class="empty-state__message">Registre una nueva multa con el botón "Nueva Multa"</div>
        </div>
      `;
            return;
        }

        card.innerHTML = `
      <div class="card__header">
        <span class="card__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e4fc8" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Actas de Infracción
        </span>
        <span class="clr-text-light" style="font-size:13px">${formatNumber(multasTotal)} registros encontrados</span>
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
              <th>Importe (Bs.)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${result.data.map(m => `
              <tr>
                <td>
                  <span class="acta-number-badge">Nº ${m.numero_acta}</span>
                </td>
                <td>${formatDate(m.fecha)}</td>
                <td>
                  <div><strong>${m.nombres} ${m.apellidos}</strong></div>
                  <div class="clr-text-light" style="font-size:11px">${m.telefono || ''}</div>
                </td>
                <td class="font-mono">${m.cedula}</td>
                <td>
                  ${m.articulo_numero ? `<strong>Art. ${m.articulo_numero}</strong>${m.articulo_literal ? ` Lit. ${m.articulo_literal}` : ''}` : '<span class="clr-text-light">—</span>'}
                </td>
                <td class="font-mono">${m.importe_multa_bs ? formatCurrency(m.importe_multa_bs) : '—'}</td>
                <td>${statusBadge(m.estado)}</td>
                <td>
                  <div class="flex gap-8">
                    <button class="btn btn--gold btn--sm" onclick="verActa(${m.id})" title="Ver detalle">
                      ${Icons.eye}
                    </button>
                    <button class="btn btn--ghost btn--sm" onclick="editarMulta(${m.id})" title="Editar">
                      ${Icons.edit}
                    </button>
                    <button class="btn btn--ghost btn--sm" onclick="imprimirActa(${m.id})" title="Imprimir PDF">
                      ${Icons.pdf}
                    </button>
                    <button class="btn btn--danger btn--sm" onclick="eliminarMulta(${m.id})" title="Eliminar">
                      ${Icons.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${totalPages > 1 ? renderPagination(multasPage, totalPages, multasTotal) : ''}
    `;

        // Pagination events
        document.querySelectorAll('.pagination__btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                multasPage = parseInt(btn.dataset.page);
                loadMultasTable();
                document.getElementById('multas-card').scrollIntoView({ behavior: 'smooth' });
            });
        });

    } catch (err) {
        card.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">Error al cargar</div>
        <div class="empty-state__message">${err.message}</div>
        <button class="btn btn--primary mt-16" onclick="loadMultasTable()">Reintentar</button>
      </div>
    `;
        showToast('error', 'Error', err.message);
    }
}

function renderPagination(currentPage, totalPages, total) {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);

    return `
    <div class="pagination">
      <div class="pagination__info">
        Página ${currentPage} de ${totalPages} · ${formatNumber(total)} registros
      </div>
      <div class="pagination__controls">
        <button class="pagination__btn" data-page="1" ${currentPage === 1 ? 'disabled' : ''}>«</button>
        <button class="pagination__btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
        ${pages.map(p => `<button class="pagination__btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`).join('')}
        <button class="pagination__btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
        <button class="pagination__btn" data-page="${totalPages}" ${currentPage === totalPages ? 'disabled' : ''}>»</button>
      </div>
    </div>
  `;
}

async function verActa(id) {
    try {
        showLoading();
        const multa = await Api.multas.get(id);
        hideLoading();

        openModal(`
      <div class="modal__header">
        <span class="modal__title">Acta de Infracción Nº ${multa.numero_acta}</span>
        <button class="modal__close" onclick="closeModal()">×</button>
      </div>
      <div class="modal__body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <p class="form-label">Fecha y Hora</p>
            <p class="fw-600">${formatDate(multa.fecha)} ${multa.hora ? multa.hora.substring(0, 5) : ''} ${multa.turno || ''}</p>
          </div>
          <div>
            <p class="form-label">Estado</p>
            ${statusBadge(multa.estado)}
          </div>
        </div>

        <hr style="margin:16px 0;border:none;border-top:1px solid var(--clr-border)">
        
        <h4 style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--clr-navy);margin-bottom:12px;letter-spacing:1px">Infractor</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><p class="form-label">Nombres</p><p class="fw-600">${multa.nombres} ${multa.apellidos}</p></div>
          <div><p class="form-label">Cédula</p><p class="fw-600 font-mono">${multa.cedula}</p></div>
          <div><p class="form-label">Teléfono</p><p>${multa.telefono || '—'}</p></div>
          <div><p class="form-label">Dirección</p><p>${multa.direccion_infractor || '—'}</p></div>
        </div>

        ${multa.marca || multa.matricula ? `
          <hr style="margin:16px 0;border:none;border-top:1px solid var(--clr-border)">
          <h4 style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--clr-navy);margin-bottom:12px;letter-spacing:1px">Vehículo</h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
            <div><p class="form-label">Marca/Modelo</p><p class="fw-600">${[multa.marca, multa.modelo].filter(Boolean).join(' ')}</p></div>
            <div><p class="form-label">Año / Tipo</p><p>${[multa.anio, multa.tipo].filter(Boolean).join(' / ')}</p></div>
            <div><p class="form-label">Color / Matrícula</p><p>${[multa.color, multa.matricula].filter(Boolean).join(' / ')}</p></div>
          </div>
        ` : ''}

        <hr style="margin:16px 0;border:none;border-top:1px solid var(--clr-border)">
        <h4 style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--clr-navy);margin-bottom:12px;letter-spacing:1px">Fundamento Legal</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><p class="form-label">Artículo</p><p class="fw-600">Art. ${multa.articulo_numero || '—'}${multa.articulo_literal ? ' Lit. ' + multa.articulo_literal : ''}</p></div>
          <div><p class="form-label">Importe (Bs.)</p><p class="fw-600 font-mono">${multa.importe_multa_bs ? formatCurrency(multa.importe_multa_bs) : '—'}</p></div>
          <div style="grid-column:1/-1"><p class="form-label">Descripción</p><p>${multa.descripcion_infraccion || multa.articulo_descripcion || '—'}</p></div>
        </div>

        ${multa.funcionario ? `
          <hr style="margin:16px 0;border:none;border-top:1px solid var(--clr-border)">
          <div><p class="form-label">Funcionario</p><p class="fw-600">${multa.funcionario} (C.I.: ${multa.ci_funcionario || '—'})</p></div>
        ` : ''}
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost" onclick="closeModal()">Cerrar</button>
        <button class="btn btn--ghost" onclick="closeModal(); editarMulta(${multa.id})">${Icons.edit} Editar</button>
        <button class="btn btn--gold" onclick="generarActaPDF(${JSON.stringify(multa).replace(/"/g, '&quot;')})">${Icons.pdf} Imprimir PDF</button>
      </div>
    `, 'modal--lg');

    } catch (err) {
        hideLoading();
        showToast('error', 'Error', err.message);
    }
}

async function editarMulta(id) {
    try {
        showLoading();
        const multa = await Api.multas.get(id);
        hideLoading();
        renderNuevaMulta(multa);
    } catch (err) {
        hideLoading();
        showToast('error', 'Error', err.message);
    }
}

async function imprimirActa(id) {
    try {
        showLoading();
        const multa = await Api.multas.get(id);
        hideLoading();
        generarActaPDF(multa);
    } catch (err) {
        hideLoading();
        showToast('error', 'Error', err.message);
    }
}

function eliminarMulta(id) {
    confirmDialog(
        'Eliminar Acta',
        '¿Está seguro de eliminar esta acta? Esta acción no se puede deshacer.',
        async () => {
            try {
                await Api.multas.delete(id);
                showToast('success', 'Eliminada', 'Acta eliminada correctamente');
                loadMultasTable();
            } catch (err) {
                showToast('error', 'Error', err.message);
            }
        }
    );
}
