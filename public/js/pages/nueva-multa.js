/* js/pages/nueva-multa.js */

let articulosCache = [];

async function renderNuevaMulta(multaEditable = null) {
    const isEdit = !!multaEditable;
    setPageTitle(isEdit ? 'Editar Acta de Infracción' : 'Nueva Acta de Infracción');
    const content = document.getElementById('content');

    // Load articulos for select
    try {
        articulosCache = await Api.articulos.list();
    } catch (e) {
        articulosCache = [];
    }

    // Load configuracion
    let config = {};
    try { config = await Api.configuracion.get(); } catch (e) { }

    const m = multaEditable || {};

    content.innerHTML = `
    <div class="page-header">
      <div class="page-header__info">
        <h1>${isEdit ? 'Editar Acta' : 'Nueva Acta de Infracción'}</h1>
        <p>${isEdit ? `Modificando acta Nº ${m.numero_acta}` : 'Registro de nueva infracción a la Ordenanza'}</p>
      </div>
      <div class="flex gap-8">
        <button class="btn btn--ghost" onclick="navigateTo('multas')">← Cancelar</button>
        ${isEdit ? `<button class="btn btn--gold" id="btn-pdf-edit">${Icons.pdf} Imprimir PDF</button>` : ''}
      </div>
    </div>

    <form id="form-multa" autocomplete="off">
      <!-- General info -->
      <div class="form-section">
        <div class="form-section__title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Información del Acta
        </div>
        <div class="form-grid form-grid--4">
          <div class="form-group">
            <label class="form-label">Fecha <span class="required">*</span></label>
            <input type="date" class="form-control" id="f-fecha" name="fecha" 
              value="${m.fecha || todayStr()}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Hora</label>
            <input type="time" class="form-control" id="f-hora" name="hora" 
              value="${m.hora ? m.hora.substring(0, 5) : currentTimeStr()}">
          </div>
          <div class="form-group">
            <label class="form-label">Turno</label>
            <select class="form-control" id="f-turno" name="turno">
              <option value="AM" ${(m.turno || 'AM') === 'AM' ? 'selected' : ''}>AM</option>
              <option value="PM" ${m.turno === 'PM' ? 'selected' : ''}>PM</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select class="form-control" id="f-estado" name="estado">
              <option value="PENDIENTE" ${(m.estado || 'PENDIENTE') === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
              <option value="PAGADO" ${m.estado === 'PAGADO' ? 'selected' : ''}>PAGADO</option>
              <option value="ANULADO" ${m.estado === 'ANULADO' ? 'selected' : ''}>ANULADO</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Lugar de la Infracción -->
      <div class="form-section">
        <div class="form-section__title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          Lugar de la Infracción
        </div>
        <div class="form-group">
          <label class="form-label">Dirección <span class="required">*</span></label>
          <textarea class="form-control" id="f-dir-infraccion" name="direccion_infraccion" 
            rows="2" required placeholder="Dirección donde ocurrió la infracción...">${m.direccion_infraccion || ''}</textarea>
        </div>
      </div>

      <!-- Datos del Infractor -->
      <div class="form-section">
        <div class="form-section__title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          Datos del Infractor
        </div>
        <div class="form-grid form-grid--2">
          <div class="form-group">
            <label class="form-label">Nombres <span class="required">*</span></label>
            <input type="text" class="form-control" id="f-nombres" name="nombres" 
              value="${m.nombres || ''}" required placeholder="Nombres del ciudadano">
          </div>
          <div class="form-group">
            <label class="form-label">Cédula <span class="required">*</span></label>
            <input type="text" class="form-control" id="f-cedula" name="cedula" 
              value="${m.cedula || ''}" required placeholder="V-00.000.000">
          </div>
          <div class="form-group">
            <label class="form-label">Apellidos <span class="required">*</span></label>
            <input type="text" class="form-control" id="f-apellidos" name="apellidos" 
              value="${m.apellidos || ''}" required placeholder="Apellidos del ciudadano">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="tel" class="form-control" id="f-telefono" name="telefono" 
              value="${m.telefono || ''}" placeholder="0414-0000000">
          </div>
        </div>
        <div class="form-group mt-16">
          <label class="form-label">Dirección del Infractor</label>
          <input type="text" class="form-control" id="f-dir-infractor" name="direccion_infractor"
            value="${m.direccion_infractor || ''}" placeholder="Domicilio del ciudadano">
        </div>
      </div>

      <!-- Datos del Vehículo -->
      <div class="form-section">
        <div class="form-section__title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          Datos del Vehículo
        </div>
        <div class="form-grid form-grid--3">
          <div class="form-group">
            <label class="form-label">Marca</label>
            <input type="text" class="form-control" id="f-marca" name="marca" 
              value="${m.marca || ''}" placeholder="Toyota, Ford...">
          </div>
          <div class="form-group">
            <label class="form-label">Modelo</label>
            <input type="text" class="form-control" id="f-modelo" name="modelo" 
              value="${m.modelo || ''}" placeholder="Corolla, Mustang...">
          </div>
          <div class="form-group">
            <label class="form-label">Año</label>
            <input type="text" class="form-control" id="f-anio" name="anio" 
              value="${m.anio || ''}" placeholder="2020" maxlength="4">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-control" id="f-tipo" name="tipo">
              <option value="">— Seleccione —</option>
              ${['Sedan', 'Pick-Up', 'SUV', 'Coupe', 'Hatchback', 'Camioneta', 'Moto', 'Camión', 'Autobús', 'Otro']
            .map(t => `<option value="${t}" ${m.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <input type="text" class="form-control" id="f-color" name="color" 
              value="${m.color || ''}" placeholder="Blanco, Negro...">
          </div>
          <div class="form-group">
            <label class="form-label">Matrícula</label>
            <input type="text" class="form-control" id="f-matricula" name="matricula" 
              value="${m.matricula || ''}" placeholder="ABC123" style="text-transform:uppercase">
          </div>
        </div>
      </div>

      <!-- Fundamento Legal -->
      <div class="form-section">
        <div class="form-section__title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          </svg>
          Fundamento Legal
        </div>
        <div class="form-grid form-grid--2">
          <div class="form-group">
            <label class="form-label">Artículo</label>
            <select class="form-control" id="f-articulo-id" name="articulo_id">
              <option value="">— Seleccionar artículo —</option>
              ${articulosCache.map(a => `
                <option value="${a.id}" data-numero="${a.numero}" data-literal="${a.literal || ''}" 
                  data-desc="${a.descripcion}" data-ut="${a.valor_ut}"
                  ${m.articulo_id == a.id ? 'selected' : ''}>
                  Art. ${a.numero}${a.literal ? ' Lit. ' + a.literal : ''} - ${a.descripcion.substring(0, 50)}${a.descripcion.length > 50 ? '...' : ''}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Art. Número / Literal</label>
            <div class="flex gap-8">
              <input type="text" class="form-control" id="f-art-numero" name="articulo_numero" 
                value="${m.articulo_numero || ''}" placeholder="Art. N°" style="width:100px;flex-shrink:0">
              <input type="text" class="form-control" id="f-art-literal" name="articulo_literal" 
                value="${m.articulo_literal || ''}" placeholder="Literal">
            </div>
          </div>
        </div>
        <div class="form-group mt-16">
          <label class="form-label">Descripción de la Infracción</label>
          <textarea class="form-control" id="f-descripcion" name="descripcion_infraccion" 
            rows="3" placeholder="Descripción detallada de la infracción cometida...">${m.descripcion_infraccion || ''}</textarea>
        </div>
      </div>

      <!-- Valores Monetarios -->
      <div class="form-section">
        <div class="form-section__title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
          Valores Monetarios
        </div>
        <div class="form-grid form-grid--3">
          <div class="form-group">
            <label class="form-label">Valor UT (activo)</label>
            <input type="number" class="form-control" id="f-ut" name="valor_ut" 
              value="${m.valor_ut || config.valor_ut || ''}" placeholder="0.00" step="0.01">
          </div>
          <div class="form-group">
            <label class="form-label">Valor TCMMV (USD)</label>
            <input type="number" class="form-control" id="f-tcmmv" name="valor_tcmmv" 
              value="${m.valor_tcmmv || config.valor_tcmmv || ''}" placeholder="0.00" step="0.01">
          </div>
          <div class="form-group">
            <label class="form-label">Importe Multa (Bs.)</label>
            <input type="number" class="form-control" id="f-importe" name="importe_multa_bs" 
              value="${m.importe_multa_bs || ''}" placeholder="0.00" step="0.01">
          </div>
        </div>
      </div>

      <!-- Funcionario -->
      <div class="form-section">
        <div class="form-section__title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Funcionario Actuante
        </div>
        <div class="form-grid form-grid--2">
          <div class="form-group">
            <label class="form-label">Nombre del Funcionario</label>
            <input type="text" class="form-control" id="f-funcionario" name="funcionario"
              value="${m.funcionario || ''}" placeholder="Nombre completo del funcionario">
          </div>
          <div class="form-group">
            <label class="form-label">Cédula del Funcionario</label>
            <input type="text" class="form-control" id="f-ci-funcionario" name="ci_funcionario"
              value="${m.ci_funcionario || ''}" placeholder="V-00.000.000">
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-12" style="justify-content: flex-end; margin-top: 8px;">
        <button type="button" class="btn btn--ghost" onclick="navigateTo('multas')">Cancelar</button>
        ${isEdit ? `
          <button type="button" class="btn btn--gold" id="btn-pdf-form">${Icons.pdf} Imprimir Acta</button>
        ` : ''}
        <button type="submit" class="btn btn--primary" id="btn-save">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
          </svg>
          ${isEdit ? 'Guardar Cambios' : 'Registrar Multa'}
        </button>
      </div>
    </form>
  `;

    // Article select handler
    document.getElementById('f-articulo-id')?.addEventListener('change', function () {
        const opt = this.options[this.selectedIndex];
        if (opt.value) {
            document.getElementById('f-art-numero').value = opt.dataset.numero || '';
            document.getElementById('f-art-literal').value = opt.dataset.literal || '';
            document.getElementById('f-descripcion').value = opt.dataset.desc || '';
            if (opt.dataset.ut) document.getElementById('f-ut').value = opt.dataset.ut;
        }
    });

    // Uppercase matricula
    document.getElementById('f-matricula')?.addEventListener('input', function () {
        this.value = this.value.toUpperCase();
    });

    // PDF buttons
    if (isEdit) {
        const pdfBtns = ['btn-pdf-edit', 'btn-pdf-form'];
        pdfBtns.forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => generarActaPDF(multaEditable));
        });
    }

    // Form submit
    document.getElementById('form-multa')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitMultaForm(isEdit, m.id);
    });
}

