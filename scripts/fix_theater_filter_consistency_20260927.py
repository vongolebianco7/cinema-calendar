from pathlib import Path
import sys

SOURCE = Path('scripts/apply_theater_comparison_table_20260927.py')
TEST = Path('tests/test_theater_filter_consistency.py')

TEST_BODY = r'''from pathlib import Path
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
'''

OLD_EQUIPMENT = r''' window.equipmentTheaters=function(all,filter){
   const rows=(formatData.screens||[]).filter(x=>!filter||formatFamilyMatch(x.format,filter)||formatFamilyMatch(x.screen,filter));
   const map=new Map();
   rows.forEach(x=>{
     const k=normName(x.theater);
     if(!k)return;
     const base=bestDirectoryMatch(x.theater,all)||{name:x.theater,prefecture:x.prefecture||'',municipality:'',address:'',website:'',_equipmentOnly:true};
     if(!map.has(k))map.set(k,base);
   });
   return [...map.values()];
 };'''

NEW_EQUIPMENT = r''' window.equipmentTheaters=function(all,filter){
   // Build each theater's complete equipment state first. Filtering only decides visibility.
   const allRows=(formatData.screens||[]);
   const allByTheater=new Map();
   allRows.forEach(x=>{
     const k=normName(x.theater);
     if(!k)return;
     if(!allByTheater.has(k))allByTheater.set(k,[]);
     allByTheater.get(k).push(x);
   });
   const visibleRows=allRows.filter(x=>!filter||formatFamilyMatch(x.format,filter)||formatFamilyMatch(x.screen,filter));
   const map=new Map();
   visibleRows.forEach(x=>{
     const k=normName(x.theater);
     if(!k)return;
     const matched=bestDirectoryMatch(x.theater,all);
     const base=matched?{...matched}:{name:x.theater,prefecture:x.prefecture||'',municipality:'',address:'',website:'',_equipmentOnly:true};
     base._equipmentRows=allByTheater.get(k)||[];
     if(!map.has(k))map.set(k,base);
   });
   return [...map.values()];
 };'''

OLD_ROW = "   const rows=window.strictTheaterFormatRows(t);"
NEW_ROW = "   const rows=Array.isArray(t._equipmentRows)?t._equipmentRows:window.strictTheaterFormatRows(t);"

def prepare_tests():
    TEST.parent.mkdir(exist_ok=True)
    TEST.write_text(TEST_BODY, encoding='utf-8')

def apply():
    text=SOURCE.read_text(encoding='utf-8')
    if NEW_EQUIPMENT not in text:
        if OLD_EQUIPMENT not in text:
            raise SystemExit('equipmentTheaters anchor not found')
        text=text.replace(OLD_EQUIPMENT, NEW_EQUIPMENT, 1)
    if NEW_ROW not in text:
        if OLD_ROW not in text:
            raise SystemExit('rowHtml anchor not found')
        text=text.replace(OLD_ROW, NEW_ROW, 1)
    SOURCE.write_text(text,encoding='utf-8')

if __name__=='__main__':
    if len(sys.argv)!=2 or sys.argv[1] not in {'prepare-tests','apply'}:
        raise SystemExit('usage: prepare-tests|apply')
    prepare_tests() if sys.argv[1]=='prepare-tests' else apply()
