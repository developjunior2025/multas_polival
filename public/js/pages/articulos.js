/* js/pages/articulos.js - CRUD de artículos de infracción */

async function renderArticulos() {
    setPageTitle('Artículos de Infracción');
    const content = document.getElementById('content');

    content.innerHTML = `
    <div class="page-header">
      <div class="page-header__info">
        <h1>Artículos de Infracción</h1>
        <p>Ordenanza sobre Convivencia Ciudadana del Municipio Los Guayos — Gaceta Municipal Nº 2084</p>
      </div>
      <button class="btn btn--primary" id="btn-nuevo-articulo">
        ${Icons.plus} Nuevo Artículo
      </button>
    </div>

    <div class="card mb-16">
      <div class="card__body">
        <div class="filters-bar">
          <div class="search-box">
            <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="art-search" placeholder="Buscar por número o descripción...">
          </div>
          <button class="btn btn--primary" id="btn-art-buscar">${Icons.search} Buscar</button>
          <button class="btn btn--ghost" id="btn-art-limpiar">Mostrar todos</button>
        </div>
      </div>
    </div>

    <div class="card" id="art-card">
      <div class="empty-state"><div class="spinner"></div></div>
    </div>
  `;

    document.getElementById('btn-nuevo-articulo')?.addEventListener('click', () => openArticuloForm());

    document.getElementById('btn-art-buscar')?.addEventListener('click', () => {
        loadArticulosTable(document.getElementById('art-search').value.trim());
    });

    document.getElementById('btn-art-limpiar')?.addEventListener('click', () => {
        document.getElementById('art-search').value = '';
        loadArticulosTable('');
    });

    document.getElementById('art-search')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loadArticulosTable(e.target.value.trim());
    });

    await loadArticulosTable('');
}

