"""Rebuild the source-level inventory. No network or runtime/user data."""
import json,re
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
class Controls(HTMLParser):
 def __init__(self):super().__init__();self.items=[];self.scripts=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag in ('button','input','select','textarea','summary') or (tag=='a' and ('href'in a or 'role'in a)):
   self.items.append({'line':self.getpos()[0],'tag':tag,'attributes':a})
  if tag=='script' and a.get('src'):self.scripts.append(a['src'].split('?')[0])
manifest=json.loads((ROOT/'quality/route-manifest.json').read_text())
files=set();routes=[]
for route in manifest['routes']:
 path=route['path'];effective=path.removeprefix('cinelva/') if path.startswith('cinelva/') else path
 p=ROOT/effective;parser=Controls();parser.feed(p.read_text())
 scripts=[]
 for src in parser.scripts:
  candidate=(p.parent/src).resolve()
  if candidate.is_relative_to(ROOT) and candidate.exists():scripts.append(str(candidate.relative_to(ROOT)));files.add(candidate)
 routes.append({'route':path,'effective_source':effective,'purpose':route['purpose'],'controls':parser.items,'scripts':scripts})
 files.add(p)
sources=[]
pattern=re.compile(r'addEventListener\(|\.on(?:click|change|input|submit)\s*=|localStorage\.|\.setItem\(|\.removeItem\(|Records\.(?:save|restore|remove)|data-(?:bookmark|review|edit|delete|film-controls)|<button|<input|<select|<textarea')
for p in sorted(files):
 matches=[{'line':n,'source_excerpt':line.strip()[:500],'tokens':[{'column':m.start()+1,'operation':line[m.start():min(len(line),m.end()+70)]} for m in pattern.finditer(line)]} for n,line in enumerate(p.read_text().splitlines(),1) if pattern.search(line)]
 sources.append({'file':str(p.relative_to(ROOT)),'operations':matches})
result={'schema_version':1,'scope':'all active route-manifest routes, effective canonical HTML, and their local scripts; includes dynamically generated controls/handlers/storage writes','routes':routes,'sources':sources}
out=ROOT/'docs/operations/ui-operation-inventory.json';out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f'{len(routes)} routes; {len(sources)} source files; {sum(len(r["controls"]) for r in routes)} static controls; {sum(len(s["operations"]) for s in sources)} operation lines')
