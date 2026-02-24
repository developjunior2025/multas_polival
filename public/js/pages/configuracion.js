/* js/pages/configuracion.js */

async function renderConfiguracion() {
  setPageTitle('Configuración del Sistema');
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="page-header">
      <div class="page-header__info">
        <h1>Configuración del Sistema</h1>
        <p>Parámetros del Instituto Autónomo de Policía del Municipio Los Guayos</p>
      </div>
    </div>
    <div class="empty-state"><div class="spinner"></div></div>
  `;

  try {
    const config = await Api.configuracion.get();

    content.innerHTML = `
      <div class="page-header">
        <div class="page-header__info">
          <h1>Configuración del Sistema</h1>
          <p>Parámetros del Instituto Autónomo de Policía del Municipio Los Guayos</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">

        <!-- Logo Institucional -->
        <div class="card" style="grid-column: 1 / -1;">
          <div class="card__header">
            <span class="card__title">
              <div class="card__title-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e4fc8" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              Logo Institucional
            </span>
          </div>
          <div class="card__body">
            <div style="display:flex;gap:32px;align-items:flex-start;flex-wrap:wrap;">
              <!-- Preview -->
              <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
                <div id="logo-preview-container" style="
                  width:120px;height:120px;
                  border:2px dashed var(--clr-border);
                  border-radius:12px;
                  display:flex;align-items:center;justify-content:center;
                  background:var(--clr-surface-2);
                  overflow:hidden;
                  position:relative;
                ">
                  ${config.logo_base64
        ? `<img src="${config.logo_base64}" alt="Logo actual" id="logo-preview-img" style="width:100%;height:100%;object-fit:contain;padding:8px;">`
        : `<div id="logo-preview-placeholder" style="text-align:center;color:var(--clr-text-light);padding:12px;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <p style="font-size:11px;margin-top:6px;">Sin logo</p>
                      </div>`
      }
                </div>
                <span style="font-size:11px;color:var(--clr-text-light);text-align:center;">Logo actual<br>en sidebar</span>
              </div>

              <!-- Upload controls -->
              <div style="flex:1;min-width:240px;">
                <p style="font-size:13px;color:var(--clr-text-mid);margin-bottom:16px;">
                  Suba el logo oficial de la policía. Se mostrará en el panel lateral del sistema y en los documentos PDF generados.
                  Formatos admitidos: <strong>PNG, JPG, SVG, WebP</strong>. Tamaño máximo: <strong>2 MB</strong>.
                </p>

                <div class="logo-dropzone" id="logo-dropzone">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--clr-blue)" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p style="margin:8px 0 4px;font-weight:600;color:var(--clr-text);">Arrastre el logo aquí</p>
                  <p style="font-size:12px;color:var(--clr-text-light);">o haga clic para seleccionar</p>
                  <input type="file" id="logo-file-input" accept="image/*" style="display:none">
                </div>

                <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;">
                  <button class="btn btn--primary" id="btn-upload-logo" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Guardar Logo
                  </button>
                  ${config.logo_base64 ? `
                  <button class="btn btn--danger" id="btn-remove-logo">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    </svg>
                    Eliminar Logo
                  </button>` : ''}
                </div>
                <p class="form-hint mt-8" id="logo-file-name">Ningún archivo seleccionado</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Valores Monetarios -->
        <div class="card">
          <div class="card__header">
            <span class="card__title">
              <div class="card__title-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e4fc8" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              Valores Monetarios
            </span>
          </div>
          <div class="card__body">
            <div class="form-group mb-16">
              <label class="form-label">Valor de la UT (Unidad Tributaria) en Bs.</label>
              <input type="number" class="form-control" id="cfg-ut" 
                value="${config.valor_ut || '0.02'}" step="0.01" min="0">
              <span class="form-hint">Valor actual de la Unidad Tributaria en Bolívares</span>
            </div>
            <div class="form-group mb-16">
              <label class="form-label">Valor TCMMV (Tipo de Cambio Mercado Monetario)</label>
              <input type="number" class="form-control" id="cfg-tcmmv" 
                value="${config.valor_tcmmv || '1.00'}" step="0.01" min="0">
              <span class="form-hint">Tasa de cambio en USD para cálculo de multas</span>
            </div>
            <button class="btn btn--primary" id="btn-save-cfg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
              </svg>
              Guardar Configuración
            </button>
          </div>
        </div>

        <!-- Seguridad / Credenciales -->
        <div class="card">
          <div class="card__header">
            <span class="card__title">
              <div class="card__title-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e4fc8" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              Seguridad del Sistema
            </span>
          </div>
          <div class="card__body">
            <div class="alert alert--warning mb-16" style="margin-bottom:16px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Cambie las credenciales por defecto (admin / admin123) por seguridad.
            </div>
            <div class="form-group mb-16">
              <label class="form-label">Nuevo usuario</label>
              <input type="text" class="form-control" id="cfg-new-username" 
                placeholder="Nuevo nombre de usuario" autocomplete="off">
            </div>
            <div class="form-group mb-16">
              <label class="form-label">Nueva contraseña</label>
              <input type="password" class="form-control" id="cfg-new-password" 
                placeholder="Nueva contraseña (mín. 6 caracteres)" autocomplete="new-password">
            </div>
            <div class="form-group mb-16">
              <label class="form-label">Confirmar contraseña</label>
              <input type="password" class="form-control" id="cfg-confirm-password" 
                placeholder="Repetir contraseña" autocomplete="new-password">
            </div>
            <button class="btn btn--primary" id="btn-save-credentials">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Actualizar Credenciales
            </button>
          </div>
        </div>

        <!-- Información del Instituto -->
        <div class="card">
          <div class="card__header">
            <span class="card__title">
              <div class="card__title-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e4fc8" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              Información Institucional
            </span>
          </div>
          <div class="card__body">
            <div style="display:flex;flex-direction:column;gap:12px">
              ${[
        ['Institución', 'Instituto Autónomo de Policía del Municipio Los Guayos'],
        ['RIF', 'G-20009676-4'],
        ['Estado', 'Carabobo, Venezuela'],
        ['Teléfono', '0412 6710163'],
        ['Banco', 'Banco de Venezuela (0102)'],
        ['Página', 'Pago Móvil / Transferencia'],
        ['Titular', 'IAPMLG'],
        ['Cuenta Corriente', '0102-0358-91-00-01262119'],
        ['Ordenanza', 'Gaceta Municipal Nº 2084'],
      ].map(([label, value]) => `
                <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--clr-border)">
                  <span style="font-size:12px;font-weight:600;color:var(--clr-text-light);min-width:120px">${label}</span>
                  <span style="font-size:13px;font-weight:500;text-align:right">${value}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Database Status -->
        <div class="card">
          <div class="card__header">
            <span class="card__title">
              <div class="card__title-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e4fc8" stroke-width="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
              </div>
              Base de Datos NeonDB
            </span>
          </div>
          <div class="card__body">
            <div class="alert alert--info mb-16">
              La base de datos PostgreSQL está alojada en NeonDB con conexión serverless para despliegue en Netlify.
            </div>
            <button class="btn btn--ghost" id="btn-init-db">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
              </svg>
              Inicializar / Verificar Base de Datos
            </button>
            <p class="form-hint mt-8">Ejecute esto la primera vez para crear las tablas necesarias</p>
          </div>
        </div>

        <!-- Numeral -->
        <div class="card">
          <div class="card__header">
            <span class="card__title">
              <div class="card__title-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e4fc8" stroke-width="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              Control de Numeración
            </span>
          </div>
          <div class="card__body">
            <div class="form-group mb-16">
              <label class="form-label">Último número de acta</label>
              <input type="number" class="form-control" id="cfg-ultimo-acta" 
                value="${config.ultimo_numero_acta || '0'}" min="0">
              <span class="form-hint">La próxima acta será: <strong>${String(parseInt(config.ultimo_numero_acta || '0') + 1).padStart(6, '0')}</strong></span>
            </div>
            <button class="btn btn--ghost" id="btn-save-numeracion">
              Actualizar Numeración
            </button>
          </div>
        </div>
      </div>
    `;

    // ==================== LOGO HANDLERS ====================
    setupLogoHandlers();

    // ==================== CFG SAVE ====================
    document.getElementById('btn-save-cfg')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-save-cfg');
      btn.disabled = true;
      btn.textContent = 'Guardando...';
      try {
        await Api.configuracion.update({
          valor_ut: document.getElementById('cfg-ut').value,
          valor_tcmmv: document.getElementById('cfg-tcmmv').value,
        });
        showToast('success', 'Configuración guardada', 'Los valores han sido actualizados');
      } catch (err) {
        showToast('error', 'Error', err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/></svg> Guardar Configuración`;
      }
    });

    // ==================== CREDENTIALS SAVE ====================
    document.getElementById('btn-save-credentials')?.addEventListener('click', async () => {
      const newUsername = document.getElementById('cfg-new-username').value.trim();
      const newPassword = document.getElementById('cfg-new-password').value;
      const confirmPw = document.getElementById('cfg-confirm-password').value;

      if (!newUsername && !newPassword) {
        showToast('warning', 'Sin cambios', 'Ingrese el nuevo usuario y/o contraseña');
        return;
      }

      if (newPassword && newPassword.length < 6) {
        showToast('error', 'Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (newPassword && newPassword !== confirmPw) {
        showToast('error', 'Contraseñas no coinciden', 'Las contraseñas ingresadas no son iguales');
        document.getElementById('cfg-confirm-password').focus();
        return;
      }

      const btn = document.getElementById('btn-save-credentials');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      try {
        const token = Auth.getToken();
        await Api.auth.changeCredentials(token, newUsername || undefined, newPassword || undefined);
        showToast('success', 'Credenciales actualizadas', 'Las nuevas credenciales han sido guardadas. Por favor inicie sesión nuevamente.');
        // Update stored username if changed
        if (newUsername) {
          localStorage.setItem('iapmlg_auth_user', newUsername);
          document.getElementById('sidebar-username').textContent = newUsername;
        }
        document.getElementById('cfg-new-username').value = '';
        document.getElementById('cfg-new-password').value = '';
        document.getElementById('cfg-confirm-password').value = '';
      } catch (err) {
        showToast('error', 'Error', err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Actualizar Credenciales`;
      }
    });

    // ==================== DB INIT ====================
    document.getElementById('btn-init-db')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-init-db');
      btn.disabled = true;
      btn.textContent = 'Inicializando...';
      try {
        const result = await Api.initDb();
        showToast('success', 'Base de datos OK', result.message);
      } catch (err) {
        showToast('error', 'Error', err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Inicializar / Verificar Base de Datos';
      }
    });

    // ==================== NUMERACION SAVE ====================
    document.getElementById('btn-save-numeracion')?.addEventListener('click', async () => {
      const val = document.getElementById('cfg-ultimo-acta').value;
      try {
        await Api.configuracion.update({ ultimo_numero_acta: val });
        showToast('success', 'Numeración actualizada', `Próxima acta: ${String(parseInt(val) + 1).padStart(6, '0')}`);
        renderConfiguracion();
      } catch (err) {
        showToast('error', 'Error', err.message);
      }
    });

  } catch (err) {
    showToast('error', 'Error al cargar', err.message);
  }
}

