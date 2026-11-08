// German templates: the dictionary text around "{}" must match literally, even when it holds
// regex metacharacters (. ( ) ?). Expected German comes from the fixed dictionary in i18n.js.
const test = require('node:test');
const assert = require('node:assert/strict');

// i18n.js is a browser script; give it just enough of a browser, set to German.
global.window = {};
global.location = { search: '?lang=de' };
global.localStorage = { getItem: () => 'de', setItem() {} };
global.navigator = { language: 'de-DE' };
global.document = { readyState: 'loading', addEventListener() {} };
require('../i18n.js');
const tr = window.I18N.tr;

test('template with ( ) and . matches and keeps the value', () => {
  // key: 'Done, but the screen changed during the measurement ({} levels).'
  assert.equal(tr('Done, but the screen changed during the measurement (1.4 levels).'),
    'Fertig, aber der Bildschirm hat sich während der Messung verändert (1.4 Stufen).');
});

test('template with ? matches, and its values are translated too', () => {
  // key: '{}: is level {} visible?'; 'Shadows' is itself a dictionary entry
  assert.equal(tr('Shadows: is level 3 visible?'), 'Schatten: Ist Stufe 3 sichtbar?');
});

test('metacharacters only match themselves', () => {
  // unescaped, "(" ")" would be a group, "." any character and "e?" an optional "e"
  for (const s of ['Done, but the screen changed during the measurement X1.4 levelsY.',
                   'Done, but the screen changed during the measurement (1.4 levels)!',
                   'Shadows: is level 3 visibl']) assert.equal(tr(s), s, s);
});

test('several sentences are translated one by one', () => {
  assert.equal(tr('Pattern check 2 of 4: 2×2 checker. About 3 min left.'),
    'Musterprüfung 2 von 4: 2×2-Schachbrett. Noch etwa 3 Min.');
});