async function submitMultaForm(isEdit, multaId) {
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Guardando...';

    try {
        const data = {
            fecha: document.getElementById('f-fecha').value,
            hora: document.getElementById('f-hora').value,
            turno: document.getElementById('f-turno').value,
            direccion_infraccion: document.getElementById('f-dir-infraccion').value,
            nombres: document.getElementById('f-nombres').value.trim(),
            apellidos: document.getElementById('f-apellidos').value.trim(),
            cedula: document.getElementById('f-cedula').value.trim(),
            telefono: document.getElementById('f-telefono').value.trim(),
            direccion_infractor: document.getElementById('f-dir-infractor').value.trim(),
            marca: document.getElementById('f-marca').value.trim(),
            modelo: document.getElementById('f-modelo').value.trim(),
            anio: document.getElementById('f-anio').value.trim(),
            tipo: document.getElementById('f-tipo').value,
            color: document.getElementById('f-color').value.trim(),
            matricula: document.getElementById('f-matricula').value.trim(),
            articulo_id: document.getElementById('f-articulo-id').value || null,
            articulo_numero: document.getElementById('f-art-numero').value.trim(),
            articulo_literal: document.getElementById('f-art-literal').value.trim(),
            descripcion_infraccion: document.getElementById('f-descripcion').value.trim(),
            valor_ut: document.getElementById('f-ut').value || null,
            valor_tcmmv: document.getElementById('f-tcmmv').value || null,
            importe_multa_bs: document.getElementById('f-importe').value || null,
            funcionario: document.getElementById('f-funcionario').value.trim(),
            ci_funcionario: document.getElementById('f-ci-funcionario').value.trim(),
            estado: document.getElementById('f-estado').value,
        };

        let result;
        if (isEdit) {
            result = await Api.multas.update({ ...data, id: multaId });
            showToast('success', 'Acta actualizada', `Nº ${result.numero_acta} guardada correctamente`);
        } else {
            result = await Api.multas.create(data);
            showToast('success', 'Multa registrada', `Acta Nº ${result.numero_acta} creada exitosamente`);

            // Ask to print
            if (confirm(`¿Desea imprimir el Acta Nº ${result.numero_acta}?`)) {
                generarActaPDF(result);
            }
        }

        navigateTo('multas');
    } catch (err) {
        showToast('error', 'Error al guardar', err.message);
        btn.disabled = false;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/></svg> ${isEdit ? 'Guardar Cambios' : 'Registrar Multa'}`;
    }
}
