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

  // Amplitude of the sine component at frequency f (Hz). t in seconds.
  function amplitude(t, x, f) {
    let c = 0, s = 0;
    const w = 2 * Math.PI * f;
    for (let i = 0; i < t.length; i++) { c += x[i] * Math.cos(w * t[i]); s += x[i] * Math.sin(w * t[i]); }
    return 2 * Math.hypot(c, s) / t.length;
  }

  // Spectrum on a fixed grid, below the camera's Nyquist limit.
  function spectrum(t, x, fps, lo = 1.5, step = 0.25) {
    const hi = Math.min(15, fps / 2 - 0.5);
    const fs = [], as = [];
    for (let f = lo; f <= hi + 1e-9; f += step) { fs.push(+f.toFixed(3)); as.push(amplitude(t, x, f)); }
    return { fs, as };
  }

  // Median amplitude away from f and its 2nd/3rd harmonics = noise floor.
  function noiseFloor(spec, f) {
    const vals = [];
    spec.fs.forEach((g, i) => {
      if ([1, 2, 3].some(h => Math.abs(g - h * f) < 0.8)) return;
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
  function analyze(t, raw, f, fps) {
    const x = detrend(t, raw);
    const a = amplitude(t, x, f);
    const spec = spectrum(t, x, fps);
    const noise = noiseFloor(spec, f);
    // A square wave with peak-to-peak D has a fundamental of amplitude 2D/π.
    return { a, step: a * Math.PI / 2, noise, snr: noise > 0 ? a / noise : NaN, spec };
  }

  const api = { detrend, amplitude, spectrum, noiseFloor, findPeak, analyze };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Flicker = api;
})(typeof window !== 'undefined' ? window : globalThis);
