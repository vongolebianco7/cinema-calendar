const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createBookmarkPage(initialBookmarks = null) {
  const values = new Map();
  if (initialBookmarks) values.set('cinelva-want-to-watch-v1', JSON.stringify(initialBookmarks));
  const listeners = new Map();
  const section = { hidden: true };
  function node(tag) {
    return {tagName:tag, children:[], attributes:{}, handlers:{},
      append(...nodes) {for(const item of nodes){if(item.parentNode)item.parentNode.children=item.parentNode.children.filter(child=>child!==item);item.parentNode=this;this.children.push(item)}},
      before(item) {const parent=this.parentNode;assert.ok(parent,'before requires an attached reference node');if(item.parentNode)item.parentNode.children=item.parentNode.children.filter(child=>child!==item);item.parentNode=parent;parent.children.splice(parent.children.indexOf(this),0,item)},
      replaceChildren(...nodes) {for(const child of this.children)child.parentNode=null;this.children=[];this.append(...nodes)},
      setAttribute(name,value) {this.attributes[name]=value},
      addEventListener(name,callback) {this.handlers[name]=callback},
    };
  }
  const list=node('div'),panel=node('div');panel.append(list);
  const count = { textContent: '' };
  const document = {
    getElementById(id) { return ({ wantToWatchSection: section, wantWatchList: list, wantWatchCount: count })[id]; },
    createElement:node,
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
  return { values, listeners, section, list, count, panel };
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

test('watchlist sort control changes visible order without rewriting bookmarks',()=>{
 const page=createBookmarkPage({1:{id:1,title:'B',year:2020},2:{id:2,title:'A',year:2024}});
 const original=page.values.get('cinelva-want-to-watch-v1');
 const toolbar=page.panel.children[0],select=toolbar.children[1];
 assert.equal(page.panel.children[1],page.list,'toolbar is inserted before the saved-film list');
 assert.equal(select.id,'wantWatchSort');assert.equal(select.children.length,5);
 select.value='title';select.handlers.change();
 assert.equal(page.list.children[0].children[0].children[1].textContent,'A');
 select.value='releaseOld';select.handlers.change();
 assert.equal(page.list.children[0].children[0].children[1].textContent,'B');
 assert.equal(page.values.get('cinelva-want-to-watch-v1'),original);
});
