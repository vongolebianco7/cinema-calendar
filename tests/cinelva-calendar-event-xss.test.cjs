const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
function functionSource(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must be present`);
  const next = html.slice(start).search(/\n(?:async )?function [\w$]+\s*\(/);
  return html.slice(start, next < 0 ? html.length : start + next);
}

test('calendar chip labels render external service names as text', () => {
  const nodes = new Map();
  const $ = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', textContent: '' });
    return nodes.get(selector);
  };
  const context = {
    mode: 'streaming', active: 'すべて', movies: [{ event: 'streaming', service: '<img src=x onerror=alert(1)>' }],
    STREAMING_SERVICES: [], Set, $, document: { querySelectorAll: () => [] },
  };
  vm.runInNewContext(functionSource('esc') + '\n' + functionSource('streamingReleaseServices') + '\n' + functionSource('renderChips') + '\n;renderChips();', context);
  const output = nodes.get('#chips').innerHTML;
  assert.ok(!output.includes('<img src=x onerror=alert(1)>'));
  assert.ok(output.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('festival calendar content is escaped and unsafe links are omitted', () => {
  const nodes = new Map();
  const el = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', textContent: '', classList: { add() {}, remove() {} } });
    return nodes.get(selector);
  };
  const payload = '<svg onload=alert(1)>';
  const context = {
    view: new Date(2026, 9, 15), active: 'すべて', outdoorEvents: [],
    festivalEvents: [{
      title: payload, service: '国内イベント', date: '2026-10-20', end_date: '2026-10-21',
      venue: '<img src=x onerror=alert(2)>', overview: payload,
      source_url: 'https://example.test/source', visual_url: 'https://example.test/event.jpg',
      trailer_url: 'javascript:alert(4)',
    }],
    document: { querySelector: el, querySelectorAll: () => [] }, $: el,
    monthPageStart: () => new Date(2026, 8, 28), monthPageWeekCount: () => 5,
    sameDay: () => false, currentWeekStart: () => new Date(2026, 8, 28), dayColorClass: () => '',
    festivalAwardOrg: () => null, mountCalendarOutdoorReviews() {}, openMovie() {},
    URL, Date, encodeURIComponent, window: {},
  };
  vm.runInNewContext(functionSource('esc') + '\n' + functionSource('safeCalendarUrl') + '\n' + functionSource('renderOutdoorCalendar') + '\n;renderOutdoorCalendar();', context);
  const output = nodes.get('#dates').innerHTML;
  assert.ok(!output.includes(payload));
  assert.ok(!output.includes('<img src=x onerror=alert(2)>'));
  assert.ok(output.includes('&lt;svg onload=alert(1)&gt;'));
  assert.ok(!output.includes('href="javascript:'));
  assert.ok(!output.includes('src="javascript:'));
  assert.ok(output.includes('href="https://example.test/'));
  assert.ok(output.includes('src="https://example.test/event.jpg"'));
});

test('festival detail escapes labels and only activates credential-free HTTPS URLs', () => {
  const nodes = new Map();
  const $ = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '' });
    return nodes.get(selector);
  };
  const context = {
    theaterExpanded: false, festivalAwardOrg: () => '', $, showModal() {},
    URL, encodeURIComponent,
  };
  vm.runInNewContext(functionSource('esc') + '\n' + functionSource('safeCalendarUrl') + '\n' + functionSource('openMovie') + `\n;openMovie({event:'festival',title:'<svg onload=alert(1)>',service:'<b>イベント</b>',venue:'<img src=x onerror=alert(2)>',overview:'<i>説明</i>',date:'2026-10-20',visual_url:'javascript:alert(3)',trailer_url:'https://user:pass@example.test/trailer',source_url:'javascript:alert(4)'});`, context);
  const output = nodes.get('#detail').innerHTML;
  assert.ok(!output.includes('<svg onload=alert(1)>'));
  assert.ok(!output.includes('<img src=x onerror=alert(2)>'));
  assert.ok(output.includes('&lt;svg onload=alert(1)&gt;'));
  assert.ok(!/\b(?:href|src)="(?:javascript:|https:\/\/user:)/i.test(output));
});
