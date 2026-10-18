const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const output = path.join(root, 'public');
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
console.log('Static site built; retired Ocean publishes only its eight legacy redirects.');
