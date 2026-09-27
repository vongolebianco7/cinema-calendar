from pathlib import Path
import json,re,time,unicodedata
import requests
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
BOX=ROOT/'data/boxoffice.json'
HEADERS={'User-Agent':'Cinemap/1.0 one-time boxoffice coverage supplement'}


def norm(s):
    return unicodedata.normalize('NFKC',str(s or '')).replace('\xa0',' ').strip()

def amount_oku(s):
    s=norm(s).replace(',','')
    m=re.search(r'(\d+(?:\.\d+)?)\s*億',s)
    if m:return float(m.group(1))
    m=re.search(r'(\d+(?:\.\d+)?)',s)
    return float(m.group(1)) if m else None

def rows_from_table(table,region,year,url):
    out=[]
    for tr in table.find_all('tr'):
        cells=[norm(c.get_text(' ',strip=True)) for c in tr.find_all(['th','td'])]
        if len(cells)<2:continue
        title=None;gross=None
        # Newer pages: rank, release, title, gross. Older pages: rank, title, gross.
        for cell in cells:
            if gross is None and ('億円' in cell or re.fullmatch(r'\d+(?:\.\d+)?',cell)):
                v=amount_oku(cell)
                if v is not None:gross=v
        candidates=[c for c in cells if c and not re.fullmatch(r'(?:Image:\s*)?\d+位?',c) and '億円' not in c and not re.fullmatch(r'\d{4}/\d{1,2}',c)]
        for c in candidates:
            if any(k in c for k in ['作品名','タイトル名','公開年月','興行収入','配給収入','順位']):continue
            title=c;break
        if title and gross is not None:
            out.append({'title':title,'gross':round(gross,3),'year':year,'region':region,'metric':'配給収入' if year<=1999 else '興行収入','source_url':url,'source_kind':'supplement'})
    seen=set();res=[]
    for r in out:
        k=norm(r['title']).lower()
        if k in seen:continue
        seen.add(k);res.append(r)
    return res[:10]

def old_year(year):
    url=f'https://nendai-ryuukou.com/1980/{year}.html'
    r=requests.get(url,headers=HEADERS,timeout=25);r.raise_for_status();r.encoding=r.apparent_encoding or r.encoding
    soup=BeautifulSoup(r.text,'html.parser')
    found={'邦画':[],'洋画':[]}
    for heading in soup.find_all(['h2','h3','h4']):
        t=norm(heading.get_text(' ',strip=True))
        region='邦画' if '邦画ランキング' in t else '洋画' if '洋画ランキング' in t else None
        if not region:continue
        table=heading.find_next('table')
        if table:found[region]=rows_from_table(table,region,year,url)
    return found

def recent_year(year,region):
    kind='movie1' if region=='邦画' else 'movie2'
    url=f'https://nendai-ryuukou.com/{year}/{kind}.html'
    r=requests.get(url,headers=HEADERS,timeout=25);r.raise_for_status();r.encoding=r.apparent_encoding or r.encoding
    soup=BeautifulSoup(r.text,'html.parser')
    tables=soup.find_all('table')
    if not tables:return []
    rows=max((rows_from_table(t,region,year,url) for t in tables),key=len,default=[])
    return rows[:10]

def merge_top10(existing,supplement,region):
    current=[r for r in existing if r.get('region')==region]
    if len(current)>=10:return existing
    keys={norm(r.get('title')).lower() for r in existing}
    for row in supplement:
        k=norm(row['title']).lower()
        if k in keys:continue
        existing.append(row);keys.add(k)
        if sum(1 for r in existing if r.get('region')==region)>=10:break
    return existing

def main():
    data=json.loads(BOX.read_text(encoding='utf-8'));by=data['by_year']
    for year in range(1980,2000):
        cur=by[str(year)];need=[reg for reg in ('邦画','洋画') if sum(1 for r in cur if r.get('region')==reg)<10]
        if need:
            print('supplement',year,need);src=old_year(year)
            for reg in need:cur=merge_top10(cur,src[reg],reg)
            by[str(year)]=sorted(cur,key=lambda r:r.get('gross',0),reverse=True)
            time.sleep(.1)
    for year in (2020,2021):
        cur=by[str(year)]
        for reg in ('邦画','洋画'):
            if sum(1 for r in cur if r.get('region')==reg)<10:
                print('supplement',year,reg);cur=merge_top10(cur,recent_year(year,reg),reg);time.sleep(.1)
        by[str(year)]=sorted(cur,key=lambda r:r.get('gross',0),reverse=True)
    source_name='年代流行 年別映画ランキング（不足年のTop10補完）'
    data['sources']=[s for s in data.get('sources',[]) if s.get('name')!=source_name]+[{'name':source_name,'url':'https://nendai-ryuukou.com/','as_of':'2026-09-27','note':'映連の公開上位作品だけでは国内/国外各10本に満たない年について、年別ランキングで不足分のみ補完。映連データを優先。'}]
    BOX.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':main()
