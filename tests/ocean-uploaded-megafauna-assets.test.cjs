const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const manifest = JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));
const atlas = fs.readFileSync('preview/ocean/real-fish/milestone-atlas.js','utf8');
const uploaded = '../../../assets/CAECC410-93BE-4136-9FA8-BFD3B7604FB7.png';

test('manta dolphin and dugong use the uploaded three-animal source image', () => {
  for (const key of ['manta-ray','dolphin','dugong']) {
    assert.equal(manifest.species[key].asset, uploaded);
    assert.ok(Array.isArray(manifest.species[key].assetCrop), `${key} must define assetCrop`);
    assert.equal(manifest.species[key].assetCrop.length, 4);
  }
});

test('uploaded image crops are separated vertically in manta/dolphin/dugong order', () => {
  const manta = manifest.species['manta-ray'].assetCrop;
  const dolphin = manifest.species.dolphin.assetCrop;
  const dugong = manifest.species.dugong.assetCrop;
  assert.ok(manta[1] < dolphin[1]);
  assert.ok(dolphin[1] < dugong[1]);
});

test('milestone renderer supports assetCrop for uploaded composite images', () => {
  assert.match(atlas, /assetCrop/);
  assert.match(atlas, /createAssetCropCreature/);
});
