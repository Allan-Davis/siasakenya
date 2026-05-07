// ===== UTILS MODULE =====
const Utils = (() => {
  function fmt(n) {
    if (n === null || n === undefined) return '—';
    return Number(n).toLocaleString();
  }
  function pct(val, total) {
    if (!total) return '0.0';
    return ((val / total) * 100).toFixed(1);
  }
  function pctNum(val, total) {
    if (!total) return 0;
    return (val / total) * 100;
  }
  function toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
  function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function el(tag, cls, html='') {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }
  function qs(sel, ctx=document) { return ctx.querySelector(sel); }
  function qsa(sel, ctx=document) { return [...ctx.querySelectorAll(sel)]; }
  function on(el, ev, fn) { el.addEventListener(ev, fn); }
  function colorPalette(n) {
    const base = ['#00d4ff','#00ff9d','#ff4757','#ffd32a','#a855f7','#ff9f43','#26de81','#fd9644','#45aaf2','#2bcbba'];
    const result = [];
    for (let i = 0; i < n; i++) result.push(base[i % base.length]);
    return result;
  }
  function downloadCanvas(canvas, name) {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = name + '.png';
    a.click();
  }
  async function downloadDiv(divEl, name) {
    try {
      const canvas = await html2canvas(divEl, { backgroundColor: '#080c14', scale: 2 });
      downloadCanvas(canvas, name);
      toast('Downloaded as image!', 'success');
    } catch(e) { toast('Download failed', 'error'); }
  }
  function getIP() {
    return localStorage.getItem('_fp') || (() => {
      const fp = uid() + '-' + Date.now();
      localStorage.setItem('_fp', fp);
      return fp;
    })();
  }
  function getDeviceId() {
    return localStorage.getItem('_did') || (() => {
      const id = uid() + uid();
      localStorage.setItem('_did', id);
      return id;
    })();
  }
  function capFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''; }
  function titleCase(s) { return s ? s.split(' ').map(w => capFirst(w)).join(' ') : ''; }
  function relTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
    return Math.floor(diff/86400000) + 'd ago';
  }
  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard!', 'success')).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); toast('Copied!', 'success');
    });
  }
  function storageGet(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; }
  }
  function storageSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  }
  function generateShareId() { return uid() + uid(); }

  return { fmt, pct, pctNum, toast, debounce, uid, el, qs, qsa, on, colorPalette,
    downloadCanvas, downloadDiv, getIP, getDeviceId, capFirst, titleCase, relTime,
    copyText, storageGet, storageSet, generateShareId };
})();
