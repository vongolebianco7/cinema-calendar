from pathlib import Path

path = Path("critic.html")
text = path.read_text(encoding="utf-8")

old_start = '''function render(m){
 const back=document.querySelector(".back");'''
new_start = '''function render(m){
 const compareParams=new URLSearchParams(location.search),incomingLens=compareParams.get("lens"),fromTitle=compareParams.get("from"),fromId=compareParams.get("fromId"),creatorName=compareParams.get("creator"),creatorRole=compareParams.get("role"),creatorPerson=compareParams.get("person");
 const back=document.querySelector(".back");'''

old_late = ''' const compareParams=new URLSearchParams(location.search),incomingLens=compareParams.get("lens"),fromTitle=compareParams.get("from"),fromId=compareParams.get("fromId"),creatorName=compareParams.get("creator"),creatorRole=compareParams.get("role"),creatorPerson=compareParams.get("person");const incomingTopicIndex=findLensTopic(ts,incomingLens),incomingThemeMissing=String(incomingLens||"").startsWith("THEME:")&&incomingTopicIndex<0;'''
new_late = ''' const incomingTopicIndex=findLensTopic(ts,incomingLens),incomingThemeMissing=String(incomingLens||"").startsWith("THEME:")&&incomingTopicIndex<0;'''

if old_start not in text:
    raise SystemExit("render start anchor not found")
if old_late not in text:
    raise SystemExit("late creator declaration anchor not found")

text = text.replace(old_start, new_start, 1).replace(old_late, new_late, 1)
path.write_text(text, encoding="utf-8")
print("moved Critic Map query parameter declarations before first use")
