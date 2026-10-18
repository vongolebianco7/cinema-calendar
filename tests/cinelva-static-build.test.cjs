const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const retiredRoutes = [
  'preview/ocean/index.html',
  'preview/ocean/ocean-demo.html',
  'preview/ocean/poc/index.html',
  'preview/ocean/real-fish/ecosystem.html',
  'preview/ocean/real-fish/index.html',
  'preview/ocean/real-fish/milestone-gallery.html',
  'preview/ocean/real-fish/ordinary-species-gallery.html',
  'preview/ocean/renderer/index.html',
];

test('production build omits retired Ocean payload while preserving legacy redirects and active files', t => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'cinelva-static-build-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const files = {
    'index.html': '<h1>CINELVA</h1>',
    'my-cinemap.html': '<h1>Records</h1>',
    'icon.png': 'icon',
    'logo.svg': '<svg/>',
    'site.webmanifest': '{}',
    'assets/poster.png': 'active poster',
    'js/cinelva-library-records.js': 'preserve saved keys',
    'data/movies.json': '{"movies":[]}',
    'my-cinelva/index.html': '<h1>My CINELVA</h1>',
    'preview/brand/index.html': '<h1>Existing preview</h1>',
    'preview/ocean/assets/texture.png': 'retired texture',
    'preview/ocean/renderer/runtime.js': 'retired renderer',
    'preview/ocean/poc/old-demo.html': '<h1>Retired demo</h1>',
  };
  for (const route of retiredRoutes) files[route] = fs.readFileSync(path.join(root, route), 'utf8');
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(fixture, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  fs.cpSync(path.join(root, 'scripts'), path.join(fixture, 'scripts'), { recursive: true });
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const result = spawnSync(config.buildCommand, { cwd: fixture, shell: true, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = path.join(fixture, config.outputDirectory);
  assert.equal(fs.existsSync(path.join(output, 'preview/ocean/assets/texture.png')), false, 'retired textures are not published');
  assert.equal(fs.existsSync(path.join(output, 'preview/ocean/renderer/runtime.js')), false, 'retired renderer is not published');
  assert.equal(fs.existsSync(path.join(output, 'preview/ocean/poc/old-demo.html')), false, 'retired demos are not published');
  for (const route of retiredRoutes) {
    assert.equal(fs.readFileSync(path.join(output, route), 'utf8'), files[route], `${route} keeps its original redirect and query/hash handling`);
  }
  for (const relative of ['index.html', 'my-cinemap.html', 'icon.png', 'logo.svg', 'site.webmanifest', 'assets/poster.png', 'js/cinelva-library-records.js', 'data/movies.json', 'my-cinelva/index.html', 'preview/brand/index.html']) {
    assert.equal(fs.readFileSync(path.join(output, relative), 'utf8'), files[relative], `${relative} is preserved`);
  }
});
