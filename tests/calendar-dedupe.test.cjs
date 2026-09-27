const test = require('node:test');
const assert = require('node:assert/strict');
const { dedupe } = require('../js/calendar-dedupe.js');

test('one film listed twice for the same date and service appears once with a usable poster and ID', () => {
  const rows = [
    { title:'Mayday', date:'2026-09-04', event:'streaming',service:'Apple TV+',source_url:'https://example.org'},
    { id:123,title:'Mayday',date:'2026-09-04',event:'streaming',service:'Apple TV+',poster:'poster.jpg' }
  ];
  assert.deepEqual(dedupe(rows), [{id:123,title:'Mayday',date:'2026-09-04',event:'streaming',service:'Apple TV+',poster:'poster.jpg',source_url:'https://example.org'}]);
});

test('different dates or providers remain separate listings', () => {
  const rows=[{title:'366日',date:'2026-09-26',event:'streaming',service:'Hulu'}, {title:'366日',date:'2026-09-26',event:'streaming',service:'U-NEXT'}, {title:'366日',date:'2026-10-01',event:'streaming',service:'Hulu'}];
  assert.equal(dedupe(rows).length,3);
});

test('minor typography differences do not create duplicate cards', () => {
  const rows=[{title:'Perfume “コールドスリープ”',date:'2026-09-15',event:'streaming',service:'Disney+'},{title:'Perfume"コールドスリープ"',date:'2026-09-15',event:'streaming',service:'Disney+'}];
  assert.equal(dedupe(rows).length,1);
});

test('different films with the same title remain distinct when IDs disagree', () => {
  const rows=[{id:123,title:'同名作品',date:'2026-09-04',event:'theater',service:'劇場公開'}, {id:456,title:'同名作品',date:'2026-09-04',event:'theater',service:'劇場公開'}];
  assert.equal(dedupe(rows).length,2);
});
