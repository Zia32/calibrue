// Calibrue M4: build an ICC v2.4 display profile from the measured correction ramps.
// The 'vcgt' tag carries the ramps; Windows loads it into the graphics card when
// "Use Windows display calibration" is on. After that the screen behaves as gamma 2.2,
// so the profile's tone curves are plain 2.2 and its primaries come from EDID (or sRGB).
// Browser: window.ICC. Node: module.exports (for tests).
(function (root) {
  const SRGB = { red: [0.64, 0.33], green: [0.30, 0.60], blue: [0.15, 0.06], white: [0.3127, 0.3290] };
  const D50 = [0.9642, 1.0, 0.8249];

  // ---- small matrix helpers (3×3, row-major arrays of rows) ----
  const mul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
  const mulv = (A, v) => A.map(r => r.reduce((s, x, k) => s + x * v[k], 0));
  function inv(m) {
    const [a, b, c] = m[0], [d, e, f] = m[1], [g, h, i] = m[2];
    const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
    return [[A, -(b * i - c * h), b * f - c * e], [B, a * i - c * g, -(a * f - c * d)], [C, -(a * h - b * g), a * e - b * d]].map(r => r.map(x => x / det));
  }
  const xyz = ([x, y]) => [x / y, 1, (1 - x - y) / y];

  // Colorants (XYZ of full red, green, blue) adapted to D50 with Bradford, and the white point.
  function colorants(prim = SRGB) {
    const P = [xyz(prim.red), xyz(prim.green), xyz(prim.blue)];
    const M = [[P[0][0], P[1][0], P[2][0]], [P[0][1], P[1][1], P[2][1]], [P[0][2], P[1][2], P[2][2]]];
    const W = xyz(prim.white), S = mulv(inv(M), W);
    const cols = [0, 1, 2].map(j => [M[0][j] * S[j], M[1][j] * S[j], M[2][j] * S[j]]);
    const BF = [[0.8951, 0.2664, -0.1614], [-0.7502, 1.7135, 0.0367], [0.0389, -0.0685, 1.0296]];
    const s = mulv(BF, W), d = mulv(BF, D50);
    const A = mul(mul(inv(BF), [[d[0] / s[0], 0, 0], [0, d[1] / s[1], 0], [0, 0, d[2] / s[2]]]), BF);
    return { red: mulv(A, cols[0]), green: mulv(A, cols[1]), blue: mulv(A, cols[2]), white: W };
  }

  // ---- binary writer (ICC is big-endian) ----
  function writer() {
    const bytes = [];
    const w = {
      u8: v => bytes.push(v & 255),
      u16: v => { w.u8(v >> 8); w.u8(v); },
      u32: v => { w.u16(Math.floor(v / 65536)); w.u16(v % 65536); },
      s15: v => { let n = Math.round(v * 65536); if (n < 0) n += 2 ** 32; w.u32(n); },
      sig: s => { for (let i = 0; i < 4; i++) w.u8(s.charCodeAt(i)); },
      ascii: s => { for (const ch of s) w.u8(ch.charCodeAt(0) < 128 ? ch.charCodeAt(0) : 63); },
      zeros: n => { for (let i = 0; i < n; i++) w.u8(0); },
      pad4: () => { while (bytes.length % 4) w.u8(0); },
      bytes,
    };
    return w;
  }
  function tag(build) { const w = writer(); build(w); w.pad4(); return w.bytes; }
  const desc = text => tag(w => { // textDescriptionType (v2)
    w.sig('desc'); w.zeros(4); w.u32(text.length + 1); w.ascii(text); w.u8(0);
    w.u32(0); w.u32(0); w.u16(0); w.u8(0); w.zeros(67);
  });
  const text = s => tag(w => { w.sig('text'); w.zeros(4); w.ascii(s); w.u8(0); });
  const XYZ = v => tag(w => { w.sig('XYZ '); w.zeros(4); v.forEach(w.s15); });
  const curvGamma = g => tag(w => { w.sig('curv'); w.zeros(4); w.u32(1); w.u16(Math.round(g * 256)); });
  const vcgt = ramps => tag(w => { // Apple/Microsoft video card gamma table: 3 channels × 256 × 16-bit
    w.sig('vcgt'); w.zeros(4); w.u32(0); w.u16(3); w.u16(256); w.u16(2);
    for (const c of ['red', 'green', 'blue']) for (let i = 0; i < 256; i++) w.u16(Math.max(0, Math.min(65535, Math.round(ramps[c][i]))));
  });

  // Build the profile. ramps: {red,green,blue: 256 numbers 0–65535}. Returns Uint8Array.
  function build({ ramps, primaries = SRGB, name = 'Calibrue', copyright = 'Created with Calibrue', gamma = 2.2, date = new Date() }) {
    const col = colorants(primaries);
    const trc = curvGamma(gamma);
    const tags = [
      ['desc', desc(name)], ['cprt', text(copyright)], ['wtpt', XYZ(col.white)],
      ['rXYZ', XYZ(col.red)], ['gXYZ', XYZ(col.green)], ['bXYZ', XYZ(col.blue)],
      ['rTRC', trc], ['gTRC', trc], ['bTRC', trc], ['vcgt', vcgt(ramps)],
    ];
    const tableLen = 4 + 12 * tags.length;
    let off = 128 + tableLen;
    const entries = [], seen = new Map();
    for (const [sig, data] of tags) { // identical tag data (the three TRCs) is stored once and shared
      if (seen.has(data)) { entries.push([sig, seen.get(data), data.length]); continue; }
      seen.set(data, off); entries.push([sig, off, data.length]); off += data.length;
    }
    const size = off;
    const w = writer();
    w.u32(size); w.u32(0); w.u32(0x02400000); w.sig('mntr'); w.sig('RGB '); w.sig('XYZ ');
    [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()].forEach(w.u16);
    w.sig('acsp'); w.sig('MSFT'); w.u32(0); w.u32(0); w.u32(0); w.zeros(8); w.u32(0);
    D50.forEach(w.s15); w.sig('CLBR'); w.zeros(16); w.zeros(28);
    w.u32(tags.length);
    for (const [sig, o, n] of entries) { w.sig(sig); w.u32(o); w.u32(n); }
    const written = new Set();
    for (const [, data] of tags) { if (written.has(data)) continue; written.add(data); data.forEach(b => w.u8(b)); }
    return new Uint8Array(w.bytes);
  }

  // EDID colour data as printed by the PowerShell command on the profile page: lines like
  // "Red 169 84". Windows reports these as integers whose scale varies (seen: /256; EDID itself
  // stores /1024), so pick the scale that puts the white point near daylight. Decimal input
  // ("x=0.6406 y=0.3301", comma or point) is used as is. Returns null unless the result is a
  // plausible display: red mostly red, green mostly green, blue mostly blue, white near D65.
  function parseEdid(textIn) {
    const raw = {};
    for (const line of String(textIn).split(/\r?\n/)) {
      const m = line.match(/\b(Red|Green|Blue|DefaultWhite|White)\b\D*?([\d.,]+)\D+?([\d.,]+)/i);
      if (!m) continue;
      const k = m[1].toLowerCase().replace('defaultwhite', 'white');
      raw[k] = [parseFloat(m[2].replace(',', '.')), parseFloat(m[3].replace(',', '.'))];
    }
    if (!['red', 'green', 'blue', 'white'].every(k => raw[k] && raw[k].every(Number.isFinite))) return null;
    const decimal = Object.values(raw).every(([x, y]) => x < 1 && y < 1);
    const scales = decimal ? [1] : [256, 1024, 1000, 255];
    for (const sc of scales) {
      const p = {};
      for (const k in raw) p[k] = [raw[k][0] / sc, raw[k][1] / sc];
      if (plausible(p)) return { ...p, scale: sc };
    }
    return null;
  }
  function plausible(p) {
    const [wx, wy] = p.white;
    return wx > 0.27 && wx < 0.36 && wy > 0.28 && wy < 0.38 &&
      p.red[0] > 0.55 && p.red[1] > 0.25 && p.red[1] < 0.38 &&
      p.green[1] > 0.5 && p.green[0] > 0.15 && p.green[0] < 0.4 &&
      p.blue[1] < 0.2 && p.blue[0] > 0.1 && p.blue[0] < 0.2 &&
      ['red', 'green', 'blue', 'white'].every(k => p[k][0] + p[k][1] < 1);
  }
  const isSrgbLike = p => ['red', 'green', 'blue', 'white'].every(k => Math.hypot(p[k][0] - SRGB[k][0], p[k][1] - SRGB[k][1]) < (p.scale === 256 ? 0.006 : 0.004));

  // Gamut area relative to sRGB and P3 in CIE 1976 u'v' (a common way to quote coverage size).
  const uv = ([x, y]) => { const d = -2 * x + 12 * y + 3; return [4 * x / d, 9 * y / d]; };
  const area = p => { const [a, b, c] = ['red', 'green', 'blue'].map(k => uv(p[k])); return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2; };
  const P3 = { red: [0.680, 0.320], green: [0.265, 0.690], blue: [0.150, 0.060], white: [0.3127, 0.3290] };
  const gamutSize = p => ({ vsSrgb: area(p) / area(SRGB), vsP3: area(p) / area(P3) });

  const api = { SRGB, P3, colorants, build, parseEdid, isSrgbLike, gamutSize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ICC = api;
})(typeof window !== 'undefined' ? window : globalThis);
