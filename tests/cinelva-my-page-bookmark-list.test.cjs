const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createBookmarkPage(initialBookmarks = null) {
  const values = new Map();
  if (initialBookmarks) values.set('cinelva-want-to-watch-v1', JSON.stringify(initialBookmarks));
  const listeners = new Map();
  const section = { hidden: true };
  const list = { children: [], replaceChildren() { this.children = []; }, append(node) { this.children.push(node); } };
  const count = { textContent: '' };
  const document = {
    getElementById(id) { return ({ wantToWatchSection: section, wantWatchList: list, wantWatchCount: count })[id]; },
    createElement(tag) {
      return {
        tagName: tag,
        children: [],
        attributes: {},
        append(...nodes) { this.children.push(...nodes); },
        setAttribute(name, value) { this.attributes[name] = value; },
      };
    },
  };
  document.querySelector=()=>({addEventListener(){}});
  const window = { addEventListener(name, callback) { listeners.set(name, callback); } };
  const localStorage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
  const html = fs.readFileSync('my-cinelva/index.html', 'utf8');
  const widget = html.match(/<script id="cinelva-watchlist-tab">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(widget, 'independent watchlist tab renderer is present');
  vm.runInNewContext(widget, { document, window, localStorage, encodeURIComponent, URLSearchParams,
    fetch:async()=>({ok:true,json:async()=>({movies:[]})}) });
  return { values, listeners, section, list, count };
}

test('adding a bookmark refreshes the independent tab without opening the dashboard', () => {
  const page = createBookmarkPage();
  page.values.set('cinelva-want-to-watch-v1', JSON.stringify({ 42: { id: 42, title: '映画作品', savedAt: '2026-10-18T00:00:00Z' } }));

  page.listeners.get('cinelva-bookmarks-updated')({ detail: { id: '42', marked: true } });

  assert.equal(page.section.hidden, true);
  assert.equal(page.list.children[0].children[0].children[1].textContent, '映画作品');
});

test('existing wanted films are visible when My Cinelva opens', () => {
  const page = createBookmarkPage({ 42: { id: 42, title: '保存済み作品', savedAt: '2026-10-18T00:00:00Z' } });

  assert.equal(page.section.hidden, true);
  assert.equal(page.list.children[0].children[0].children[1].textContent, '保存済み作品');
});

test('removing a bookmark does not reopen a list the user collapsed', () => {
  const page = createBookmarkPage({ 42: { id: 42, title: '保存済み作品', savedAt: '2026-10-18T00:00:00Z' } });
  page.section.hidden = true;
  page.values.set('cinelva-want-to-watch-v1', '{}');

  page.listeners.get('cinelva-bookmarks-updated')({ detail: { id: '42', marked: false } });

  assert.equal(page.section.hidden, true);
  assert.match(page.list.children[0].textContent,/見たい映画はまだありません/);
});

test('want-to-watch section uses direct Japanese wording', () => {
  const html = fs.readFileSync('my-cinelva/index.html', 'utf8');
  assert.match(html, /data-tab="watchlist">見たい映画/);
  assert.match(html, /映画一覧のブックマークから追加できます/);
  const quickRate = fs.readFileSync('js/cinelva-quick-rate.js', 'utf8');
  assert.ok(quickRate.includes("detail:{id:key,marked:!marked}"), 'bookmark updates report when a film was added');
});
