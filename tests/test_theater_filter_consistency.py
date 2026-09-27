from pathlib import Path
src = Path("scripts/apply_theater_comparison_table_20260927.py").read_text(encoding="utf-8")
checks = {
    "all equipment rows snapshot": "const allRows=(formatData.screens||[]);",
    "all-theater equipment index": "const allByTheater=new Map();",
    "visible rows derived after index": "const visibleRows=allRows.filter",
    "full equipment rows attached": "base._equipmentRows=allByTheater.get(k)||[]",
    "row renderer prefers attached full rows": "Array.isArray(t._equipmentRows)?t._equipmentRows:window.strictTheaterFormatRows(t)",
}
missing=[name for name, marker in checks.items() if marker not in src]
if missing:
    raise SystemExit("missing: "+", ".join(missing))
if "const rows=(formatData.screens||[]).filter(x=>!filter" in src:
    raise SystemExit("filtered rows are still the source of theater equipment state")
print("theater filter consistency checks passed")
