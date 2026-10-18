const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createBookmarkPage(initialBookmarks = null) {
  const values = new Map();
  if (initialBookmarks) values.set('cinelva-want-to-watch-v1', JSON.stringify(initialBookmarks));
  const listeners = new Map();
  const section = { open: false };
  const list = { children: [], replaceChildren() { this.children = []; }, append(node) { this.children.push(node); } };
  const count = { textContent: '' };
  const document = {
    getElementById(id) { return ({ wantToWatchSection: section, wantWatchList: list, wantWatchCount: count })[id]; },
    createElement(tag) {
      return {
        tagName: tag,
        children: [],
        attributes: {},
        append(node) { this.children.push(node); },
        setAttribute(name, value) { this.attributes[name] = value; },
      };
    },
  };
  const window = { addEventListener(name, callback) { listeners.set(name, callback); } };
  const localStorage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
  const html = fs.readFileSync('my-cinelva/index.html', 'utf8');
  const widget = html.match(/<script>\s*\(\(\)=>\{'use strict';[\s\S]*?cinelva-want-to-watch-v1[\s\S]*?<\/script>/)?.[0];
  assert.ok(widget, 'want-to-watch widget is present');
  vm.runInNewContext(widget.replace(/^<script>|<\/script>$/g, ''), { document, window, localStorage, encodeURIComponent });
  return { values, listeners, section, list, count };
}

test('adding a bookmarked film opens the visible want-to-watch list', () => {
  const page = createBookmarkPage();
  page.values.set('cinelva-want-to-watch-v1', JSON.stringify({ 42: { id: 42, title: '映画作品', savedAt: '2026-10-18T00:00:00Z' } }));

  page.listeners.get('cinelva-bookmarks-updated')({ detail: { id: '42', marked: true } });

  assert.equal(page.section.open, true);
  assert.equal(page.count.textContent, '1本');
  assert.equal(page.list.children[0].children[0].textContent, '映画作品');
});

test('existing wanted films are visible when My Cinelva opens', () => {
  const page = createBookmarkPage({ 42: { id: 42, title: '保存済み作品', savedAt: '2026-10-18T00:00:00Z' } });

  assert.equal(page.section.open, true);
  assert.equal(page.list.children[0].children[0].textContent, '保存済み作品');
});

test('removing a bookmark does not reopen a list the user collapsed', () => {
  const page = createBookmarkPage({ 42: { id: 42, title: '保存済み作品', savedAt: '2026-10-18T00:00:00Z' } });
  page.section.open = false;

  page.listeners.get('cinelva-bookmarks-updated')({ detail: { id: '42', marked: false } });

  assert.equal(page.section.open, false);
});

test('want-to-watch section uses direct Japanese wording', () => {
  const html = fs.readFileSync('my-cinelva/index.html', 'utf8');
  assert.match(html, /<summary>▣ 見たい映画/);
  assert.match(html, /見たい映画に追加した作品がここに表示されます/);
  const quickRate = fs.readFileSync('js/cinelva-quick-rate.js', 'utf8');
  assert.ok(quickRate.includes("detail:{id:key,marked:!marked}"), 'bookmark updates report when a film was added');
});
