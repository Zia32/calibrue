// Calibrue storage on the laptop: the current calibration plus a history of all of them,
// and which screen each one belongs to. Browser only (window.Store).
(function (root) {
  const CUR = 'calibrue.calibration', HIST = 'calibrue.history', MAX = 30;
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  function history() {
    let h = read(HIST);
    if (!Array.isArray(h)) { // first run after this feature: seed from the current calibration
      const c = read(CUR); h = c && c.ramps ? [c] : []; write(HIST, h);
    }
    return h;
  }
  // Save a calibration as current and keep it in the history (same 'when' = same entry, updated).
  function save(c) {
    write(CUR, c);
    const h = history().filter(x => x.when !== c.when);
    h.unshift(c);
    while (h.length > MAX) h.pop();
    if (!write(HIST, h)) { h.splice(5); write(HIST, h); } // storage full: keep the newest few
    return c;
  }
  const current = () => read(CUR);
  function use(when) { const c = history().find(x => x.when === when); if (c) write(CUR, c); return c; }
  function remove(when) {
    const h = history().filter(x => x.when !== when); write(HIST, h);
    const c = current(); if (c && c.when === when) write(CUR, h[0] || null);
  }

  // Which screen this page is on. With the Window Management permission, browsers give the
  // screen's name ("DELL UP3017") and whether it is built in; without it, size only.
  let details = null;
  async function screenInfo(ask = false) {
    try {
      if (!details && 'getScreenDetails' in window) {
        const st = await navigator.permissions.query({ name: 'window-management' }).catch(() => null);
        if (ask || (st && st.state === 'granted')) details = await window.getScreenDetails();
      }
    } catch (e) { details = null; }
    const d = details && details.currentScreen;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(screen.width * dpr), h = Math.round(screen.height * dpr);
    if (d) return { label: d.label || '', internal: !!d.isInternal, w, h, known: true };
    return { label: '', internal: null, w, h, known: false };
  }
  const onScreenChange = fn => { try { details && details.addEventListener('currentscreenchange', fn); } catch (e) {} };
  // Short, file-name-safe screen name: "UP3017", "Built-in", or "2560x1600".
  function screenTag(s) {
    if (!s) return '';
    if (s.internal) return 'Built-in';
    if (s.label) return s.label.replace(/^(DELL|LG|SAMSUNG|ASUS|ACER|BENQ|HP|LENOVO|AOC|MSI|PHILIPS|VIEWSONIC)\s+/i, '').replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'Screen';
    return `${s.w}x${s.h}`;
  }
  const screenName = s => !s ? 'unknown screen' : s.internal ? 'built-in screen' : s.label || `screen ${s.w}×${s.h}`;
  const day = w => { const d = new Date(w); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const profileName = c => `calibrue-${c.screen ? screenTag(c.screen) + '-' : ''}${day(c.when)}${c.refinements ? '-r' + c.refinements : ''}${c.whiteRev ? '-w' + c.whiteRev : ''}.icc`;

  root.Store = { history, save, current, use, remove, screenInfo, onScreenChange, screenTag, screenName, profileName, day };
})(window);
