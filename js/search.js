// ===== SEARCH MODULE =====
const Search = (() => {
  let currentData = null;
  let currentType = null;

  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <h1>🔍 DATA SEARCH</h1>
          <p>Search registered voters by county, constituency, ward or polling station</p>
        </div>
      </div>
      <div class="container section">
        <div class="card" style="margin-bottom:1.5rem;">
          <div class="card-body">
            <div class="tabs">
              <button class="tab-btn active" data-tab="quick">Quick Search</button>
              <button class="tab-btn" data-tab="browse">Browse Hierarchy</button>
            </div>
            <div id="tabQuick">
              <div class="search-box" style="margin-bottom:1rem;">
                <input type="text" class="form-control" id="searchInput" placeholder="Type county, constituency, or ward name..." autocomplete="off">
                <div class="search-results" id="searchResults" style="display:none;"></div>
              </div>
            </div>
            <div id="tabBrowse" style="display:none;">
              <div class="grid-2" style="gap:1rem;margin-bottom:1rem;">
                <div class="form-group" style="margin:0;">
                  <label class="form-label">County</label>
                  <select class="form-control" id="browseCounty"><option value="">— Select County —</option></select>
                </div>
                <div class="form-group" style="margin:0;">
                  <label class="form-label">Constituency</label>
                  <select class="form-control" id="browseConst" disabled><option value="">— Select First —</option></select>
                </div>
                <div class="form-group" style="margin:0;">
                  <label class="form-label">Ward</label>
                  <select class="form-control" id="browseWard" disabled><option value="">— All Wards —</option></select>
                </div>
                <div style="display:flex;align-items:flex-end;">
                  <button class="btn btn-primary" id="browseLoad">Load Data</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="searchResultPanel"></div>
      </div>
    `;

    bindSearch();
    bindBrowse();
    bindTabs();
  }

  function bindTabs() {
    Utils.qsa('.tab-btn').forEach(btn => {
      Utils.on(btn, 'click', () => {
        Utils.qsa('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        Utils.qs('#tabQuick').style.display = tab==='quick'?'block':'none';
        Utils.qs('#tabBrowse').style.display = tab==='browse'?'block':'none';
      });
    });
  }

  function bindSearch() {
    const input = Utils.qs('#searchInput');
    const resultsEl = Utils.qs('#searchResults');
    const doSearch = Utils.debounce(async () => {
      const q = input.value.trim();
      if (q.length < 2) { resultsEl.style.display = 'none'; return; }
      const results = await Data.search(q, 15);
      if (!results.length) { resultsEl.style.display = 'none'; return; }
      resultsEl.innerHTML = results.map(r => {
        const icons = { county: '🏛️', constituency: '🏅', ward: '🏘️' };
        const sub = r.type === 'county' ? `${r.code} · County`
          : r.type === 'constituency' ? `${r.county} · Constituency`
          : `${r.constituency}, ${r.county} · Ward`;
        return `<div class="search-result-item" data-type="${r.type}" data-name="${r.name}" data-county="${r.county||''}" data-const="${r.constituency||''}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div class="sri-name">${icons[r.type]} ${Utils.titleCase(r.name)}</div>
              <div class="sri-meta">${sub}</div>
            </div>
            <div class="sri-voters">${Utils.fmt(r.voters)}</div>
          </div>
        </div>`;
      }).join('');
      resultsEl.style.display = 'block';
      resultsEl.querySelectorAll('.search-result-item').forEach(item => {
        Utils.on(item, 'click', () => {
          resultsEl.style.display = 'none';
          input.value = '';
          loadResult(item.dataset.type, item.dataset.name, item.dataset.county, item.dataset.const);
        });
      });
    }, 300);
    Utils.on(input, 'input', doSearch);
    document.addEventListener('click', e => {
      if (!e.target.closest('#searchInput') && !e.target.closest('#searchResults')) {
        resultsEl.style.display = 'none';
      }
    });
  }

  async function bindBrowse() {
    const counties = await Data.getCounties();
    const countyEl = Utils.qs('#browseCounty');
    countyEl.innerHTML = '<option value="">— Select County —</option>' +
      counties.map(c => `<option value="${c.name}">${Utils.titleCase(c.name)} (${Utils.fmt(c.voters)})</option>`).join('');

    Utils.on(countyEl, 'change', async () => {
      const cn = countyEl.value;
      const constEl = Utils.qs('#browseConst');
      const wardEl = Utils.qs('#browseWard');
      constEl.disabled = !cn;
      wardEl.disabled = true;
      wardEl.innerHTML = '<option value="">— All Wards —</option>';
      if (!cn) { constEl.innerHTML = '<option value="">— Select First —</option>'; return; }
      const consts = await Data.getConstituencies(cn);
      constEl.innerHTML = '<option value="">— All Constituencies —</option>' +
        consts.map(c => `<option value="${c.name}">${Utils.titleCase(c.name)} (${Utils.fmt(c.voters)})</option>`).join('');
      constEl.disabled = false;
    });

    Utils.on(Utils.qs('#browseConst'), 'change', async () => {
      const cn = countyEl.value; const con = Utils.qs('#browseConst').value;
      const wardEl = Utils.qs('#browseWard');
      if (!con) { wardEl.disabled = true; wardEl.innerHTML = '<option value="">— All Wards —</option>'; return; }
      const wards = await Data.getWards(cn, con);
      wardEl.innerHTML = '<option value="">— All Wards —</option>' +
        wards.map(w => `<option value="${w.name}">${Utils.titleCase(w.name)} (${Utils.fmt(w.voters)})</option>`).join('');
      wardEl.disabled = false;
    });

    Utils.on(Utils.qs('#browseLoad'), 'click', async () => {
      const cn = countyEl.value;
      const con = Utils.qs('#browseConst').value;
      const ward = Utils.qs('#browseWard').value;
      if (!cn) { Utils.toast('Select a county', 'error'); return; }
      if (ward) loadResult('ward', ward, cn, con);
      else if (con) loadResult('constituency', con, cn, '');
      else loadResult('county', cn, '', '');
    });
  }

  async function loadResult(type, name, county, constituency) {
    const panel = Utils.qs('#searchResultPanel');
    panel.innerHTML = '<div class="card card-body" style="text-align:center;padding:2rem;"><div class="loader-ring" style="margin:0 auto;"></div><p style="margin-top:1rem;color:var(--text2);">Loading data...</p></div>';

    try {
      if (type === 'county') await renderCounty(panel, name);
      else if (type === 'constituency') await renderConstituency(panel, name, county);
      else if (type === 'ward') await renderWard(panel, name, county, constituency);
    } catch(e) {
      panel.innerHTML = '<div class="card card-body"><p style="color:var(--red);">Error loading data. Please try again.</p></div>';
    }
  }

  async function renderCounty(panel, name) {
    const s = await Data.loadSummary();
    const county = s[name];
    if (!county) { panel.innerHTML = ''; return; }
    const consts = Object.entries(county.constituencies).sort((a,b)=>b[1].voters-a[1].voters);
    const total = county.voters;

    let html = `
      <div id="resultPanel">
        <div class="section-header">
          <h2 class="section-title">🏛️ ${Utils.titleCase(name)} County</h2>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-sm btn-ghost" onclick="Utils.downloadDiv(document.getElementById('resultPanel'),'${name}_county')">⬇ PNG</button>
          </div>
        </div>
        <div class="stats-row" style="margin-bottom:1.5rem;">
          <div class="stat-card"><div class="stat-icon">🗳️</div><div class="stat-val">${Utils.fmt(total)}</div><div class="stat-label">Registered Voters</div></div>
          <div class="stat-card"><div class="stat-icon">🏅</div><div class="stat-val">${consts.length}</div><div class="stat-label">Constituencies</div></div>
          <div class="stat-card"><div class="stat-icon">📍</div><div class="stat-val">${Data.getRegion(name)}</div><div class="stat-label">Region</div></div>
          <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-val">${Utils.pct(total, Data.TOTAL_VOTERS)}%</div><div class="stat-label">Of National Total</div></div>
        </div>
        <div class="grid-2" style="gap:1.5rem;">
          <div class="card">
            <div class="card-header"><span class="card-title">Constituencies</span></div>
            <div class="card-body table-wrap">
              <table><thead><tr><th>Constituency</th><th>Voters</th><th>Share</th><th>Wards</th></tr></thead><tbody>
              ${consts.map(([cn, cd]) => `<tr>
                <td><a href="#" style="color:var(--accent)" onclick="Search._loadConst('${cn}','${name}');return false;">${Utils.titleCase(cn)}</a></td>
                <td class="td-mono td-highlight">${Utils.fmt(cd.voters)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:0.5rem;">
                    <div class="progress" style="width:80px"><div class="progress-bar" style="width:${Utils.pct(cd.voters,total)}%"></div></div>
                    <span style="font-size:0.78rem;color:var(--text2)">${Utils.pct(cd.voters,total)}%</span>
                  </div>
                </td>
                <td style="color:var(--text3)">${Object.keys(cd.wards).length}</td>
              </tr>`).join('')}
              </tbody></table>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">Distribution Chart</span></div>
            <div class="card-body"><div style="height:280px;"><canvas id="resultChart"></canvas></div></div>
          </div>
        </div>
      </div>
    `;
    panel.innerHTML = html;
    const top8 = consts.slice(0,8);
    Charts.horizontalBar('resultChart', top8.map(c=>Utils.titleCase(c[0])), top8.map(c=>c[1].voters), Utils.colorPalette(8));
  }

  async function renderConstituency(panel, name, county) {
    const wards = await Data.getWards(county, name);
    const total = wards.reduce((s,w)=>s+w.voters,0);
    const sorted = [...wards].sort((a,b)=>b.voters-a.voters);
    panel.innerHTML = `
      <div id="resultPanel">
        <div class="section-header">
          <h2 class="section-title">🏅 ${Utils.titleCase(name)}</h2>
          <span style="color:var(--text3);font-size:0.875rem;">${Utils.titleCase(county)} County</span>
          <button class="btn btn-sm btn-ghost" onclick="Utils.downloadDiv(document.getElementById('resultPanel'),'${name}_constituency')">⬇ PNG</button>
        </div>
        <div class="stats-row" style="margin-bottom:1.5rem;">
          <div class="stat-card"><div class="stat-icon">🗳️</div><div class="stat-val">${Utils.fmt(total)}</div><div class="stat-label">Registered Voters</div></div>
          <div class="stat-card"><div class="stat-icon">🏘️</div><div class="stat-val">${wards.length}</div><div class="stat-label">Wards</div></div>
          <div class="stat-card"><div class="stat-icon">📍</div><div class="stat-val">${sorted[0]?.name?Utils.titleCase(sorted[0].name):'—'}</div><div class="stat-label">Largest Ward</div></div>
        </div>
        <div class="grid-2" style="gap:1.5rem;">
          <div class="card">
            <div class="card-header"><span class="card-title">Wards</span></div>
            <div class="card-body table-wrap">
              <table><thead><tr><th>Ward</th><th>Voters</th><th>Share</th><th>Stations</th></tr></thead><tbody>
              ${sorted.map(w => `<tr>
                <td><a href="#" style="color:var(--accent)" onclick="Search._loadWard('${w.name}','${county}','${name}');return false;">${Utils.titleCase(w.name)}</a></td>
                <td class="td-mono td-highlight">${Utils.fmt(w.voters)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:0.5rem;">
                    <div class="progress" style="width:70px"><div class="progress-bar" style="width:${Utils.pct(w.voters,total)}%"></div></div>
                    <span style="font-size:0.78rem;color:var(--text2)">${Utils.pct(w.voters,total)}%</span>
                  </div>
                </td>
                <td style="color:var(--text3)">${w.stationCount}</td>
              </tr>`).join('')}
              </tbody></table>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">Ward Distribution</span></div>
            <div class="card-body"><div style="height:280px;"><canvas id="resultChart"></canvas></div></div>
          </div>
        </div>
      </div>`;
    Charts.doughnut('resultChart', sorted.map(w=>Utils.titleCase(w.name)), sorted.map(w=>w.voters), Utils.colorPalette(sorted.length));
  }

  async function renderWard(panel, name, county, constituency) {
    const stations = await Data.getStations(county, constituency, name);
    const total = stations.reduce((s,st)=>s+st.voters,0);
    panel.innerHTML = `
      <div id="resultPanel">
        <div class="section-header">
          <h2 class="section-title">🏘️ ${Utils.titleCase(name)} Ward</h2>
          <span style="color:var(--text3);font-size:0.875rem;">${Utils.titleCase(constituency)}, ${Utils.titleCase(county)}</span>
          <button class="btn btn-sm btn-ghost" onclick="Utils.downloadDiv(document.getElementById('resultPanel'),'${name}_ward')">⬇ PNG</button>
        </div>
        <div class="stats-row" style="margin-bottom:1.5rem;">
          <div class="stat-card"><div class="stat-icon">🗳️</div><div class="stat-val">${Utils.fmt(total)}</div><div class="stat-label">Registered Voters</div></div>
          <div class="stat-card"><div class="stat-icon">📍</div><div class="stat-val">${stations.length}</div><div class="stat-label">Polling Stations</div></div>
          <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-val">${total?Utils.fmt(Math.round(total/stations.length)):'—'}</div><div class="stat-label">Avg per Station</div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Polling Stations</span></div>
          <div class="card-body table-wrap">
            <table><thead><tr><th>Station Code</th><th>Station Name</th><th>Registered Voters</th><th>% of Ward</th></tr></thead><tbody>
            ${stations.map(st => `<tr>
              <td class="td-mono" style="font-size:0.75rem;color:var(--text3)">${st.code}</td>
              <td>${Utils.titleCase(st.name)}</td>
              <td class="td-mono td-highlight">${Utils.fmt(st.voters)}</td>
              <td>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <div class="progress" style="width:80px"><div class="progress-bar" style="width:${Utils.pct(st.voters,total)}%"></div></div>
                  <span style="font-size:0.78rem;color:var(--text2)">${Utils.pct(st.voters,total)}%</span>
                </div>
              </td>
            </tr>`).join('')}
            </tbody></table>
          </div>
        </div>
      </div>`;
  }

  function _loadConst(name, county) { loadResult('constituency', name, county, ''); }
  function _loadWard(name, county, constituency) { loadResult('ward', name, county, constituency); }

  return { render, _loadConst, _loadWard };
})();
