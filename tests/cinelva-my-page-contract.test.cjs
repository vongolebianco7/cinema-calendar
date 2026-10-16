const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const page = fs.readFileSync('my-cinelva/index.html', 'utf8');
const share = fs.readFileSync('my-cinemap.html', 'utf8');

test('My Cinelva is a real-record page without demo, collection, or Atlas controls', () => {
  assert.match(page, /cinelva-library-records\.js/);
  assert.match(page, /cinelva-records-page\.js/);
  assert.match(page, /映画の世界/);
  assert.match(page, /映画賞ヒートマップ/);
  assert.match(page, /監督のフィルモグラフィー/);
  assert.doesNotMatch(page, /デモ|コレクション|コレクションを作成|アトラス|Atlas/);
});

test('share image is generated only from existing viewing records', () => {
  assert.match(share, /cinelva-library-records\.js/);
  assert.match(share, /実績画像/);
  assert.doesNotMatch(share, /自由に作品を追加|映画棚を作成|コレクション/);
});
