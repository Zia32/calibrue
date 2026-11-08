// ICC profile structure against ICC.1:2001-04 (v2.4) and the Apple vcgt tag format.
// Expected bytes come from those specs; the profile is parsed independently here.
const test = require('node:test');
const assert = require('node:assert/strict');
const ICC = require('../icc.js');

const identity = Array.from({ length: 256 }, (_, i) => Math.round(i / 255 * 65535));
const ramps = { red: identity, green: identity.map(x => Math.round(x * 0.9)), blue: identity };
const bytes = ICC.build({ ramps, name: 'Test', date: new Date(Date.UTC(2026, 0, 2, 3, 4, 5)) });
const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
const sig = o => String.fromCharCode(...bytes.slice(o, o + 4));
const u32 = o => dv.getUint32(o), u16 = o => dv.getUint16(o);
const tags = (() => { const n = u32(128), t = {}; for (let i = 0; i < n; i++) { const o = 132 + 12 * i; t[sig(o)] = { off: u32(o + 4), len: u32(o + 8) }; } return t; })();

// ICC.1:2001-04 §6.1 profile header.
test('header follows ICC.1 v2.4', () => {
  assert.equal(u32(0), bytes.length, 'profile size field (bytes 0–3) equals file length');
  assert.equal(u32(8), 0x02400000, 'version 2.4.0 (bytes 8–11)');
  assert.equal(sig(12), 'mntr', 'device class: display');
  assert.equal(sig(16), 'RGB ', 'data colour space');
  assert.equal(sig(20), 'XYZ ', 'PCS');
  assert.equal(sig(36), 'acsp', 'file signature');
  // §6.1.13 PCS illuminant D50 as s15Fixed16: 0x0000F6D6, 0x00010000, 0x0000D32D.
  assert.equal(u32(68), 0x0000F6D6); assert.equal(u32(72), 0x00010000); assert.equal(u32(76), 0x0000D32D);
  assert.equal(u16(24), 2026); assert.equal(u16(26), 1); assert.equal(u16(28), 2); // §5.1.1 dateTimeNumber (UTC)
});

// ICC.1:2001-04 §6.3: required tags for a three-component matrix-based display profile,
// every tag starts on a 4-byte boundary and lies inside the file.
test('required tags present, aligned and inside the file', () => {
  for (const t of ['desc', 'cprt', 'wtpt', 'rXYZ', 'gXYZ', 'bXYZ', 'rTRC', 'gTRC', 'bTRC']) assert.ok(tags[t], `missing ${t}`);
  for (const [k, { off, len }] of Object.entries(tags)) {
    assert.equal(off % 4, 0, `${k} offset aligned`);
    assert.ok(off >= 128 + 4 + 12 * Object.keys(tags).length && off + len <= bytes.length, `${k} inside file`);
  }
});

// ICC.1 §6.5.3 curveType with count 1 = gamma as u8Fixed8Number; 2.2 is encoded 0x0233 (2 + 51/256).
test('TRC is gamma 2.2 (curv, u8Fixed8 0x0233)', () => {
  for (const t of ['rTRC', 'gTRC', 'bTRC']) {
    const o = tags[t].off;
    assert.equal(sig(o), 'curv'); assert.equal(u32(o + 8), 1); assert.equal(u16(o + 12), 0x0233);
  }
});

// ICC.1 §5.1.3 s15Fixed16Number (1.0 = 0x00010000); §6.5.26 XYZType. rXYZ of sRGB per the
// sRGB IEC61966-2.1 reference profile: 0.4361 0.2225 0.0139.
test('rXYZ stored as s15Fixed16 matches the sRGB reference profile', () => {
  const o = tags.rXYZ.off, s15 = k => dv.getInt32(o + 8 + 4 * k) / 65536;
  assert.equal(sig(o), 'XYZ ');
  [0.4361, 0.2225, 0.0139].forEach((w, k) => assert.ok(Math.abs(s15(k) - w) <= 2e-4, `rXYZ[${k}] ${s15(k)} vs ${w}`));
});

// Apple ColorSync 'vcgt' (also read by Windows): type sig, 4 reserved, u32 gammaType 0 = table,
// u16 channels, u16 entryCount, u16 entrySize (bytes), then channel tables big-endian.
test('vcgt carries the ramps as a 3 × 256 × 16-bit table', () => {
  const o = tags.vcgt.off;
  assert.equal(sig(o), 'vcgt'); assert.equal(u32(o + 8), 0); assert.equal(u16(o + 12), 3); assert.equal(u16(o + 14), 256); assert.equal(u16(o + 16), 2);
  const at = (c, i) => u16(o + 18 + 2 * (256 * c + i));
  assert.equal(at(0, 0), 0); assert.equal(at(0, 255), 65535); assert.equal(at(1, 255), Math.round(65535 * 0.9)); assert.equal(at(2, 128), ramps.blue[128]);
  assert.ok(o + 18 + 3 * 256 * 2 <= bytes.length);
});

// VESA E-EDID 1.4 §3.7: chromaticity coordinates are 10-bit binary fractions (value / 1024).
// sRGB primaries encoded that way: red 655/338, green 307/614, blue 154/61, white 320/337.
test('EDID 10-bit chromaticities (/1024) are read as sRGB', () => {
  const p = ICC.parseEdid('Red 655 338\nGreen 307 614\nBlue 154 61\nDefaultWhite 320 337');
  assert.ok(p, 'parsed'); assert.equal(p.scale, 1024);
  assert.ok(Math.abs(p.red[0] - 0.64) < 0.001 && Math.abs(p.white[1] - 0.329) < 0.001);
  assert.ok(ICC.isSrgbLike(p));
});
