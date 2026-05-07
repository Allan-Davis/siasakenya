// ===== DASHBOARD PAGE =====
const Dashboard = (() => {
  let regionChart = null;

  async function render(container) {
    container.innerHTML = `
      <div class="hero">
        <div class="container">
          <div class="hero-label">Kenya Political Intelligence Platform</div>
          <h1 class="hero-title">KNOW YOUR<br><span>NUMBERS</span></h1>
          <p class="hero-sub">Real voter data from IEBC 2022 General Election. Simulate, analyze and strategize your political campaign at every level.</p>
          <div style="margin-top:1.5rem;display:flex;gap:0.75rem;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="App.navigate('simulator')">🎯 Start Simulation</button>
            <button class="btn btn-outline" onclick="App.navigate('search')">🔍 Search Voter Data</button>
            <button class="btn btn-ghost" onclick="App.navigate('polls')">📊 Create Poll</button>
          </div>
        </div>
      </div>
      <div class="container section">
        <div class="stats-row" id="dashStats">
          <div class="stat-card"><div class="stat-icon">🗳️</div><div class="stat-val">21.6M</div><div class="stat-label">Registered Voters</div><div class="stat-sub">2022 General Election</div></div>
          <div class="stat-card"><div class="stat-icon">🏛️</div><div class="stat-val">47</div><div class="stat-label">Counties</div><div class="stat-sub">+ Diaspora</div></div>
          <div class="stat-card"><div class="stat-icon">🏅</div><div class="stat-val">290</div><div class="stat-label">Constituencies</div><div class="stat-sub">Across Kenya</div></div>
          <div class="stat-card"><div class="stat-icon">🏘️</div><div class="stat-val">1,450</div><div class="stat-label">Wards</div><div class="stat-sub">MCA Level</div></div>
          <div class="stat-card"><div class="stat-icon">📍</div><div class="stat-val">45,234</div><div class="stat-label">Polling Stations</div><div class="stat-sub">Nationwide</div></div>
        </div>

        <div class="grid-2" style="gap:1.5rem;margin-top:0.5rem;">
          <div class="card">
            <div class="card-header">
              <span class="card-title">📊 Voters by Region</span>
              <button class="btn btn-sm btn-ghost" id="dlRegionChart">⬇ PNG</button>
            </div>
            <div class="card-body">
              <div class="chart-container" style="height:280px;"><canvas id="regionChart"></canvas></div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <span class="card-title">🗺️ Top Counties by Voters</span>
              <button class="btn btn-sm btn-ghost" id="dlCountyChart">⬇ PNG</button>
            </div>
            <div class="card-body">
              <div class="chart-container" style="height:280px;"><canvas id="countyTopChart"></canvas></div>
            </div>
          </div>
        </div>

        <div class="grid-2" style="gap:1.5rem;margin-top:1.5rem;">
          <div class="card">
            <div class="card-header"><span class="card-title">⚡ Quick Actions</span></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:0.75rem;">
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="App.navigate('simulator')">🎯 Simulate Presidential Race</button>
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="App.navigate('simulator')">🏛️ Governor Race Simulator</button>
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="App.navigate('polls')">📊 Create Public Poll</button>
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="App.navigate('advisor')">🤖 Ask AI Advisor</button>
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="App.navigate('search')">🔍 Find Polling Station Data</button>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">📈 Regional Breakdown</span></div>
            <div class="card-body table-wrap" id="regionTable">
              <div class="loader-ring" style="margin:2rem auto;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load and render data
    try {
      const regionStats = await Data.getRegionStats();
      const regions = Object.entries(regionStats).sort((a,b) => b[1].voters - a[1].voters);
      const labels = regions.map(r => r[0]);
      const values = regions.map(r => r[1].voters);
      const colors = Utils.colorPalette(labels.length);

      Charts.doughnut('regionChart', labels, values, colors);
      document.getElementById('dlRegionChart').onclick = () => {
        const c = Charts.getChart('regionChart');
        if (c) Utils.downloadCanvas(c.canvas, 'region_voters');
      };

      // Top 10 counties
      const counties = await Data.getCounties();
      const top10 = counties.sort((a,b) => b.voters - a.voters).slice(0,10);
      Charts.horizontalBar('countyTopChart',
        top10.map(c => Utils.titleCase(c.name)),
        top10.map(c => c.voters),
        Utils.colorPalette(10)
      );
      document.getElementById('dlCountyChart').onclick = () => {
        const c = Charts.getChart('countyTopChart');
        if (c) Utils.downloadCanvas(c.canvas, 'top_counties_voters');
      };

      // Region table
      const total = Data.TOTAL_VOTERS;
      let html = '<table><thead><tr><th>Region</th><th>Voters</th><th>Share</th><th>Counties</th></tr></thead><tbody>';
      for (const [name, stats] of regions) {
        html += `<tr>
          <td><strong>${name}</strong></td>
          <td class="td-mono td-highlight">${Utils.fmt(stats.voters)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <div class="progress" style="flex:1;min-width:60px"><div class="progress-bar" style="width:${Utils.pct(stats.voters,total)}%"></div></div>
              <span style="font-size:0.78rem;color:var(--text2);min-width:36px">${Utils.pct(stats.voters,total)}%</span>
            </div>
          </td>
          <td style="color:var(--text2)">${stats.counties.length}</td>
        </tr>`;
      }
      html += '</tbody></table>';
      document.getElementById('regionTable').innerHTML = html;
    } catch(e) {
      console.error(e);
    }
  }

  return { render };
})();
