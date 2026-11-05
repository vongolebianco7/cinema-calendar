const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
test('legacy concierge redirects stay within their document roots despite base href', () => {
  for (const file of ['agent.html', 'cinelva/agent.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const target = 'location.replace(new URL("./discover.html?mode=concierge",location.href).href)';
    assert.ok(html.includes(target), file + ' must resolve relative to the document URL');
    const expected = file.startsWith('cinelva/') ? '/cinelva/discover.html' : '/discover.html';
    assert.equal(new URL('./discover.html?mode=concierge', 'https://cinelva.example/' + file).pathname, expected);
  }
});
