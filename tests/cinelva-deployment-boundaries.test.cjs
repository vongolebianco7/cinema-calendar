const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const frontend = JSON.parse(fs.readFileSync('vercel.json', 'utf8')).ignoreCommand;
const backend = JSON.parse(fs.readFileSync('backend/vercel.json', 'utf8')).ignoreCommand;

test('configured ignore commands fit the deployment provider schema', () => {
  for (const command of [frontend, backend]) assert.ok(command.length <= 256);
});

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cinelva-deploy-scope-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  };
  fs.mkdirSync(path.join(directory, 'backend'));
  fs.mkdirSync(path.join(directory, 'scripts'));
  if (fs.existsSync('scripts/ignore-frontend-build.sh')) fs.copyFileSync('scripts/ignore-frontend-build.sh', path.join(directory, 'scripts/ignore-frontend-build.sh'));
  fs.writeFileSync(path.join(directory, 'index.html'), 'baseline');
  git('init', '--quiet');
  git('config', 'user.name', 'Deployment test');
  git('config', 'user.email', 'test@example.invalid');
  git('add', '.');
  git('commit', '--quiet', '-m', 'baseline');
  return {
    change(file) {
      const target = path.join(directory, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file === 'scripts/ignore-frontend-build.sh' ? fs.readFileSync(target, 'utf8') + '# changed\n' : 'changed');
      git('add', '.'); git('commit', '--quiet', '-m', file);
    },
    check(command, expected, label) {
      for (const cwd of [directory, path.join(directory, 'backend')]) {
        const result = spawnSync(command, { shell: true, cwd, encoding: 'utf8' });
        assert.equal(result.status, expected, `${label} from ${path.relative(directory, cwd) || 'root'}: ${result.stderr}`);
      }
    },
  };
}

test('backend-only source changes build the backend and skip the frontend in either working directory', t => {
  const repo = fixture(t);
  repo.change('backend/api/server.js');
  repo.check(backend, 1, 'backend change must build');
  repo.check(frontend, 0, 'backend change must not build frontend');
});

test('backend-only HTML is not mistaken for a published root HTML page', t => {
  const repo = fixture(t);
  repo.change('backend/internal.html');
  repo.check(backend, 1, 'backend HTML must build backend');
  repo.check(frontend, 0, 'backend HTML must not build frontend');
});

test('all frontend publication inputs build the frontend and skip the backend', t => {
  const repo = fixture(t);
  for (const file of ['index.html', 'icon.png', 'logo.svg', 'manifest.webmanifest', 'js/app.js', 'assets/theme.css', 'data/movies.json', 'my-cinelva/index.html', 'preview/brand/index.html', 'scripts/build-static.cjs', 'scripts/ignore-frontend-build.sh', 'vercel.json']) {
    repo.change(file);
    repo.check(frontend, 1, file + ' must build frontend');
    repo.check(backend, 0, file + ' must not build backend');
  }
});

test('docs, workflow and test-only changes skip both application builds', t => {
  const repo = fixture(t);
  for (const file of ['docs/operations/checkpoint.md', '.github/workflows/quality.yml', 'tests/example.test.cjs']) {
    repo.change(file);
    repo.check(frontend, 0, file + ' must skip frontend');
    repo.check(backend, 0, file + ' must skip backend');
  }
});
