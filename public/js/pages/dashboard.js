/* js/pages/dashboard.js */

async function renderDashboard() {
  setPageTitle('Dashboard');
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="page-header">
      <div class="page-header__info">
        <h1>Panel de Control</h1>
        <p>Resumen general del sistema de multas</p>
      </div>
      <button class="btn btn--ghost" id="dash-refresh">
        ${Icons.refresh} Actualizar
      </button>
    </div>
    
    <div class="stats-grid" id="stats-grid">
      ${[1, 2, 3, 4].map(() => `
        <div class="stat-card" style="opacity:0.5">
          <div class="stat-card__accent"></div>
          <div class="stat-card__label">Cargando...</div>
          <div class="stat-card__value">—</div>
        </div>
      `).join('')}
    </div>

    <div class="charts-grid">
      <div class="card">
        <div class="card__header">
          <span class="card__title">
            <div class="card__title-icon">${Icons.chart}</div>
            Evolución Mensual de Multas
          </span>
        </div>
        <div class="card__body">
          <div class="chart-container">
            <canvas id="chart-monthly"></canvas>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card__header">
          <span class="card__title">
            <div class="card__title-icon">${Icons.chart}</div>
            Multas por Estado
          </span>
        </div>
        <div class="card__body">
          <div class="chart-container">
            <canvas id="chart-estado"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-24">
      <div class="card">
        <div class="card__header">
          <span class="card__title">
            <div class="card__title-icon">${Icons.chart}</div>
            Top Infractores
          </span>
          <button class="btn btn--ghost btn--sm" onclick="navigateTo('historico')">Ver todos →</button>
        </div>
        <div id="top-infractores-table">
          <div class="empty-state"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('dash-refresh')?.addEventListener('click', renderDashboard);

  await loadDashboardData();
}

async function loadDashboardData() {
  try {
    const [resumen, mensual, infractores] = await Promise.all([
      Api.estadisticas.resumen(),
      Api.estadisticas.evolucionMensual(),
      Api.estadisticas.porInfractor(),
    ]);

    renderStatsGrid(resumen);
    renderChartMonthly(mensual);
    renderChartEstado(resumen.porEstado || []);
    renderTopInfractores(infractores);
  } catch (err) {
    console.error(err);
    // If Chart is not available yet, retry once after a delay
    if (err.message && err.message.includes('Chart')) {
      showToast('warning', 'Cargando gráficos...', 'Reintentando en 2 segundos');
      setTimeout(loadDashboardData, 2000);
    } else {
      showToast('error', 'Error', 'No se pudo cargar el dashboard: ' + err.message);
    }
  }
}

function renderStatsGrid(resumen) {
  const statsEl = document.getElementById('stats-grid');
  if (!statsEl) return;

  statsEl.innerHTML = `
    <div class="stat-card stat-card--blue">
      <div class="stat-card__accent"></div>
      <div class="stat-card__label">Total Multas</div>
      <div class="stat-card__value">${formatNumber(resumen.total || 0)}</div>
      <div class="stat-card__sub">Actas registradas</div>
      <div class="stat-card__icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
    </div>

    <div class="stat-card stat-card--gold">
      <div class="stat-card__accent"></div>
      <div class="stat-card__label">Este Mes</div>
      <div class="stat-card__value">${formatNumber(resumen.mes || 0)}</div>
      <div class="stat-card__sub">Multas del mes actual</div>
      <div class="stat-card__icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
    </div>

    <div class="stat-card stat-card--green">
      <div class="stat-card__accent"></div>
      <div class="stat-card__label">Hoy</div>
      <div class="stat-card__value">${formatNumber(resumen.hoy || 0)}</div>
      <div class="stat-card__sub">Multas del día</div>
      <div class="stat-card__icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
    </div>

    <div class="stat-card stat-card--red">
      <div class="stat-card__accent"></div>
      <div class="stat-card__label">Pendientes</div>
      <div class="stat-card__value">${formatNumber(
    (resumen.porEstado || []).find(s => s.estado === 'PENDIENTE')?.cantidad || 0
  )}</div>
      <div class="stat-card__sub">Sin pagar</div>
      <div class="stat-card__icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
    </div>
  `;
}

function renderChartMonthly(data) {
  const canvas = document.getElementById('chart-monthly');
  if (!canvas) return;

  // Safety check: Chart.js must be loaded
  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML = '<div class="empty-state"><p class="empty-state__message">Cargando librería de gráficos...</p></div>';
    return;
  }

  const labels = data.map(d => d.mes_nombre);
  const valores = data.map(d => parseInt(d.cantidad_multas));

  // Destroy existing chart instance if any
  const existingChart = Chart.getChart(canvas);
  if (existingChart) existingChart.destroy();

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Multas',
        data: valores,
        backgroundColor: 'rgba(30, 79, 200, 0.8)',
        borderColor: '#1e4fc8',
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y} multas`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { precision: 0, font: { size: 11 } }
        },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

function renderChartEstado(data) {
  const canvas = document.getElementById('chart-estado');
  if (!canvas) return;

  // Safety check: Chart.js must be loaded
  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML = '<div class="empty-state"><p class="empty-state__message">Cargando librería de gráficos...</p></div>';
    return;
  }

  if (!data || data.length === 0) {
    canvas.parentElement.innerHTML = '<div class="empty-state"><p class="empty-state__message">Sin datos</p></div>';
    return;
  }

  // Destroy existing chart instance if any
  const existingChart = Chart.getChart(canvas);
  if (existingChart) existingChart.destroy();

  const colorMap = {
    'PENDIENTE': '#d97706',
    'PAGADO': '#0f9b5a',
    'ANULADO': '#6b7280',
  };

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.estado),
      datasets: [{
        data: data.map(d => parseInt(d.cantidad)),
        backgroundColor: data.map(d => colorMap[d.estado] || '#94a3b8'),
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 12 }, padding: 16 }
        }
      },
      cutout: '65%'
    }
  });
}

function renderTopInfractores(data) {
  const el = document.getElementById('top-infractores-table');
  if (!el) return;

  if (!data || data.length === 0) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-state__title">Sin infractores registrados</div>
    </div>`;
    return;
  }

  el.innerHTML = `
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cédula</th>
            <th>Nombres y Apellidos</th>
            <th>Cantidad de Multas</th>
            <th>Última Multa</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.slice(0, 10).map((row, i) => `
            <tr>
              <td><strong>${i + 1}</strong></td>
              <td class="font-mono">${row.cedula}</td>
              <td><strong>${row.nombres} ${row.apellidos}</strong></td>
              <td>
                <span class="badge badge--${row.cantidad_multas >= 3 ? 'pendiente' : 'activo'}">
                  ${row.cantidad_multas} actas
                </span>
              </td>
              <td>${formatDate(row.ultima_multa)}</td>
              <td>
                <button class="btn btn--ghost btn--sm" 
                  onclick="navigateTo('historico'); setTimeout(() => { document.getElementById('hist-cedula').value = '${row.cedula}'; buscarHistorico(); }, 300)">
                  ${Icons.eye} Ver historial
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
