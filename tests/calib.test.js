// Measurement maths on synthetic data with a known answer (the answer is chosen first, the
// data is generated from it, then our code must recover it).
const test = require('node:test');
const assert = require('node:assert/strict');
const Calib = require('../calib.js');
const Flicker = require('../analysis.js');

const near = (got, want, tol, what) => assert.ok(Math.abs(got - want) <= tol, `${what}: got ${got}, expected ${want} ± ${tol}`);

// Flicker-null model (README, "Measurement principle"): step = sqrt(G²(u(v)−u(v0))² + c²).
test('fitNull recovers a known null', () => {
  const v0 = 150.3, G = 400, c = 0.6, g = 2.2, u = v => (v / 255) ** g;
  const pts = [140, 144, 147, 150, 153, 156, 160].map(v => ({ v, step: Math.sqrt(G * G * (u(v) - u(v0)) ** 2 + c * c) }));
  near(Calib.fitNull(pts, g).v0, v0, 0.06, 'v0');
});

// DFT definition: x(t) = A sin(2πft + φ) has amplitude A at f, ~0 at another bin, on uneven frame times.
test('amplitude of a sine on uneven camera frames', () => {
  const t = [], x = []; let tt = 0;
  for (let i = 0; i < 240; i++) { tt += 1 / 30 + (i % 3 - 1) * 0.004; t.push(tt); x.push(3 * Math.sin(2 * Math.PI * 6 * tt + 0.4)); }
  near(Flicker.amplitude(t, x, 6), 3, 0.05, 'amplitude at 6 Hz');
  assert.ok(Flicker.amplitude(t, x, 9) < 0.1, 'leak at 9 Hz');
});

// Gains are relative: the largest channel stays at 1, so white never gets brighter than the panel can show.
test('white gains keep the largest channel at 1', () => {
  assert.equal(Calib.whiteOf({ t: 0, m: 0 }), null);
  for (const w of [{ t: 60, m: 0 }, { t: -40, m: 20 }, { gains: { red: 0.93, green: 0.97, blue: 1 }, t: 10, m: -5 }]) {
    const g = Calib.whiteOf(w);
    near(Math.max(g.red, g.green, g.blue), 1, 1e-12, 'max gain');
  }
});
