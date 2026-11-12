const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const script = path.resolve('scripts/prepare-neon-direct-url.cjs');

function run(databaseUrl) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cinelva-neon-url-'));
  const envFile = path.join(directory, 'github-env');
  const result = spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URL: databaseUrl, GITHUB_ENV: envFile },
  });
  const content = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
  fs.rmSync(directory, { recursive: true, force: true });
  return { ...result, content };
}

test('Neon pooler host is converted to its direct host while credentials and query are preserved', () => {
  const secret = [
    'postgresql://',
    'cinelva:private-value',
    '@',
    'ep-snowy-wave-b4gwato2-pooler.c-6.us-east-2.aws.neon.tech',
    '/neondb?sslmode=require&connect_timeout=15',
  ].join('');
  const result = run(secret);
  assert.equal(result.status, 0, result.stderr);
  const output = new URL(result.content.trim().slice('DATABASE_URL='.length));
  assert.equal(output.hostname, 'ep-snowy-wave-b4gwato2.c-6.us-east-2.aws.neon.tech');
  assert.equal(output.username, 'cinelva');
  assert.equal(output.password, 'private-value');
  assert.equal(output.pathname, '/neondb');
  assert.equal(output.searchParams.get('sslmode'), 'require');
  assert.equal(output.searchParams.get('connect_timeout'), '15');
  assert.equal(result.stdout, '');
  assert.doesNotMatch(result.stderr, /private-value/);
});

test('non-Neon Postgres URLs remain unchanged', () => {
  const input = [
    'postgresql://',
    'user:secret',
    '@',
    'db.example.test/cinelva?sslmode=require',
  ].join('');
  const result = run(input);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.content, `DATABASE_URL=${input}\\n`);
  assert.doesNotMatch(result.stdout + result.stderr, /secret/);
});

test('invalid URLs fail without writing a connection value', () => {
  const result = run('not-a-database-url');
  assert.notEqual(result.status, 0);
  assert.equal(result.content, '');
  assert.doesNotMatch(result.stdout + result.stderr, /not-a-database-url/);
});
