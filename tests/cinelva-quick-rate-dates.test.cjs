const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function editor(initialDate, existing = true) {
  const storage = new Map();
  const context = vm.createContext({ localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } });
  vm.runInContext(fs.readFileSync('js/cinelva-library-records.js', 'utf8'), context);
  const Records = context.CinelvaLibraryRecords;
  if (existing) Records.save({ id: 123, title: '日付精度テスト', comment: '元の感想' }, 4, initialDate);
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '' });
    return nodes.get(id);
  };
  Object.assign(context, {
    Records,
    $: element,
    validId: id => /^[1-9]\d*$/.test(String(id)),
    syncDialogScore() {},
    closeDatePicker() {},
    dateInput: element('cinelvaRateDate'),
    dateTrigger: element('dateTrigger'),
    dialog: { open: false, showModal() { this.open = true; }, close() { this.open = false; } },
    root: { dispatchEvent() {} },
    CustomEvent: class {},
  });
  const source = fs.readFileSync('js/cinelva-quick-rate.js', 'utf8');
  const actions = source.slice(source.indexOf('function open(movie,'), source.indexOf("$('cinelvaRateSave').onclick=save;"));
  vm.runInContext('let selected;\n' + actions + '\nglobalThis.actions={open,save};', context);
  context.actions.open({ id: 123, title: '日付精度テスト' });
  return { Records, element, actions: context.actions, dialog: context.dialog };
}

for (const date of ['2024', '2024-03', null]) {
  test(`editing rating and comment preserves existing viewing date ${JSON.stringify(date)}`, () => {
    const { Records, element, actions, dialog } = editor(date);
    element('cinelvaRateScore').value = '4.5';
    element('cinelvaRateComment').value = '編集した感想';
    actions.save();
    const record = Records.all()[0];
    assert.equal(record.watchedAt, date, 'opening and saving must not invent a viewing day');
    assert.equal(record.rating, 4.5);
    assert.equal(record.comment, '編集した感想');
    assert.equal(dialog.open, false);
  });
}

test('choosing an explicit viewing day replaces a partial date', () => {
  const { Records, element, actions } = editor('2024');
  element('cinelvaRateDate').value = '2024-05-06';
  actions.save();
  assert.equal(Records.all()[0].watchedAt, '2024-05-06');
});

test('a new review still defaults to a valid complete viewing day', () => {
  const { Records, element, actions } = editor(null, false);
  assert.match(element('cinelvaRateDate').value, /^\d{4}-\d{2}-\d{2}$/);
  actions.save();
  assert.equal(Records.all()[0].watchedAt, element('cinelvaRateDate').value);
});
