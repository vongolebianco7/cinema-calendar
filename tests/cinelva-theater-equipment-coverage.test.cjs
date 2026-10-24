const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const formats = require('../data/theater_formats.json');
function equipmentContext() {
  const html = fs.readFileSync('theaters.html', 'utf8');
  const script = html.match(/<script id="cinemap-theater-table-js-v1">([\s\S]*?)<\/script>/)[1];
  // Evaluate the actual matcher definitions without wiring DOM listeners/rendering.
  const definitions = script.slice(0, script.indexOf(' function rowHtml(t)')) + '\n})();';
  const context = {window: {}, formatData: formats};
  vm.runInNewContext(definitions, context);
  return context.window;
}
test('Kanagawa IMAX equipment includes all five sourced venues, including the temporarily suspended Burg screen', () => {
  const {equipmentTheaters} = equipmentContext();
  const rows = equipmentTheaters([], 'IMAX').filter(x => x.prefecture === '神奈川県');
  assert.deepEqual(Array.from(rows, x => x.name).sort(), ['109シネマズ川崎', '109シネマズ湘南', '109シネマズゆめが丘', 'TOHOシネマズ ららぽーと横浜', '横浜ブルク13'].sort());
  const burg = rows.find(x => x.name === '横浜ブルク13');
  assert.match(burg._equipmentRows.find(x => x.format === 'IMAX').status_note, /休止/);
  assert.equal(equipmentTheaters([], 'IMAXレーザー').filter(x => x.prefecture === '神奈川県').length, 3);
});
test('verified equipment geography survives an incomplete directory match and retains every equipment family', () => {
  const {equipmentTheaters} = equipmentContext();
  const rows = equipmentTheaters([{name: '横浜ブルク13', prefecture: '横浜市', website: 'https://tjoy.jp/yokohama_burg13'}], 'IMAX');
  const burg = rows.find(x => x.name === '横浜ブルク13');
  assert.equal(burg.prefecture, '神奈川県');
  assert.equal(burg.website, 'https://tjoy.jp/yokohama_burg13');
  assert.ok(burg._equipmentRows.some(x => x.format === 'SCREENX'));
  assert.ok(burg._equipmentRows.some(x => x.format === 'Dolby Atmos'));
});
