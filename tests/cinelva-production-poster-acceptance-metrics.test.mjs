import assert from 'node:assert/strict';
import test from 'node:test';

import { posterFailures } from '../scripts/production-poster-acceptance-metrics.mjs';

test('empty poster image elements fail production acceptance', () => {
  const failures = posterFailures({
    name: 'box-office-1980',
    broken: [],
    pending: [],
    empty_source_images: [
      { alt: '', card_title: 'ドラえもん のび太の恐竜 / モスラ対ゴジラ' },
    ],
    image_http_errors: [],
    page_errors: [],
    horizontal_overflow: 0,
  }, 1280);

  assert.deepEqual(failures, [
    'box-office-1980: 1 poster image elements have no source',
  ]);
});
