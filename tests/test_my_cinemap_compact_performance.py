from pathlib import Path

art_direction = Path("js/my-cinemap-art-direction.js").read_text(encoding="utf-8")
renderer = Path("js/my-cinemap-cinema-templates.js").read_text(encoding="utf-8")

# Removed templates must no longer be offered or rendered.
for removed in ["cinema-artdeco", "Art Deco Cinema"]:
    assert removed not in art_direction
    assert removed not in renderer

# Blue Grey is a legacy editorial template and must be removed from the picker at runtime.
assert "REMOVED_THEMES=['bluegray','cinema-artdeco']" in art_direction
assert "removeDeprecatedTemplates" in art_direction

# Font and text-size selectors live side by side in the same compact control row.
assert "document.querySelector('.previewControls')" in art_direction
assert ".previewControls{grid-template-columns:repeat(2,minmax(0,1fr))" in art_direction
assert ".fontStyleField{grid-column:1/-1}" not in art_direction

# Keep the page compact and avoid full-list/canvas work on every keystroke.
assert "scheduleArtworkRender" in art_direction
assert "bindLightweightTextInputs" in art_direction
assert "requestAnimationFrame" in art_direction

# Director hydration should not fan out ten requests and redraw after every response.
assert "HYDRATION_CONCURRENCY=3" in art_direction
assert "scheduleDirectorHydration" in art_direction
assert "requestIdleCallback" in art_direction

# Full-resolution cinema assets are loaded only when selected, not by every picker card.
assert "background-image:url('${item.asset}')" not in art_direction
assert "data-preview-theme" in art_direction

# Expensive PNG encoding is debounced in the cinema renderer.
assert "scheduleArtworkBlob" in renderer
assert "clearTimeout(blobTimer)" in renderer
assert "setTimeout" in renderer

print("My Cinemap compact/performance requirements passed")
