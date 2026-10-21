const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function editor(initialDate, existing = true, identity = {}) {
  const storage = new Map();
  const context = vm.createContext({ localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } });
  vm.runInContext(fs.readFileSync('js/cinelva-library-records.js', 'utf8'), context);
  const Records = context.CinelvaLibraryRecords;
  if (existing) Records.save({ id: 123, title: '日付精度テスト', comment: '元の感想', ...identity }, 4, initialDate);
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '', attributes: {}, setAttribute(k,v){this.attributes[k]=String(v)}, getAttribute(k){return this.attributes[k]??null} });
    return nodes.get(id);
  };
  Object.assign(context, {
    Records,
    allRecords:()=>Records.all(),
    canonicalId:m=>m.tmdbId??m.tmdb_id??m.id,
    $: element,
    validId: id => /^[1-9]\d*$/.test(String(id)),
    syncDialogScore() {},
    syncViewingVenue() {},
    closeDatePicker() {},
    dateInput: element('cinelvaRateDate'),
    dateTrigger: element('dateTrigger'),
    dialog: { open: false, showModal() { this.open = true; }, close() { this.open = false; } },
    root: { dispatchEvent() {} },
    CustomEvent: class {},
  });
  const source = fs.readFileSync('js/cinelva-quick-rate.js', 'utf8');
  const actions = source.slice(source.indexOf('function viewingRecord(movie)'), source.indexOf("$('cinelvaRateSave').onclick=save;"));
  vm.runInContext('let selected;\n' + actions + '\nglobalThis.actions={open,save};', context);
  context.actions.open({ id: 123, title: '日付精度テスト', ...(existing&&!identity.tmdbId&&!identity.tmdb_id?{_localRecord:true}:{}) });
  return { Records, element, actions: context.actions, dialog: context.dialog, context };
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
  element('cinelvaRateScore').value = '4.5';
  element('cinelvaRateDate').value = '2024-05-06';
  actions.save();
  assert.equal(Records.all()[0].watchedAt, '2024-05-06');
});

test('a new rating defaults to today in the local timezone', () => {
  const { Records, element, actions } = editor(null, false);
  const today=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  assert.equal(element('cinelvaRateDate').value, today);
  element('cinelvaRateScore').value = '4.5';
  element('cinelvaRateComment').value = '日付不明の感想';
  actions.save();
  assert.equal(Records.all()[0].watchedAt, today);
  assert.equal(Records.all()[0].rating, 4.5);
  assert.equal(Records.all()[0].comment, '日付不明の感想');
});

test('a new review stores a viewing date only when explicitly selected', () => {
  const { Records, element, actions } = editor(null, false);
  element('cinelvaRateScore').value = '4.5';
  element('cinelvaRateDate').value = '2024-05-06';
  actions.save();
  assert.equal(Records.all()[0].watchedAt, '2024-05-06');
});


for (const field of ['tmdbId', 'tmdb_id']) {
  test(`shared editor updates an imported ${field} record without duplicating it`, () => {
    const { Records, element, actions } = editor('2024', true, { id: 321, [field]: 123 });
    element('cinelvaRateScore').value = '4.5';
    actions.save();
    const rows = Records.all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, '321');
    assert.equal(rows[0].watchedAt, '2024');
    assert.equal(rows[0].rating, 4.5);
    assert.equal(rows[0].comment, '元の感想');
  });

  test(`shared card review updates the imported ${field} record and preserves its date`, () => {
    const { Records, context } = editor('2024', true, { id: 321, [field]: 123 });
    // The removed list gauge is replaced by the same shared dialog for imported IDs.
    context.actions.open({id:123,title:'日付精度テスト'});
    context.$('cinelvaRateScore').value='4.5';
    context.actions.save();
    const rows = Records.all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, '321');
    assert.equal(rows[0].rating, 4.5);
    assert.equal(rows[0].watchedAt, '2024');
    assert.equal(rows[0].comment, '元の感想');
  });
}


test('a conflicting local ID never replaces another imported film', () => {
  const { Records, actions, element } = editor('2024', true, { id: 123, tmdbId: 999 });
  element('cinelvaRateScore').value='4.5';
  actions.save();
  const rows = Records.all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].tmdbId, 999);
  assert.equal(rows[0].rating, 4);
  assert.equal(rows[0].watchedAt, '2024');
  assert.match(element('cinelvaRateMessage').textContent, /別の作品/);
});

test('editing an unmapped imported storage ID never invents a TMDB identity', () => {
 const {Records,actions,element}=editor('2024',true);
 actions.open({id:123,title:'日付精度テスト',_localRecord:true});
 element('cinelvaRateScore').value='4.5';actions.save();
 assert.equal(Records.all()[0].rating,4.5);
 assert.equal(Records.all()[0].tmdbId,undefined);
});

test('a canonical movie never overwrites an occupied unmapped storage ID', () => {
 const {Records,actions,element}=editor('2024',true);
 actions.open({id:123,tmdbId:123,title:'Different canonical film',year:2020});
 element('cinelvaRateScore').value='4.5';actions.save();
 assert.equal(Records.all()[0].title,'日付精度テスト');
 assert.equal(Records.all()[0].rating,4);
 assert.equal(Records.all()[0].tmdbId,undefined);
 assert.match(element('cinelvaRateMessage').textContent,/別の作品/);
});

for(const legacy of [false,true])test(`unmapped ${legacy?'legacy':'current'} collision cannot be removed by zero or overwritten`,()=>{
 const {Records,actions,element,context}=editor('2024',true);
 if(legacy){const rows=Records.all();context.localStorage.setItem(Records.KEY,'{}');context.localStorage.setItem(Records.LEGACY,JSON.stringify(Object.fromEntries(rows.map(r=>[r.id,r]))));}
 actions.open({id:123,tmdbId:123,title:'Different canonical film',year:2020});
 element('cinelvaRateScore').value='0';actions.save();
 assert.equal(Records.all().length,1);assert.equal(Records.all()[0].title,'日付精度テスト');
 actions.open({id:123,tmdbId:123,title:'Different canonical film',year:2020});
 element('cinelvaRateScore').value='4.5';actions.save();
 assert.equal(Records.all()[0].title,'日付精度テスト');assert.equal(Records.all()[0].tmdbId,undefined);
});

test('a uniquely resolved imported record edits and clears its original storage key',()=>{
 const {Records,element,actions,context}=editor('2024',true,{id:9001,year:2000});
 context.root.CinelvaMovieIdentity={id:m=>Number(m?.tmdbId||0),resolve:m=>m.title==='日付精度テスト'&&m.year===2000?{tmdbId:123}:null};
 actions.open({id:123,tmdbId:123,title:'日付精度テスト',year:2000});
 assert.equal(Number(element('cinelvaRateScore').value),4,'resolved record must open its saved score');
 element('cinelvaRateScore').value='4.6';actions.save();
 assert.equal(Records.all().length,1,'editing must not duplicate the imported record');
 assert.equal(Records.all()[0].id,'9001');
 assert.equal(Records.all()[0].rating,4.6);
 actions.open({id:123,tmdbId:123,title:'日付精度テスト',year:2000});
 element('cinelvaRateScore').value='0';actions.save();
 assert.equal(Records.all().length,0,'zero clears the actual imported storage key');
});