async function loadArticulosTable(search = '') {
    const card = document.getElementById('art-card');
    if (!card) return;

    card.innerHTML = `<div class="empty-state"><div class="spinner"></div></div>`;

    try {
        const params = search ? { search } : {};
        const articulos = await Api.articulos.list(params);

        if (!articulos || articulos.length === 0) {
            card.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          </svg>
          <div class="empty-state__title">No hay artículos registrados</div>
          <div class="empty-state__message">Agregue los artículos de la Ordenanza Municipal</div>
          <button class="btn btn--primary mt-16" onclick="openArticuloForm()">${Icons.plus} Agregar Artículo</button>
        </div>
      `;
            return;
        }

        card.innerHTML = `
      <div class="card__header">
        <span class="card__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e4fc8" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          </svg>
          Artículos Registrados
        </span>
        <span class="clr-text-light" style="font-size:13px">${articulos.length} artículos</span>
      </div>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Literal</th>
              <th>Descripción</th>
              <th>Valor UT</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${articulos.map(a => `
              <tr>
                <td><strong class="font-mono">Art. ${a.numero}</strong></td>
                <td>${a.literal || '—'}</td>
                <td style="max-width:400px">${a.descripcion}</td>
                <td class="font-mono">${a.valor_ut || '—'}</td>
                <td>
                  <span class="badge badge--${a.activo ? 'activo' : 'inactivo'}">
                    ${a.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </td>
                <td>
                  <div class="flex gap-8">
                    <button class="btn btn--ghost btn--sm" onclick="openArticuloForm(${a.id})" title="Editar">
                      ${Icons.edit}
                    </button>
                    <button class="btn btn--danger btn--sm" onclick="eliminarArticulo(${a.id}, '${a.numero}')" title="Eliminar">
                      ${Icons.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    } catch (err) {
        card.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error: ${err.message}</div></div>`;
    }
}

async function openArticuloForm(id = null) {
    let articulo = null;
    if (id) {
        try {
            showLoading();
            articulo = await Api.articulos.get(id);
            hideLoading();
        } catch (err) {
            hideLoading();
            showToast('error', 'Error', err.message);
            return;
        }
    }

    const isEdit = !!articulo;
    const a = articulo || {};

    openModal(`
    <div class="modal__header">
      <span class="modal__title">${isEdit ? 'Editar Artículo' : 'Nuevo Artículo'}</span>
      <button class="modal__close" onclick="closeModal()">×</button>
    </div>
    <div class="modal__body">
      <div class="alert alert--info">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Artículos de la Ordenanza sobre Convivencia Ciudadana del Municipio Los Guayos (Gaceta Nº 2084)
      </div>

      <form id="form-articulo">
        <div class="form-grid form-grid--2 mb-16">
          <div class="form-group">
            <label class="form-label">Número de Artículo <span class="required">*</span></label>
            <input type="text" class="form-control" id="art-numero" name="numero" 
              value="${a.numero || ''}" required placeholder="Ej: 45, 12-A">
          </div>
          <div class="form-group">
            <label class="form-label">Literal</label>
            <input type="text" class="form-control" id="art-literal" name="literal"
              value="${a.literal || ''}" placeholder="Ej: A, B, C...">
          </div>
        </div>

        <div class="form-group mb-16">
          <label class="form-label">Descripción de la Infracción <span class="required">*</span></label>
          <textarea class="form-control" id="art-descripcion" name="descripcion" rows="4" required
            placeholder="Descripción completa del artículo según la Ordenanza...">${a.descripcion || ''}</textarea>
        </div>

        <div class="form-grid form-grid--2">
          <div class="form-group">
            <label class="form-label">Valor en UT</label>
            <input type="number" class="form-control" id="art-valor-ut" name="valor_ut"
              value="${a.valor_ut || ''}" placeholder="0.00" step="0.01" min="0">
            <span class="form-hint">Unidades Tributarias correspondientes a esta infracción</span>
          </div>
          ${isEdit ? `
            <div class="form-group">
              <label class="form-label">Estado</label>
              <select class="form-control" id="art-activo" name="activo">
                <option value="true" ${a.activo ? 'selected' : ''}>Activo</option>
                <option value="false" ${!a.activo ? 'selected' : ''}>Inactivo</option>
              </select>
            </div>
          ` : ''}
        </div>
      </form>
    </div>
    <div class="modal__footer">
      <button class="btn btn--ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn--primary" id="btn-save-art">
        ${isEdit ? 'Guardar Cambios' : 'Registrar Artículo'}
      </button>
    </div>
  `, 'modal--sm');

    document.getElementById('btn-save-art')?.addEventListener('click', async () => {
        const form = document.getElementById('form-articulo');
        const numero = document.getElementById('art-numero').value.trim();
        const descripcion = document.getElementById('art-descripcion').value.trim();

        if (!numero || !descripcion) {
            showToast('warning', 'Campos requeridos', 'Complete el número de artículo y su descripción');
            return;
        }

        const data = {
            numero,
            literal: document.getElementById('art-literal').value.trim(),
            descripcion,
            valor_ut: document.getElementById('art-valor-ut').value || 0,
        };

        if (isEdit) {
            data.id = id;
            data.activo = document.getElementById('art-activo').value === 'true';
        }

        const btn = document.getElementById('btn-save-art');
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        try {
            if (isEdit) {
                await Api.articulos.update(data);
                showToast('success', 'Actualizado', `Artículo ${numero} actualizado correctamente`);
            } else {
                await Api.articulos.create(data);
                showToast('success', 'Registrado', `Artículo ${numero} registrado correctamente`);
            }
            closeModal();
            loadArticulosTable('');
        } catch (err) {
            showToast('error', 'Error al guardar', err.message);
            btn.disabled = false;
            btn.textContent = isEdit ? 'Guardar Cambios' : 'Registrar Artículo';
        }
    });
}

function eliminarArticulo(id, numero) {
    confirmDialog(
        `Eliminar Artículo ${numero}`,
        `¿Está seguro de eliminar el Artículo ${numero}? Si tiene multas asociadas, será desactivado.`,
        async () => {
            try {
                const result = await Api.articulos.delete(id);
                showToast('success', 'Artículo eliminado', result.message || 'Operación completada');
                loadArticulosTable('');
            } catch (err) {
                showToast('error', 'Error', err.message);
            }
        }
    );
}
