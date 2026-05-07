// ===== AI ADVISOR MODULE =====
const Advisor = (() => {
  let messages = [];
  let context = {};

  const SYSTEM_PROMPT = `You are a sharp, no-nonsense Kenyan political strategist and election advisor with deep knowledge of Kenya's electoral system, demographics, regional voting patterns, tribal politics, and campaign strategies.

You help political aspirants and analysts understand how to WIN elections in Kenya. Your advice is:
- Direct, actionable, and specific to Kenya's political reality
- Based on actual electoral geography (counties, constituencies, wards, polling stations)
- Honest about hard political realities including vote-buying culture, community mobilization, party dynamics
- Strategic about resource allocation, agent deployment, and vote protection
- Aware of regional voting blocs (Mt Kenya, Rift Valley, Coast, Western, Nyanza, etc.)
- Knowledgeable about tallying processes, IEBC procedures, and results transmission

When a user provides their simulation data or scenario, analyze it deeply and give specific, tactical advice such as:
- Which regions/wards to prioritize for maximum vote gains
- How to deal with strong competitors (coalition building, split votes, etc.)
- Where to deploy agents and resources
- Turnout mobilization strategies for their strongholds
- Mitigation strategies for weak areas
- How vote margins translate to wins at different levels

Keep responses concise but punchy. Use Kenyan political language naturally. Be like a trusted kampuni advisor speaking frankly. Format key points clearly.`;

  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <h1>🤖 AI ADVISOR</h1>
          <p>Your personal political strategist powered by Claude AI. Get frank, tactical advice for your campaign.</p>
        </div>
      </div>
      <div class="container section">
        <div class="grid-2" style="gap:1.5rem;align-items:start;">
          <!-- CHAT -->
          <div class="card" style="grid-column:1/3;">
            <div class="card-header">
              <div style="display:flex;align-items:center;gap:0.75rem;">
                <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--green));display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🧠</div>
                <div>
                  <div style="font-weight:600;">Political Strategist AI</div>
                  <div style="font-size:0.75rem;color:var(--green);">● Online · Powered by Claude</div>
                </div>
              </div>
              <div style="display:flex;gap:0.5rem;">
                <button class="btn btn-sm btn-ghost" onclick="Advisor._clearChat()">🗑 Clear</button>
                <button class="btn btn-sm btn-ghost" onclick="Advisor._setContext()">📋 Set Context</button>
              </div>
            </div>

            <!-- Quick prompts -->
            <div style="padding:1rem 1.25rem;border-bottom:1px solid var(--border);display:flex;gap:0.5rem;flex-wrap:wrap;">
              ${[
                ['🏆 How do I win?', 'What is the best strategy for me to win this election?'],
                ['🗺️ Strongholds', 'Identify my strongholds and how to maximize votes there'],
                ['⚔️ Beat competitors', 'How do I neutralize my strongest competitor?'],
                ['📊 Resource allocation', 'How should I allocate my campaign resources and agents?'],
                ['🤝 Coalition strategy', 'Should I form any coalitions or alliances?'],
                ['🏃 Ground game', 'What should my ground mobilization strategy look like?']
              ].map(([label, prompt]) =>
                `<button class="btn btn-sm btn-ghost" onclick="Advisor._quickPrompt('${prompt.replace(/'/g,"\\'")}')">
                  ${label}
                </button>`
              ).join('')}
            </div>

            <!-- Context banner -->
            <div id="contextBanner" style="display:none;padding:0.75rem 1.25rem;background:rgba(0,212,255,0.06);border-bottom:1px solid var(--border);font-size:0.8rem;color:var(--accent);">
              📋 Context loaded — advisor will factor in your simulation data
            </div>

            <!-- Messages -->
            <div class="advisor-chat" id="advisorChat">
              <div class="chat-msg assistant">
                <div class="chat-avatar">🧠</div>
                <div class="chat-bubble">
                  <strong>Habari!</strong> I'm your political strategist. Tell me about your race — what position are you vying for, which area, and who are your competitors? The more detail you give me, the sharper my advice.<br><br>
                  You can also use the quick prompts above, or paste your simulation results for targeted analysis. Let's map your path to victory. 🏆
                </div>
              </div>
            </div>

            <!-- Input -->
            <div class="chat-input-row">
              <input type="text" class="form-control" id="advisorInput"
                placeholder="Ask about strategy, vote allocation, competitor analysis..."
                onkeydown="if(event.key==='Enter')Advisor._send()">
              <button class="btn btn-primary" onclick="Advisor._send()">Send ➤</button>
            </div>
          </div>
        </div>

        <!-- Scenario Cards -->
        <div style="margin-top:2rem;">
          <div class="section-header"><h3 class="section-title">💡 Example Scenarios</h3></div>
          <div class="grid-3" style="gap:1rem;">
            ${[
              { icon:'🏛️', title:'Governor Race', desc:'You\'re trailing in urban wards but leading rural. How to bridge the gap?', prompt:'I am running for governor. I have strong support in rural wards but weak in the urban center. My main competitor leads in town. How do I win?' },
              { icon:'🏅', title:'MP Strategy', desc:'Three candidates splitting votes. How to consolidate and win?', prompt:'I am running for MP in a constituency with 3 other candidates. Votes are being split. How do I consolidate votes and create a winning coalition?' },
              { icon:'🏘️', title:'MCA Ground Game', desc:'Ward-level mobilization and agent deployment strategy.', prompt:'I am running for MCA. My ward has 8 polling stations. How do I organize agents, mobilize voters, and protect my votes on election day?' },
              { icon:'👩‍⚖️', title:"Women's Rep", desc:'County-wide strategy for women\'s representative seat.', prompt:"I am running for Women's Representative in a county with 5 constituencies. What is the best way to campaign across all constituencies efficiently?"},
              { icon:'⚖️', title:'Senate Tactics', desc:'Building a county coalition from diverse constituencies.', prompt:'I am running for Senate. My county has 4 constituencies with different political leanings. How do I build a winning coalition?' },
              { icon:'🇰🇪', title:'Presidential Analysis', desc:'Regional vote strategy for national office.', prompt:'Analyze a presidential race strategy focusing on building a winning coalition across Kenya\'s 8 regions. Which regions are must-win?' }
            ].map(s => `
              <div class="card" style="cursor:pointer;transition:border-color 0.2s;" onclick="Advisor._quickPrompt('${s.prompt.replace(/'/g,"\\'")}')">
                <div class="card-body" style="text-align:center;">
                  <div style="font-size:2rem;margin-bottom:0.75rem;">${s.icon}</div>
                  <div style="font-weight:600;margin-bottom:0.5rem;">${s.title}</div>
                  <div style="font-size:0.8rem;color:var(--text2);">${s.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Context Modal -->
      <div id="contextModal" style="display:none;position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.8);align-items:center;justify-content:center;padding:1rem;">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:2rem;max-width:560px;width:100%;">
          <h3 style="margin-bottom:1rem;font-family:'Bebas Neue',sans-serif;font-size:1.6rem;">📋 Set Your Campaign Context</h3>
          <div class="form-group">
            <label class="form-label">Position you're running for</label>
            <select class="form-control" id="ctxPosition">
              ${Data.POSITIONS.map(p=>`<option value="${p.name}">${p.icon} ${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Area (County/Constituency/Ward)</label>
            <input type="text" class="form-control" id="ctxArea" placeholder="e.g. Embu County, Manyatta Constituency">
          </div>
          <div class="form-group">
            <label class="form-label">Your registered voters in area</label>
            <input type="number" class="form-control" id="ctxVoters" placeholder="e.g. 45000">
          </div>
          <div class="form-group">
            <label class="form-label">Main competitors (comma separated)</label>
            <input type="text" class="form-control" id="ctxCompetitors" placeholder="e.g. John Mwangi (Jubilee), Mary Wanjiku (ODM)">
          </div>
          <div class="form-group">
            <label class="form-label">Your anticipated votes</label>
            <input type="number" class="form-control" id="ctxMyVotes" placeholder="e.g. 18000">
          </div>
          <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
            <button class="btn btn-primary" onclick="Advisor._saveContext()">Save Context</button>
            <button class="btn btn-ghost" onclick="Advisor._closeContext()">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  async function _send() {
    const input = Utils.qs('#advisorInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    appendMessage('user', text);
    messages.push({ role: 'user', content: text });
    showTyping();
    try {
      const response = await callClaude(messages);
      hideTyping();
      appendMessage('assistant', response);
      messages.push({ role: 'assistant', content: response });
    } catch(e) {
      hideTyping();
      appendMessage('assistant', '⚠️ Could not connect to AI advisor. Please check your internet connection and try again.');
    }
  }

  async function callClaude(msgs) {
    // Build system with context
    let system = SYSTEM_PROMPT;
    if (context.position) {
      system += `\n\nCURRENT USER CONTEXT:\n- Position: ${context.position}\n- Area: ${context.area||'Not specified'}\n- Registered Voters: ${context.voters?Utils.fmt(context.voters):'Unknown'}\n- Competitors: ${context.competitors||'Unknown'}\n- Anticipated Votes: ${context.myVotes?Utils.fmt(context.myVotes):'Unknown'}`;
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system,
        messages: msgs.slice(-12) // keep last 12 messages
      })
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    const data = await res.json();
    return data.content?.[0]?.text || 'No response received.';
  }

  function appendMessage(role, text) {
    const chat = Utils.qs('#advisorChat');
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    const avatar = role === 'assistant' ? '🧠' : '👤';
    // Format text: bold **text**, line breaks
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    div.innerHTML = `
      <div class="chat-avatar">${avatar}</div>
      <div class="chat-bubble">${formatted}</div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  function showTyping() {
    const chat = Utils.qs('#advisorChat');
    const div = document.createElement('div');
    div.className = 'chat-msg assistant'; div.id = 'typingIndicator';
    div.innerHTML = `<div class="chat-avatar">🧠</div><div class="chat-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('typingIndicator');
    if (t) t.remove();
  }

  function _quickPrompt(text) {
    const input = Utils.qs('#advisorInput');
    if (input) { input.value = text; _send(); }
  }

  function _clearChat() {
    messages = [];
    const chat = Utils.qs('#advisorChat');
    if (chat) chat.innerHTML = `<div class="chat-msg assistant"><div class="chat-avatar">🧠</div><div class="chat-bubble">Chat cleared. Ready for a fresh strategy session. What's your campaign situation?</div></div>`;
  }

  function _setContext() {
    const modal = Utils.qs('#contextModal');
    if (modal) { modal.style.display = 'flex'; }
  }

  function _closeContext() {
    const modal = Utils.qs('#contextModal');
    if (modal) modal.style.display = 'none';
  }

  function _saveContext() {
    context = {
      position: Utils.qs('#ctxPosition')?.value,
      area: Utils.qs('#ctxArea')?.value,
      voters: Utils.qs('#ctxVoters')?.value,
      competitors: Utils.qs('#ctxCompetitors')?.value,
      myVotes: Utils.qs('#ctxMyVotes')?.value
    };
    _closeContext();
    const banner = Utils.qs('#contextBanner');
    if (banner) banner.style.display = 'block';
    Utils.toast('Context saved! Advisor will use this in responses.', 'success');
    // Inject context into chat
    if (context.position) {
      _quickPrompt(`I am running for ${context.position} in ${context.area||'my area'}. I have approximately ${context.voters||'unknown'} registered voters. My competitors are: ${context.competitors||'unknown'}. I anticipate getting about ${context.myVotes||'unknown'} votes. Give me a comprehensive winning strategy.`);
    }
  }

  return { render, _send, _quickPrompt, _clearChat, _setContext, _closeContext, _saveContext };
})();
