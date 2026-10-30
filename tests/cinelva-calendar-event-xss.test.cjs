const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
function functionSource(name, nextName) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must be present`);
  const end = html.indexOf(`\nfunction ${nextName}(`, start + 1);
  assert.notEqual(end, -1, `${nextName} must follow ${name}`);
  return html.slice(start, end);
}

test('calendar chip labels render external service names as text', () => {
  const nodes = new Map();
  const $ = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', textContent: '' });
    return nodes.get(selector);
  };
  const context = {
    mode: 'streaming', active: 'すべて', movies: [{ event: 'streaming', service: '<img src=x onerror=alert(1)>' }],
    STREAMING_SERVICES: [], Set, $,
    document: { querySelectorAll: () => [] },
  };
  vm.runInNewContext(functionSource('esc', 'safeCalendarUrl') + '\n' + functionSource('safeCalendarUrl', 'renderChips') + '\n' + functionSource('streamingReleaseServices', 'renderChips') + '\n' + functionSource('renderChips', 'cinelvaCastLinks') + '\n;renderChips();', context);
  const output = nodes.get('#chips').innerHTML;
  assert.ok(!output.includes('<img src=x onerror=alert(1)>'));
  assert.ok(output.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('calendar event content is escaped and only HTTPS links become active', () => {
  const nodes = new Map();
  const $ = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', textContent: '' });
    return nodes.get(selector);
  };
  const payload = '<svg onload=alert(1)>';
  const context = {
    Date, URL, encodeURIComponent, mode: 'festival', active: 'すべて', view: new Date(2026, 9, 15),
    outdoorEvents: [],
    festivalEvents: [{
      title: payload, service: '国内イベント', date: '2026-10-20', end_date: '2026-10-21',
      venue: '<img src=x onerror=alert(2)>', overview: payload,
      source_url: 'javascript:alert(3)', visual_url: 'https://example.test/event.jpg',
      trailer_url: 'javascript:alert(4)',
    }, {
      title: '安心イベント', service: '国内イベント', date: '2026-10-20',
      source_url: 'https://example.test/source',
    }],
    document: {
      querySelector: () => ({ classList: { add() {}, remove() {} } }),
      querySelectorAll: () => [],
    },
    $, monthPageStart: () => new Date(2026, 8, 28), monthPageWeekCount: () => 5,
    sameDay: () => false, currentWeekStart: () => new Date(2026, 8, 28), dayColorClass: () => '',
    festivalAwardOrg: () => null, mountCalendarOutdoorReviews() {}, openMovie() {},
  };
  vm.runInNewContext(functionSource('esc', 'safeCalendarUrl') + '\n' + functionSource('safeCalendarUrl', 'renderChips') + '\n' + functionSource('renderOutdoorCalendar', 'renderCal') + '\n;renderOutdoorCalendar();', context);
  const output = nodes.get('#dates').innerHTML;
  assert.ok(!output.includes(payload));
  assert.ok(!output.includes('<img src=x onerror=alert(2)>'));
  assert.ok(output.includes('&lt;svg onload=alert(1)&gt;'));
  assert.ok(!output.includes('href="javascript:'));
  assert.ok(!output.includes('src="javascript:'));
  assert.ok(output.includes('href="https://example.test/'));
  assert.ok(output.includes('src="https://example.test/event.jpg"'));
});
