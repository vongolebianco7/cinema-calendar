const fs = require('node:fs');
const path = require('node:path');
const cinelvaDemo = require('./cinelva-demo-build.cjs');
if (process.env.VERCEL_ENV === 'production') require('./production-checks.cjs').checkProduction();

const root = process.cwd();
const output = process.env.CINELVA_STATIC_OUTPUT
  ? path.resolve(root, process.env.CINELVA_STATIC_OUTPUT)
  : path.join(root, 'public');
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

// Require a clean output directory so an earlier build cannot retain old assets.
fs.mkdirSync(output);
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && /\.(html|png|svg|webmanifest)$/.test(entry.name)) {
    fs.copyFileSync(path.join(root, entry.name), path.join(output, entry.name));
  }
}
for (const directory of ['assets', 'js', 'data', 'preview', 'my-cinelva']) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), {
    recursive: true,
    filter(source) {
      const relative = path.relative(root, source).split(path.sep).join('/');
      if (relative !== 'preview/ocean' && !relative.startsWith('preview/ocean/')) return true;
      return retiredRoutes.some(route => route === relative || route.startsWith(relative + '/'));
    },
  });
}
if (cinelvaDemo.shouldIncludeDemo(process.env)) {
  const result = cinelvaDemo.buildDemoPageFromRoot(root, output);
  console.log(`Built isolated My Cinelva demo with ${result.records} local sample records for this preview only.`);
}
fs.writeFileSync(path.join(output, 'data/source-status.json'), JSON.stringify(require('./source-status.cjs').fromRoot(root), null, 2) + '\n');
console.log('Static site built; retired Ocean publishes only its eight legacy redirects.');
