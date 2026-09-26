from pathlib import Path
text = Path("critic.html").read_text(encoding="utf-8")
assert "function render(m,data)" in text
assert text.index("const id=movieId(m)") < text.index("encodeURIComponent(id)+'&search=")
assert "backend-one-gray" not in text
assert "<div class=\"poster\"></div>" not in text
print("critic static render reference-order check passed")
