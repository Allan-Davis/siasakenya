// ===== SIMULATOR MODULE =====
const Simulator = (() => {
  let state = {
    position: 'president',
    level: 'national',
    county: '', constituency: '', ward: '',
    candidates: [],
    turnout: 70,
    registeredVoters: 0,
    simulated: false
  };

  const COLORS = ['#00d4ff','#00ff9d','#ff4757','#ffd32a','#a855f7','#ff9f43','#26de81','#45aaf2','#fd9644','#2bcbba'];

  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <h1>🎯 SIMULATOR</h1>
          <p>Build your election scenario, feed in anticipated votes, and analyze your winning strategy</p>
        </div>
      </div>
      <div class="container section">
        <div class="grid-2" style="gap:1.5rem;align-items:start;">
          <!-- LEFT: CONFIG -->
          <div>
            <div class="card" style="margin-bottom:1.5rem;">
              <div class="card-header"><span class="card-title">⚙️ Position & Scope</span></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Position</label>
                  <select class="form-control" id="simPosition">
                    ${Data.POSITIONS.map(p => `<option value="${p.id}">${p.icon} ${p.name}</option>`).join('')}
                  </select>
                </div>
                <div id="simLevelFields"></div>
                <div class="form-group">
                  <label class="form-label">Expected Turnout (%)</label>
                  <input type="range" class="form-control" id="simTurnout" min="20" max="100" value="70" style="padding:0.4rem 0;">
                  <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text3);margin-top:0.25rem;">
                    <span>Low (20%)</span><span id="turnoutLabel" style="color:var(--accent);font-weight:600;">70%</span><span>High (100%)</span>
                  </div>
                </div>
                <div class="form-group">
                  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:1rem;">
                    <div style="font-size:0.75rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.5rem;">Registered Voters</div>
                    <div id="simRegVoters" style="font-family:'JetBrains Mono',monospace;font-size:1.6rem;color:var(--accent);">—</div>
                    <div id="simExpVotes" style="font-size:0.8rem;color:var(--text2);margin-top:0.25rem;">Expected votes: —</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <span class="card-title">👥 Candidates</span>
                <button class="btn btn-sm btn-primary" id="addCandidateBtn">+ Add</button>
              </div>
              <div class="card-body">
                <div id="candidatesList">
                  <div class="empty-state"><div class="empty-state-icon">👤</div><p>Add candidates to start</p></div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: RESULTS -->
          <div>
            <div class="card" style="margin-bottom:1.5rem;">
              <div class="card-header">
                <span class="card-title">📊 Simulation Results</span>
                <div style="display:flex;gap:0.5rem;">
                  <button class="btn btn-sm btn-ghost" id="dlSimPng">⬇ PNG</button>
                  <button class="btn btn-sm btn-ghost" id="dlSimPdf">⬇ PDF</button>
                  <button class="btn btn-sm btn-primary" id="runSimBtn">▶ Run</button>
                </div>
              </div>
              <div id="simResults" class="card-body">
                <div class="empty-state">
                  <div class="empty-state-icon">🎯</div>
                  <h3>No simulation yet</h3>
                  <p>Configure position, add candidates and click Run</p>
                </div>
              </div>
            </div>

            <div class="card" id="simChartCard" style="display:none;">
              <div class="card-header"><span class="card-title">📈 Vote Distribution</span></div>
              <div class="card-body">
                <div style="height:260px;"><canvas id="simChart"></canvas></div>
                <div class="legend" id="simLegend" style="margin-top:1rem;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
    await updateLevelFields();
  }

  function bindEvents() {
    Utils.on(Utils.qs('#simPosition'), 'change', async e => {
      state.position = e.target.value;
      state.county = ''; state.constituency = ''; state.ward = '';
      await updateLevelFields();
    });
    Utils.on(Utils.qs('#simTurnout'), 'input', e => {
      state.turnout = +e.target.value;
      Utils.qs('#turnoutLabel').textContent = state.turnout + '%';
      updateVoterDisplay();
    });
    Utils.on(Utils.qs('#addCandidateBtn'), 'click', addCandidate);
    Utils.on(Utils.qs('#runSimBtn'), 'click', runSimulation);
    Utils.on(Utils.qs('#dlSimPng'), 'click', () => Utils.downloadDiv(Utils.qs('#simResults'), 'simulation_results'));
    Utils.on(Utils.qs('#dlSimPdf'), 'click', downloadPdf);
  }

  async function updateLevelFields() {
    const pos = Data.POSITIONS.find(p => p.id === state.position);
    const container = Utils.qs('#simLevelFields');
    let html = '';

    if (pos.level === 'county' || pos.level === 'constituency' || pos.level === 'ward') {
      const counties = await Data.getCounties();
      html += `<div class="form-group">
        <label class="form-label">County</label>
        <select class="form-control" id="simCounty">
          <option value="">— Select County —</option>
          ${counties.map(c => `<option value="${c.name}" ${state.county===c.name?'selected':''}>${Utils.titleCase(c.name)}</option>`).join('')}
        </select>
      </div>`;
    }
    if (pos.level === 'constituency' || pos.level === 'ward') {
      html += `<div class="form-group" id="simConstGroup" style="display:${state.county?'block':'none'}">
        <label class="form-label">Constituency</label>
        <select class="form-control" id="simConst">
          <option value="">— Select Constituency —</option>
        </select>
      </div>`;
    }
    if (pos.level === 'ward') {
      html += `<div class="form-group" id="simWardGroup" style="display:${state.constituency?'block':'none'}">
        <label class="form-label">Ward</label>
        <select class="form-control" id="simWard">
          <option value="">— Select Ward —</option>
        </select>
      </div>`;
    }
    container.innerHTML = html;

    if (pos.level === 'national') {
      state.registeredVoters = Data.TOTAL_VOTERS;
      updateVoterDisplay();
    }

    // Bind cascade events
    const countyEl = Utils.qs('#simCounty');
    if (countyEl) {
      if (state.county) await loadConstituencies(state.county);
      Utils.on(countyEl, 'change', async e => {
        state.county = e.target.value;
        state.constituency = ''; state.ward = '';
        if (pos.level === 'county') {
          const s = await Data.loadSummary();
          state.registeredVoters = s[state.county]?.voters || 0;
          updateVoterDisplay();
        } else {
          await loadConstituencies(state.county);
        }
      });
    }
    const constEl = Utils.qs('#simConst');
    if (constEl) {
      Utils.on(constEl, 'change', async e => {
        state.constituency = e.target.value;
        state.ward = '';
        if (pos.level === 'constituency') {
          const consts = await Data.getConstituencies(state.county);
          const c = consts.find(c => c.name === state.constituency);
          state.registeredVoters = c?.voters || 0;
          updateVoterDisplay();
        } else {
          await loadWards(state.county, state.constituency);
        }
      });
    }
    const wardEl = Utils.qs('#simWard');
    if (wardEl) {
      Utils.on(wardEl, 'change', async e => {
        state.ward = e.target.value;
        const wards = await Data.getWards(state.county, state.constituency);
        const w = wards.find(w => w.name === state.ward);
        state.registeredVoters = w?.voters || 0;
        updateVoterDisplay();
      });
    }
  }

  async function loadConstituencies(countyName) {
    const constEl = Utils.qs('#simConst');
    const constGroup = Utils.qs('#simConstGroup');
    if (!constEl) return;
    constGroup && (constGroup.style.display = 'block');
    const consts = await Data.getConstituencies(countyName);
    constEl.innerHTML = `<option value="">— Select Constituency —</option>` +
      consts.map(c => `<option value="${c.name}">${Utils.titleCase(c.name)} (${Utils.fmt(c.voters)} voters)</option>`).join('');
  }

  async function loadWards(countyName, constituencyName) {
    const wardEl = Utils.qs('#simWard');
    const wardGroup = Utils.qs('#simWardGroup');
    if (!wardEl) return;
    wardGroup && (wardGroup.style.display = 'block');
    const wards = await Data.getWards(countyName, constituencyName);
    wardEl.innerHTML = `<option value="">— Select Ward —</option>` +
      wards.map(w => `<option value="${w.name}">${Utils.titleCase(w.name)} (${Utils.fmt(w.voters)} voters)</option>`).join('');
  }

  function updateVoterDisplay() {
    const rv = Utils.qs('#simRegVoters');
    const ev = Utils.qs('#simExpVotes');
    if (rv) rv.textContent = Utils.fmt(state.registeredVoters);
    if (ev) ev.textContent = `Expected votes: ${Utils.fmt(Math.round(state.registeredVoters * state.turnout / 100))}`;
  }

  function addCandidate() {
    const id = Utils.uid();
    const color = COLORS[state.candidates.length % COLORS.length];
    state.candidates.push({ id, name: '', party: '', votes: 0, color });
    renderCandidates();
  }

  function removeCandidate(id) {
    state.candidates = state.candidates.filter(c => c.id !== id);
    renderCandidates();
  }

  function renderCandidates() {
    const el = Utils.qs('#candidatesList');
    if (!state.candidates.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👤</div><p>Add candidates to start</p></div>';
      return;
    }
    el.innerHTML = state.candidates.map((c, i) => `
      <div class="competitor-item" id="cand_${c.id}" style="grid-template-columns:auto 1fr auto auto;">
        <div class="competitor-color" style="background:${c.color}"></div>
        <div>
          <input type="text" placeholder="Candidate name" value="${c.name}"
            class="form-control" style="margin-bottom:0.4rem;"
            onchange="Simulator._updateCand('${c.id}','name',this.value)">
          <input type="text" placeholder="Party / Affiliation" value="${c.party}"
            class="form-control" style="font-size:0.8rem;"
            onchange="Simulator._updateCand('${c.id}','party',this.value)">
        </div>
        <div style="min-width:120px;">
          <input type="number" placeholder="Votes" value="${c.votes||''}"
            class="form-control td-mono" min="0"
            onchange="Simulator._updateCand('${c.id}','votes',+this.value)">
        </div>
        <button class="btn btn-sm btn-danger btn-icon" onclick="Simulator._removeCand('${c.id}')">✕</button>
      </div>
    `).join('');
  }

  function _updateCand(id, field, val) {
    const c = state.candidates.find(c => c.id === id);
    if (c) c[field] = val;
  }

  function _removeCand(id) { removeCandidate(id); }

  function runSimulation() {
    if (!state.candidates.length) { Utils.toast('Add at least one candidate', 'error'); return; }
    const named = state.candidates.filter(c => c.name.trim());
    if (!named.length) { Utils.toast('Give candidates names', 'error'); return; }

    const expectedVotes = Math.round(state.registeredVoters * state.turnout / 100);
    const totalEntered = state.candidates.reduce((s,c) => s + (c.votes||0), 0);
    const sorted = [...state.candidates].filter(c=>c.name).sort((a,b) => b.votes - a.votes);
    const winner = sorted[0];
    const runnerUp = sorted[1];

    let html = '';
    if (winner) {
      const margin = runnerUp ? winner.votes - runnerUp.votes : winner.votes;
      const marginPct = Utils.pct(margin, totalEntered || 1);
      const share = Utils.pct(winner.votes, totalEntered || 1);
      html += `
        <div class="result-banner">
          <div style="font-size:0.75rem;color:var(--text2);letter-spacing:2px;text-transform:uppercase;margin-bottom:0.5rem;">Projected Winner</div>
          <div class="result-winner">${winner.name.toUpperCase()}</div>
          <div style="font-size:0.85rem;color:var(--text3);margin-bottom:0.75rem;">${winner.party || 'Independent'}</div>
          <div class="result-votes">${Utils.fmt(winner.votes)} votes (${share}%)</div>
          ${runnerUp ? `<div class="result-margin">Margin over ${runnerUp.name}: +${Utils.fmt(margin)} votes (+${marginPct}%)</div>` : ''}
        </div>
      `;
    }

    // Turnout analysis
    const turnoutGap = expectedVotes - totalEntered;
    html += `
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:1rem;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;text-align:center;">
          <div><div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;margin-bottom:0.25rem;">Registered</div><div class="hl-num">${Utils.fmt(state.registeredVoters)}</div></div>
          <div><div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;margin-bottom:0.25rem;">Expected (${state.turnout}%)</div><div class="hl-num">${Utils.fmt(expectedVotes)}</div></div>
          <div><div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;margin-bottom:0.25rem;">Total Entered</div><div class="hl-num" style="color:${turnoutGap>0?'var(--orange)':'var(--green)'}">${Utils.fmt(totalEntered)}</div></div>
        </div>
        ${turnoutGap > 0 ? `<div style="margin-top:0.75rem;font-size:0.8rem;color:var(--orange);text-align:center;">⚠️ ${Utils.fmt(turnoutGap)} unclaimed votes based on expected turnout</div>` : ''}
      </div>
    `;

    // Candidate table
    html += `<table style="width:100%"><thead><tr><th>#</th><th>Candidate</th><th>Party</th><th>Votes</th><th>Share</th><th>Trend</th></tr></thead><tbody>`;
    sorted.forEach((c, i) => {
      const share = Utils.pctNum(c.votes, totalEntered||1);
      html += `<tr>
        <td><span style="background:${c.color};color:#000;padding:2px 7px;border-radius:4px;font-size:0.75rem;font-weight:700;">${i+1}</span></td>
        <td><strong>${c.name}</strong></td>
        <td style="color:var(--text3);font-size:0.82rem;">${c.party||'—'}</td>
        <td class="td-mono td-highlight">${Utils.fmt(c.votes)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <div class="progress" style="flex:1;min-width:60px"><div class="progress-bar" style="width:${share}%;background:${c.color}"></div></div>
            <span style="font-size:0.78rem;min-width:40px;color:var(--text2)">${share.toFixed(1)}%</span>
          </div>
        </td>
        <td><span class="badge ${i===0?'badge-green':'badge-accent'}">${i===0?'🏆 LEADING':i===1?'2nd':'Trailing'}</span></td>
      </tr>`;
    });
    html += '</tbody></table>';

    Utils.qs('#simResults').innerHTML = html;

    // Chart
    const chartCard = Utils.qs('#simChartCard');
    chartCard.style.display = 'block';
    Charts.doughnut('simChart',
      sorted.map(c => c.name),
      sorted.map(c => c.votes || 0),
      sorted.map(c => c.color)
    );
    Utils.qs('#simLegend').innerHTML = sorted.map(c =>
      `<div class="legend-item"><div class="legend-dot" style="background:${c.color}"></div>${c.name} — ${Utils.fmt(c.votes)}</div>`
    ).join('');

    state.simulated = true;
    Utils.toast('Simulation complete!', 'success');
  }

  async function downloadPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pos = Data.POSITIONS.find(p => p.id === state.position);
    doc.setFontSize(20); doc.text('ANALYZER - Simulation Report', 20, 20);
    doc.setFontSize(12); doc.text(`Position: ${pos.name}`, 20, 35);
    doc.text(`Registered Voters: ${Utils.fmt(state.registeredVoters)}`, 20, 44);
    doc.text(`Expected Turnout: ${state.turnout}%`, 20, 53);
    let y = 65;
    doc.setFontSize(14); doc.text('Candidates', 20, y); y += 10;
    const sorted = [...state.candidates].filter(c=>c.name).sort((a,b)=>b.votes-a.votes);
    const total = sorted.reduce((s,c)=>s+c.votes,0);
    sorted.forEach((c,i) => {
      doc.setFontSize(11);
      doc.text(`${i+1}. ${c.name} (${c.party||'Independent'}) — ${Utils.fmt(c.votes)} votes (${Utils.pct(c.votes,total)}%)`, 20, y);
      y += 8;
    });
    doc.save('analyzer_simulation.pdf');
    Utils.toast('PDF downloaded!', 'success');
  }

  return { render, _updateCand, _removeCand };
})();
