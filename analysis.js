// Flicker analysis on unevenly spaced camera samples.
// Works in the browser (window.Flicker) and in Node (module.exports) for testing.
(function (root) {
  // Remove mean and linear drift (auto exposure creeping) from a series.
  function detrend(t, x) {
    const n = t.length;
    let st = 0, sx = 0;
    for (let i = 0; i < n; i++) { st += t[i]; sx += x[i]; }
    const mt = st / n, mx = sx / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { const dt = t[i] - mt; num += dt * (x[i] - mx); den += dt * dt; }
    const k = den ? num / den : 0;
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) out[i] = x[i] - mx - k * (t[i] - mt);
    return out;
  }

  // Amplitude of the sine component at frequency f (Hz). t in seconds. With hann, samples are
  // weighted by a Hann window, which keeps strong signals at nearby frequencies (other colours
  // flickering at their own rate) from leaking into this one.
  function amplitude(t, x, f, hann) {
    let c = 0, s = 0, W = 0;
    const w = 2 * Math.PI * f, T = t[t.length - 1] - t[0] || 1;
    for (let i = 0; i < t.length; i++) {
      const k = hann ? 0.5 - 0.5 * Math.cos(2 * Math.PI * (t[i] - t[0]) / T) : 1;
      c += k * x[i] * Math.cos(w * t[i]); s += k * x[i] * Math.sin(w * t[i]); W += k;
    }
    return 2 * Math.hypot(c, s) / W;
  }

  // Spectrum on a fixed grid, below the camera's Nyquist limit.
  function spectrum(t, x, fps, lo = 1.5, step = 0.25, hann = false) {
    const hi = Math.min(15, fps / 2 - 0.5);
    const fs = [], as = [];
    for (let f = lo; f <= hi + 1e-9; f += step) { fs.push(+f.toFixed(3)); as.push(amplitude(t, x, f, hann)); }
    return { fs, as };
  }

  // Median amplitude away from f and its 2nd/3rd harmonics = noise floor.
  function noiseFloor(spec, f, others = []) {
    const vals = [];
    spec.fs.forEach((g, i) => {
      if ([f, ...others].some(F => [1, 2, 3].some(h => Math.abs(g - h * F) < 0.8))) return;
      vals.push(spec.as[i]);
    });
    if (!vals.length) return NaN;
    vals.sort((a, b) => a - b);
    return vals[Math.floor(vals.length / 2)];
  }

  // Peak frequency in [lo, hi], refined to 0.02 Hz.
  function findPeak(t, x, fps, lo = 3, hi = 12) {
    hi = Math.min(hi, fps / 2 - 0.5);
    let best = lo, bestA = -1;
    for (let f = lo; f <= hi; f += 0.1) { const a = amplitude(t, x, f); if (a > bestA) { bestA = a; best = f; } }
    for (let f = best - 0.12; f <= best + 0.12; f += 0.02) { const a = amplitude(t, x, f); if (a > bestA) { bestA = a; best = f; } }
    return { f: +best.toFixed(2), a: bestA };
  }

  // Full analysis of one channel.
  // others: frequencies of other signals in the same recording (excluded from the noise floor).
  function analyze(t, raw, f, fps, { hann = false, others = [] } = {}) {
    const x = detrend(t, raw);
    const a = amplitude(t, x, f, hann);
    const spec = spectrum(t, x, fps, 1.5, 0.25, hann);
    const noise = noiseFloor(spec, f, others);
    // A square wave with peak-to-peak D has a fundamental of amplitude 2D/π.
    return { a, step: a * Math.PI / 2, noise, snr: noise > 0 ? a / noise : NaN, spec };
  }


  // Joint least-squares fit of several flickers recorded together (one per colour, each at its
  // own frequency): x(t) = c0 + c1·t + Σ_f Σ_h [a cos(2πhft) + b sin(2πhft)], h = 1, 3 (a square
  // wave's main odd harmonics). Fitting all of them at once removes their leakage into each other,
  // even with uneven camera frame times. Returns per frequency {a, step, snr}.
  function fitJoint(t, x, freqs) {
    const n = t.length, T = t[n - 1] - t[0] || 1, t0 = t[0];
    const cols = [() => 1, tt => (tt - t0) / T];
    for (const f of freqs) for (const h of [1, 3]) {
      cols.push(tt => Math.cos(2 * Math.PI * h * f * tt)); cols.push(tt => Math.sin(2 * Math.PI * h * f * tt));
    }
    const m = cols.length, N = Array.from({ length: m }, () => new Float64Array(m)), r = new Float64Array(m), row = new Float64Array(m);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) row[j] = cols[j](t[i]);
      for (let j = 0; j < m; j++) { r[j] += row[j] * x[i]; for (let k = j; k < m; k++) N[j][k] += row[j] * row[k]; }
    }
    for (let j = 0; j < m; j++) for (let k = 0; k < j; k++) N[j][k] = N[k][j];
    // Cholesky-free Gaussian elimination with partial pivoting
    const A = N.map((rw, j) => [...rw, r[j]]);
    for (let c = 0; c < m; c++) {
      let p = c; for (let q = c + 1; q < m; q++) if (Math.abs(A[q][c]) > Math.abs(A[p][c])) p = q;
      [A[c], A[p]] = [A[p], A[c]];
      if (Math.abs(A[c][c]) < 1e-12) continue;
      for (let q = c + 1; q < m; q++) { const k = A[q][c] / A[c][c]; for (let z = c; z <= m; z++) A[q][z] -= k * A[c][z]; }
    }
    const b = new Float64Array(m);
    for (let c = m - 1; c >= 0; c--) { let v = A[c][m]; for (let z = c + 1; z < m; z++) v -= A[c][z] * b[z]; b[c] = Math.abs(A[c][c]) < 1e-12 ? 0 : v / A[c][c]; }
    let ss = 0;
    for (let i = 0; i < n; i++) { let y = 0; for (let j = 0; j < m; j++) y += b[j] * cols[j](t[i]); ss += (x[i] - y) ** 2; }
    const sigma = Math.sqrt(ss / Math.max(1, n - m)), noise = sigma * Math.sqrt(Math.PI / n); // typical amplitude of pure noise
    return freqs.map((f, k) => { const a = Math.hypot(b[2 + 4 * k], b[3 + 4 * k]); return { a, step: a * Math.PI / 2, snr: a / noise, noise }; });
  }

  const api = { fitJoint, detrend, amplitude, spectrum, noiseFloor, findPeak, analyze };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Flicker = api;
})(typeof window !== 'undefined' ? window : globalThis);
