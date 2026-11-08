// Colour conversions against published reference values. Run: node --test tests/
// Every expected number below is copied from the cited source, not computed by our code.
const test = require('node:test');
const assert = require('node:assert/strict');
const ICC = require('../icc.js');
const Calib = require('../calib.js');

const near = (got, want, tol, what) =>
  assert.ok(Math.abs(got - want) <= tol, `${what}: got ${got}, expected ${want} ± ${tol}`);

// IEC 61966-2-1:1999 (sRGB), Table 1 / §5: primaries and D65 white chromaticities.
test('sRGB primaries match IEC 61966-2-1', () => {
  assert.deepEqual(ICC.SRGB.red, [0.64, 0.33]);
  assert.deepEqual(ICC.SRGB.green, [0.30, 0.60]);
  assert.deepEqual(ICC.SRGB.blue, [0.15, 0.06]);
  assert.deepEqual(ICC.SRGB.white, [0.3127, 0.3290]);
});

// IEC 61966-2-1:1999 §5.2: D65 reference white XYZ = 0.9505, 1.0000, 1.0890 (4 decimals).
test('white point (D65) as XYZ matches IEC 61966-2-1', () => {
  const W = ICC.colorants(ICC.SRGB).white;
  near(W[0], 0.9505, 1e-4, 'X'); near(W[1], 1.0000, 1e-9, 'Y'); near(W[2], 1.0890, 1e-4, 'Z');
});

// sRGB colorants adapted to D50 with Bradford, as stored in the reference ICC profile
// "sRGB IEC61966-2.1" (HP/Microsoft, distributed with Windows as sRGB Color Space Profile.icm):
// rXYZ 0.4361 0.2225 0.0139, gXYZ 0.3851 0.7169 0.0971, bXYZ 0.1431 0.0606 0.7141.
// Same values (to 4 decimals) in Lindbloom, "RGB/XYZ Matrices", sRGB with Bradford-adapted D50.
test('sRGB colorants (Bradford to D50) match the sRGB IEC61966-2.1 ICC profile', () => {
  const c = ICC.colorants(ICC.SRGB), tol = 2e-4;
  [[c.red, [0.4361, 0.2225, 0.0139], 'red'], [c.green, [0.3851, 0.7169, 0.0971], 'green'], [c.blue, [0.1431, 0.0606, 0.7141], 'blue']]
    .forEach(([got, want, n]) => want.forEach((w, i) => near(got[i], w, tol, `${n} ${'XYZ'[i]}`)));
});

// ICC.1:2001-04 §6.1 and Annex: PCS illuminant D50 = X 0.9642, Y 1.0000, Z 0.8249.
// For a matrix/TRC profile the three colorants must add up to the PCS white.
test('colorants add up to the ICC D50 white', () => {
  const c = ICC.colorants(ICC.SRGB);
  const sum = [0, 1, 2].map(i => c.red[i] + c.green[i] + c.blue[i]);
  near(sum[0], 0.9642, 2e-4, 'X'); near(sum[1], 1.0000, 2e-4, 'Y'); near(sum[2], 0.8249, 2e-4, 'Z');
});

// CIE 15:2004 §8.2.1: L* = 116 (Y/Yn)^(1/3) − 16 above Y/Yn = 0.008856, else 903.3 · Y/Yn.
// Reference points: L*(1) = 100; L*(0) = 0; at the junction Y = 0.008856, L* = 8.0 from both branches.
// Middle grey: L* = 50 at Y = 0.1842 (Lindbloom, "CIE Color Calculator"; also Poynton, "Digital Video and HD", ch. on lightness).
test('L* matches CIE 15', () => {
  near(Calib.Lstar(1), 100, 1e-9, 'L*(1)');
  near(Calib.Lstar(0), 0, 1e-9, 'L*(0)');
  near(Calib.Lstar(0.008856), 8.0, 0.01, 'L* at junction');
  near(Calib.Lstar(0.1842), 50.0, 0.01, 'L* middle grey');
});

// Gamma 2.2 power law (IEC 61966-2-1 Annex / Windows' target): 50% light sits at code
// 255 · 0.5^(1/2.2) = 186.0 (the "186" of standard gamma charts, e.g. Norman Koren's gamma chart).
// A panel that is already gamma 2.2 therefore needs no correction: the ramp is the identity.
test('ramp is the identity for a gamma 2.2 panel', () => {
  const pts = [0.03125, 0.0625, 0.125, 0.25, 0.5, 0.75].map(F => ({ F, v: 255 * F ** (1 / 2.2) }));
  near(pts[4].v, 186.0, 0.1, 'code for 50% light at gamma 2.2');
  const r = Calib.ramp(pts, 2.2);
  for (const i of [0, 32, 64, 128, 186, 220, 255]) near(r[i], i / 255 * 65535, 66, `ramp[${i}]`); // 66 = 1/4 code
});

// Power law algebra: a panel with gamma 2.4 reaches light x^2.2 at output (x^(2.2/2.4)).
test('ramp corrects a gamma 2.4 panel to 2.2', () => {
  const pts = [0.03125, 0.0625, 0.125, 0.25, 0.5, 0.75].map(F => ({ F, v: 255 * F ** (1 / 2.4) }));
  const r = Calib.ramp(pts, 2.2);
  for (const i of [32, 64, 128, 192, 230]) near(r[i], 65535 * (i / 255) ** (2.2 / 2.4), 66, `ramp[${i}]`);
});
