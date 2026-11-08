// Pure contracts for the route visual QA so intentional regressions remain detectable.
export function collectAuditIssues(audit) {
  const issues = [];
  if (audit.overflow > 2) issues.push('horizontal overflow ' + audit.overflow + 'px');
  if (audit.brokenLocalImages.length) {
    issues.push('broken local images: ' + audit.brokenLocalImages.join(', '));
  }
  if (audit.feedbackLinks > 1) {
    issues.push('duplicate feedback navigation links: ' + audit.feedbackLinks);
  }
  return issues;
}
