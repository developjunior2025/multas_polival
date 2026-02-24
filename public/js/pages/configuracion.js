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