// ==================== LOGO SETUP ====================
function setupLogoHandlers() {
  const dropzone = document.getElementById('logo-dropzone');
  const fileInput = document.getElementById('logo-file-input');
  const uploadBtn = document.getElementById('btn-upload-logo');
  const removeBtn = document.getElementById('btn-remove-logo');
  const fileNameEl = document.getElementById('logo-file-name');
  let selectedBase64 = null;

  // Click dropzone → trigger file input
  dropzone?.addEventListener('click', () => fileInput?.click());

  // Drag & drop
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoFile(file);
  });

  // File input change
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleLogoFile(file);
  });

  function handleLogoFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Archivo inválido', 'Solo se aceptan imágenes (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Archivo muy grande', 'El logo no debe superar 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      selectedBase64 = e.target.result;
      // Update preview
      const container = document.getElementById('logo-preview-container');
      if (container) {
        container.innerHTML = `<img src="${selectedBase64}" alt="Logo seleccionado" 
                    style="width:100%;height:100%;object-fit:contain;padding:8px;">`;
      }
      if (uploadBtn) uploadBtn.disabled = false;
      if (fileNameEl) fileNameEl.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    };
    reader.readAsDataURL(file);
  }

  // Upload (save to DB)
  uploadBtn?.addEventListener('click', async () => {
    if (!selectedBase64) return;
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Guardando...';
    try {
      await Api.configuracion.update({ logo_base64: selectedBase64 });
      showToast('success', 'Logo guardado', 'El logo ha sido actualizado correctamente');
      // Update sidebar logo
      if (typeof updateSidebarLogo === 'function') updateSidebarLogo(selectedBase64);
      // Reset
      selectedBase64 = null;
      if (fileNameEl) fileNameEl.textContent = 'Logo guardado correctamente';
      // Reload to show remove button
      setTimeout(() => renderConfiguracion(), 1500);
    } catch (err) {
      showToast('error', 'Error al guardar', err.message);
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
            </svg> Guardar Logo`;
    }
  });

  // Remove logo
  removeBtn?.addEventListener('click', async () => {
    confirmDialog(
      'Eliminar Logo',
      '¿Está seguro que desea eliminar el logo institucional?',
      async () => {
        try {
          await Api.configuracion.update({ logo_base64: '' });
          showToast('success', 'Logo eliminado', 'El logo ha sido removido del sistema');
          // Reset sidebar to SVG shield
          const shieldEl = document.getElementById('sidebar-shield');
          if (shieldEl) {
            shieldEl.innerHTML = `<svg viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M30 2 L58 14 L58 36 C58 52 44 64 30 70 C16 64 2 52 2 36 L2 14 Z" fill="#1a3a6b" stroke="#c9a84c" stroke-width="2"/>
                            <path d="M30 8 L52 18 L52 36 C52 49 40 60 30 66 C20 60 8 49 8 36 L8 18 Z" fill="#1e4080"/>
                            <text x="30" y="42" text-anchor="middle" fill="#c9a84c" font-size="10" font-weight="bold" font-family="Arial">POLICÍA</text>
                        </svg>`;
          }
          renderConfiguracion();
        } catch (err) {
          showToast('error', 'Error', err.message);
        }
      }
    );
  });
}
