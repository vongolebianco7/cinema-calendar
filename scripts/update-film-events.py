#!/usr/bin/env python3
"""Refresh CINELVA film festival and domestic event feed from official JSON-LD.
No scraping of listings or inferred dates: only published, structured Event data.
Existing verified records remain; ambiguous/unverified discoveries are skipped.
"""
import datetime as dt
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FEED=ROOT/'data/events.json'
SOURCES=ROOT/'data/film-event-sources.json'
UA={'User-Agent':'CinelvaEventDiscovery/1.0 (official event metadata)'}
MAX_BYTES=1_500_000
CATEGORIES={
 'domestic_event':['コミコン','comic con','アニメジャパン','animejapan','東京ゲームショウ','tokyo game show','映画関連イベント'],
 'domestic_festival':['映画祭','film festival','フィルムフェスティバル','short shorts','フィルムフェスティバル'],
 'overseas_festival':['film festival','filmfest','festival international du film'],
}
def fetch(url):
 if urllib.parse.urlsplit(url).scheme!='https':return ''
 req=urllib.request.Request(url,headers=UA)
 with urllib.request.urlopen(req,timeout=12) as r:
  if r.status!=200 or int(r.headers.get('Content-Length','0'))>MAX_BYTES:return ''
  return r.read(MAX_BYTES).decode('utf-8','replace')
def nodes(obj):
 if isinstance(obj,list):
  for x in obj:yield from nodes(x)
 elif isinstance(obj,dict):
  if '@graph' in obj:yield from nodes(obj['@graph'])
  else:yield obj
def classify(title,desc,scope):
 text=(title+' '+desc).lower()
 if scope=='domestic':
  if any(t in text for t in CATEGORIES['domestic_event']):return '国内イベント'
  if any(t in text for t in CATEGORIES['domestic_festival']):return '国内映画祭'
 else:
  if any(t in text for t in CATEGORIES['overseas_festival']):return '海外映画祭'
 return ''
def iso(raw):
 try:return dt.date.fromisoformat(str(raw)[:10]).isoformat()
 except ValueError:return ''
def extract(url,scope):
 try:page=fetch(url)
 except (OSError,ValueError):return []
 output=[]
 for raw in re.findall(r"<script\\b[^>]*type\\s*=\\s*[^>]*application/ld\\+json[^>]*>(.*?)</script>",page,re.I|re.S):
  try:values=list(nodes(json.loads(html.unescape(raw))))
  except (ValueError,TypeError):continue
  for item in values:
   types=item.get('@type',[])
   if isinstance(types,str):types=[types]
   if not any('Event' in str(t) for t in types):continue
   title=str(item.get('name') or '').strip()
   description=re.sub('<[^>]+>',' ',str(item.get('description') or '')).strip()
   category=classify(title,description,scope)
   start=iso(item.get('startDate'))
   end=iso(item.get('endDate')) or start
   if not title or not category or not start or end<start:continue
   day=dt.date.fromisoformat(start)
   if not (dt.date.today()-dt.timedelta(days=90)<=day<=dt.date.today()+dt.timedelta(days=540)):continue
   loc=item.get('location') or {}
   if isinstance(loc,list):loc=loc[0] if loc else {}
   if not isinstance(loc,dict):continue
   addr=loc.get('address') or {}
   if isinstance(addr,str):addr={'streetAddress':addr}
   if not isinstance(addr,dict):addr={}
   venue=' / '.join(x for x in [str(loc.get('name') or '').strip(),str(addr.get('addressLocality') or addr.get('addressRegion') or '').strip()] if x)
   if not venue:continue
   official=str(item.get('url') or url)
   if urllib.parse.urlsplit(official).scheme!='https':official=url
   output.append({'title':title[:160],'date':start,'end_date':end,'event':'festival','service':category,'scope':scope,'venue':venue[:180],'source':'公式イベント情報','source_url':official,'overview':description[:450]})
 return output
def main():
 data=json.loads(FEED.read_text())
 config=json.loads(SOURCES.read_text())
 existing=data.get('events',[])
 def key(e):return (re.sub(r'\W+','',str(e.get('title','')).casefold()),e.get('date',''))
 merged={key(e):e for e in existing}
 found=0
 for group,scope in [('domestic_official_pages','domestic'),('overseas_official_pages','overseas')]:
  for url in config.get(group,[])[:60]:
   for item in extract(url,scope):
    k=key(item)
    if k not in merged:merged[k]=item;found+=1
 data['events']=sorted(merged.values(),key=lambda e:(e.get('date',''),e.get('title','')))
 data['generated_at']=dt.date.today().isoformat()
 data['discovery_count']=found
 FEED.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print(f'Official event feed: {len(data["events"])} records; {found} new verified events')
if __name__=='__main__':main()
