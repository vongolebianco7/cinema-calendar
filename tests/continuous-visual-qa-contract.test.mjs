import assert from 'node:assert/strict';
import test from 'node:test';
import { collectAuditIssues } from '../scripts/visual-qa-contract.mjs';

const cleanAudit = () => ({ overflow: 0, brokenLocalImages: [], feedbackLinks: 1 });

test('accepts the clean route audit baseline and the documented 2px tolerance', () => {
  assert.deepEqual(collectAuditIssues(cleanAudit()), []);
  assert.deepEqual(collectAuditIssues({ ...cleanAudit(), overflow: 2 }), []);
});

test('intentional horizontal-overflow fixture fails the audit', () => {
  assert.deepEqual(
    collectAuditIssues({ ...cleanAudit(), overflow: 17 }),
    ['horizontal overflow 17px']
  );
});

test('intentional broken-local-image fixture fails the audit', () => {
  assert.deepEqual(
    collectAuditIssues({ ...cleanAudit(), brokenLocalImages: ['/assets/missing-logo.png'] }),
    ['broken local images: /assets/missing-logo.png']
  );
});

test('intentional duplicate-feedback-link fixture fails the audit', () => {
  assert.deepEqual(
    collectAuditIssues({ ...cleanAudit(), feedbackLinks: 2 }),
    ['duplicate feedback navigation links: 2']
  );
});

test('reports every injected route regression in a single audit result', () => {
  assert.deepEqual(
    collectAuditIssues({
      overflow: 8,
      brokenLocalImages: ['/assets/a.png', '/assets/b.png'],
      feedbackLinks: 3
    }),
    [
      'horizontal overflow 8px',
      'broken local images: /assets/a.png, /assets/b.png',
      'duplicate feedback navigation links: 3'
    ]
  );
});
