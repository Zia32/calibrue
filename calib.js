// Calibrue M3: tone-curve measurement by checkerboard nulls, and correction ramps.
// Pure functions; the page supplies a measure(v) callback. Works in the browser
// (window.Calib) and in Node (module.exports) for testing.
(function (root) {
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  // Fit step = sqrt(G²(u(v) − u(v0))² + c²), u(v) = (v/255)^g: the flicker is proportional
  // to the light difference, which follows the panel's local power law g (pass 1 for a
  // straight V in code values). c is the noise floor. For a fixed v0 the model is linear
  // in (G², c²); grid-search v0. Returns k = slope in camera levels per code at v0.
  function fitNull(pts, g = 1, lo = 0, hi = 255) {
    const u = v => (v / 255) ** g;
    const m = pts.reduce((b, p) => (p.step < b.step ? p : b), pts[0]).v;
    let best = null;
    for (let v0 = clamp(m - 30, lo, hi); v0 <= clamp(m + 30, lo, hi); v0 += 0.05) {
      let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0;
      const u0 = u(v0);
      for (const p of pts) {
        const d2 = (u(p.v) - u0) ** 2, s2 = p.step ** 2;
        a11 += d2 * d2; a12 += d2; a22 += 1; b1 += d2 * s2; b2 += s2;
      }
      const det = a11 * a22 - a12 * a12;
      let k2, c2;
      if (Math.abs(det) > 1e-12) { k2 = (b1 * a22 - a12 * b2) / det; c2 = (a11 * b2 - a12 * b1) / det; }
      if (!(c2 >= 0)) { c2 = 0; k2 = a11 > 0 ? b1 / a11 : 0; }
      if (!(k2 > 0)) continue;
      let err = 0;
      for (const p of pts) err += (Math.sqrt(k2 * (u(p.v) - u0) ** 2 + c2) - p.step) ** 2;
      if (!best || err < best.err) {
        const slope = g * (Math.max(v0, 0.5) / 255) ** (g - 1) / 255; // du/dv at v0
        best = { v0, k: Math.sqrt(k2) * slope, c: Math.sqrt(c2), err };
      }
    }
    return best || { v0: m, k: NaN, c: NaN, err: NaN };
  }

  // Find the null near prediction p. measure(v) → Promise<{step, snr}>.
  // 3 points around p, fit, 2 points around the estimate, refit; one more pair if the
  // estimate still lies outside the measured range. Returns {v0, k, c, pts}.
  async function findNull(measure, p, g = 2.2, extra = false) {
    const fitNull_ = pts => fitNull(pts, g);
    const pts = [];
    const at = async v => {
      v = Math.round(clamp(v, 0, 255));
      if (pts.some(q => q.v === v)) return;
      const r = await measure(v);
      pts.push({ v, step: r.step, snr: r.snr });
    };
    for (const v of [p - 6, p, p + 6]) await at(v);
    let f = fitNull_(pts);
    // Shallow curve (dark tones): ±6 barely clears the noise floor. Add wider arms so
    // each side rises to about 3× the floor, then refit.
    const floor = Math.max(f.c || 0, 1);
    if (!(f.k * 6 >= 2.5 * floor)) {
      const arm = Math.min(30, Math.ceil(3 * floor / Math.max(f.k || 0, 0.05)));
      await at(f.v0 - arm); await at(f.v0 + arm);
      f = fitNull_(pts);
    }
    for (let round = 0; round < 2; round++) {
      await at(f.v0 - 2.5); await at(f.v0 + 2.5);
      f = fitNull_(pts);
      const vs = pts.map(q => q.v);
      if (f.v0 >= Math.min(...vs) && f.v0 <= Math.max(...vs)) break;
    }
    if (extra) { await at(f.v0 - 1.5); await at(f.v0 + 1.5); f = fitNull_(pts); } // two more points close to the null
    return { ...f, pts };
  }

  // Light fraction at integer code n, from a measured point P near it (local power law).
  function fractionAt(P, n) {
    if (n === P.v) return P.F;
    if (P.F <= 0 || P.F >= 1 || P.v <= 0 || P.v >= 255) return P.F;
    const g = Math.log(P.F) / Math.log(P.v / 255);
    return clamp(P.F + (n - P.v) * g * P.F / P.v, 0, 1);
  }

  // Order matters: each target is the average light of two earlier points.
  const PLAN = [
    [1 / 2, 0, 1], [1 / 4, 0, 1 / 2], [3 / 4, 1 / 2, 1],
    [1 / 8, 0, 1 / 4], [3 / 8, 1 / 4, 1 / 2], [5 / 8, 1 / 2, 3 / 4], [7 / 8, 3 / 4, 1],
    [1 / 16, 0, 1 / 8], [1 / 32, 0, 1 / 16],
  ];

  // Measure one channel. nullAt(a, b, p, g) → Promise<{v0,...}> finds v whose light equals
  // the checkerboard of codes a and b, starting near p (g = current gamma estimate). Returns points sorted by v.
  async function measureCurve(nullAt, onStep) {
    const known = new Map([[0, { v: 0, F: 0 }], [1, { v: 255, F: 1 }]]);
    let g = 2.3;
    for (const [i, [T, fa, fb]] of PLAN.entries()) {
      const A = known.get(fa), B = known.get(fb);
      const a = Math.round(A.v), b = Math.round(B.v);
      const target = (fractionAt(A, a) + fractionAt(B, b)) / 2;
      const p = clamp(255 * target ** (1 / g), a + 1, b - 1);
      onStep && onStep({ i, n: PLAN.length, T, a, b, p });
      const r = await nullAt(a, b, p, g);
      const v = clamp(r.v0, a + 0.5, b - 0.5);
      known.set(T, { v, F: target, nominal: T, fit: { k: r.k, c: r.c, pts: r.pts } });
      if (target > 0.02 && target < 0.98) g = Math.log(target) / Math.log(v / 255);
    }
    return [...known.values()].sort((x, y) => x.v - y.v);
  }

  // Smooth model through the measured points: F = x^γ(x), x = v/255, with
  // γ(x) = c0 + c1(x − ½) + c2(x − ½)². Weighted least squares on each point's local γ,
  // weights from how much ±1 code moves that γ (dark points are less certain).
  function smoothModel(pts) {
    const inner = pts.filter(p => p.v > 0 && p.v < 255 && p.F > 0 && p.F < 1);
    const rows = inner.map(p => {
      const x = p.v / 255, g = Math.log(p.F) / Math.log(x);
      const sg = Math.abs(Math.log(p.F) / Math.log((p.v + 1) / 255) - g) + 1e-4;
      return { t: x - 0.5, g, w: 1 / sg ** 2 };
    });
    const deg = rows.length >= 6 ? 2 : rows.length >= 3 ? 1 : 0;
    const n = deg + 1, N = Array.from({ length: n }, () => new Array(n).fill(0)), r = new Array(n).fill(0);
    for (const q of rows) {
      const b = [1, q.t, q.t * q.t].slice(0, n);
      for (let i = 0; i < n; i++) { r[i] += q.w * b[i] * q.g; for (let j = 0; j < n; j++) N[i][j] += q.w * b[i] * b[j]; }
    }
    // Gaussian elimination
    for (let i = 0; i < n; i++) {
      for (let k = i + 1; k < n; k++) { const f = N[k][i] / N[i][i]; for (let j = i; j < n; j++) N[k][j] -= f * N[i][j]; r[k] -= f * r[i]; }
    }
    const c = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = r[i]; for (let j = i + 1; j < n; j++) s -= N[i][j] * c[j]; c[i] = s / N[i][i]; }
    while (c.length < 3) c.push(0);
    return c;
  }
  // Light fraction at any code v.
  function curveF(pts, v) {
    if (v <= 0) return 0;
    if (v >= 255) return 1;
    const c = pts._model || (pts._model = smoothModel(pts));
    const x = v / 255, t = x - 0.5;
    return x ** (c[0] + c[1] * t + c[2] * t * t);
  }
  // Inverse: code v giving light fraction F.
  function curveV(pts, F) {
    if (F <= 0) return 0;
    if (F >= 1) return 255;
    let lo = 0, hi = 255;
    for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (curveF(pts, mid) < F) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  // 256-entry correction ramp (0–65535): input code i should give (i/255)^target light.
  function ramp(pts, target = 2.2) {
    const out = new Array(256);
    let prev = 0;
    for (let i = 0; i < 256; i++) {
      const v = i === 0 ? 0 : i === 255 ? 255 : curveV(pts, (i / 255) ** target);
      prev = Math.max(prev, Math.round(v / 255 * 65535));
      out[i] = prev;
    }
    return out;
  }

  // Effective gamma at the 50% point.
  function gammaHalf(pts) {
    const h = pts.find(p => p.nominal === 0.5);
    return h ? Math.log(0.5) / Math.log(h.v / 255) : NaN;
  }


  // Shift a channel's whole curve by d in gamma (each point keeps its light level, its code
  // moves). Used to anchor the per-channel shape to the grey null, which is what greys show.
  function shiftGamma(pts, d) {
    return pts.map(p => {
      if (!(p.F > 0 && p.F < 1 && p.v > 0 && p.v < 255)) return { ...p };
      const g = Math.log(p.F) / Math.log(p.v / 255) + d;
      return { ...p, v: 255 * p.F ** (1 / g) };
    });
  }

  // After installing a profile, the grey null showed effective gamma gAfter. Feed each input
  // through x → x^(target/gAfter) before the old ramp, so the screen lands on the target.
  function refineRamps(ramps, gAfter, target = 2.2) {
    const out = {};
    for (const c of ['red', 'green', 'blue']) {
      const r = ramps[c], e = target / gAfter, arr = new Array(256);
      let prev = 0;
      for (let i = 0; i < 256; i++) {
        const u = i === 0 ? 0 : i === 255 ? 255 : 255 * (i / 255) ** e;
        const j = Math.floor(u), f = u - j;
        const val = j >= 255 ? r[255] : r[j] * (1 - f) + r[j + 1] * f;
        prev = Math.max(prev, Math.round(val)); arr[i] = prev;
      }
      out[c] = arr;
    }
    return out;
  }

  // Run several null searches in lockstep: each search asks for one value at a time, and when
  // every active search has asked, one combined measurement answers them all. measureBatch(reqs)
  // gets [{ch, a, b, v, first}, ...] and returns one {step, snr} per request, in order.
  function lockstep(measureBatch) {
    let active = 0, pending = [], busy = false;
    const flush = async () => {
      if (busy || !pending.length || pending.length < active) return;
      busy = true;
      const batch = pending; pending = [];
      try { const res = await measureBatch(batch.map(p => p.req)); batch.forEach((p, i) => p.resolve(res[i])); }
      catch (e) { batch.forEach(p => p.reject(e)); }
      busy = false;
      setTimeout(flush, 0); // requests that arrived while measuring
    };
    return {
      join() { active++; },
      leave() { active--; flush(); },
      measure(req) { return new Promise((resolve, reject) => { pending.push({ req, resolve, reject }); flush(); }); },
    };
  }

  // All channels' curves at once. measureBatch as in lockstep(); onStep(ch, step) per null.
  async function measureCurves(chans, measureBatch, onStep, extra = false) {
    const L = lockstep(measureBatch);
    chans.forEach(() => L.join());
    const out = {};
    await Promise.all(chans.map(async ch => {
      try {
        out[ch] = await measureCurve((a, b, p, g) => {
          let first = true;
          return findNull(v => { const req = { ch, a, b, v, first }; first = false; return L.measure(req); }, p, g, extra);
        }, st => onStep && onStep(ch, st));
      } finally { L.leave(); }
    }));
    return out;
  }

  const api = { lockstep, measureCurves, shiftGamma, refineRamps, fitNull, findNull, fractionAt, PLAN, measureCurve, smoothModel, curveF, curveV, ramp, gammaHalf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Calib = api;
})(typeof window !== 'undefined' ? window : globalThis);
