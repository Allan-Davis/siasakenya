// ===== CHARTS MODULE =====
const Charts = (() => {
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = '#1e2d45';
  Chart.defaults.font.family = "'Space Grotesk', sans-serif";

  const activeCharts = {};

  function destroy(id) {
    if (activeCharts[id]) { activeCharts[id].destroy(); delete activeCharts[id]; }
  }

  function bar(canvasId, labels, datasets, opts={}) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    activeCharts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: opts.legend ?? false },
          tooltip: { callbacks: { label: c => ' ' + Utils.fmt(c.raw) + (opts.suffix||'') } }
        },
        scales: {
          x: { grid: { color: '#1e2d45' }, ticks: { maxRotation: 45 } },
          y: { grid: { color: '#1e2d45' }, ticks: { callback: v => Utils.fmt(v) } }
        },
        ...opts
      }
    });
    return activeCharts[canvasId];
  }

  function horizontalBar(canvasId, labels, data, colors, opts={}) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    activeCharts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderRadius: 4, borderSkipped: false }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => ' ' + Utils.fmt(c.raw) + (opts.suffix||'') } }
        },
        scales: {
          x: { grid: { color: '#1e2d45' }, ticks: { callback: v => Utils.fmt(v) } },
          y: { grid: { display: false } }
        }
      }
    });
    return activeCharts[canvasId];
  }

  function doughnut(canvasId, labels, data, colors) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    activeCharts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#111827' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { padding: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: c => ` ${c.label}: ${Utils.fmt(c.raw)} (${Utils.pct(c.raw, c.dataset.data.reduce((a,b)=>a+b,0))}%)` } }
        }
      }
    });
    return activeCharts[canvasId];
  }

  function line(canvasId, labels, datasets, opts={}) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    activeCharts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: opts.legend ?? true } },
        scales: {
          x: { grid: { color: '#1e2d45' } },
          y: { grid: { color: '#1e2d45' }, ticks: { callback: v => Utils.fmt(v) } }
        },
        ...opts
      }
    });
    return activeCharts[canvasId];
  }

  function polar(canvasId, labels, data, colors) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    activeCharts[canvasId] = new Chart(ctx, {
      type: 'polarArea',
      data: { labels, datasets: [{ data, backgroundColor: colors.map(c => c + 'bb'), borderColor: colors, borderWidth: 1 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } }
      }
    });
    return activeCharts[canvasId];
  }

  function getChart(id) { return activeCharts[id]; }

  return { bar, horizontalBar, doughnut, line, polar, destroy, getChart };
})();
