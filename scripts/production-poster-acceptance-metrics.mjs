export function posterFailures(result, width) {
  const failures = [];
  if (result.broken.length) failures.push(`${result.name}: ${result.broken.length} broken rendered images`);
  if (result.pending.length) failures.push(`${result.name}: ${result.pending.length} poster images never settled`);
  if (result.empty_source_images.length) {
    failures.push(`${result.name}: ${result.empty_source_images.length} poster image elements have no source`);
  }
  if (result.image_http_errors.length) {
    failures.push(`${result.name}: image HTTP errors: ${result.image_http_errors.join(', ')}`);
  }
  if (result.page_errors.length) failures.push(`${result.name}: page errors: ${result.page_errors.join(' | ')}`);
  if (width <= 390 && result.horizontal_overflow > 1) {
    failures.push(`${result.name}: ${result.horizontal_overflow}px page overflow at ${width}px`);
  }
  return failures;
}
