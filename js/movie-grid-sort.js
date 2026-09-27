/* Client-side sorting for three-column movie lists. No additional requests. */
(()=>{
  const page=location.pathname.split('/').pop();
  if(!['search.html','discover.html','rankings.html','index.html'].includes(page))return;
  const root=document.getElementById(page==='index.html'?'dates':'grid');
  if(!root)return;
  const choices={
    search:[['default','検索順'],['year-desc','公開年：新しい順'],['year-asc','公開年：古い順'],['score-desc','評価：高い順'],['score-asc','評価：低い順'],['votes-desc','評価件数順'],['title-asc','作品名順']],
    discover:[['default','おすすめ順'],['year-desc','公開年：新しい順'],['year-asc','公開年：古い順'],['score-desc','評価：高い順'],['score-asc','評価：低い順'],['votes-desc','評価件数順'],['title-asc','作品名順']],
    rating:[['default','ランキング順'],['year-desc','公開年：新しい順'],['year-asc','公開年：古い順'],['score-desc','評価：高い順'],['score-asc','評価：低い順'],['votes-desc','評価件数順'],['title-asc','作品名順']],
    boxoffice:[['default','興収順'],['year-desc','集計年：新しい順'],['year-asc','集計年：古い順'],['gross-desc','興収：高い順'],['title-asc','作品名順']],
    awards:[['default','元の表示順'],['year-desc','授賞年：新しい順'],['year-asc','授賞年：古い順'],['title-asc','作品名順'],['organization-asc','賞・映画祭順']],
    tv:[['default','放送順'],['score-desc','評価：高い順'],['title-asc','作品名順'],['channel-asc','放送局順']]
  };
  const key=()=>page==='rankings.html'?document.querySelector('[data-axis].active')?.dataset.axis||'rating':page==='index.html'?'tv':page.replace('.html','');
  const controls=document.createElement('div');controls.className='movieGridSort';
  controls.innerHTML='<label for="movieGridSortSelect">並び替え</label><select id="movieGridSortSelect" aria-label="作品の並び替え"></select>';
  root.before(controls);
  const select=controls.querySelector('select');
  const style=document.createElement('style');style.textContent='.movieGridSort{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin:12px 0 14px;color:#c9c5bd;font-size:13px}.movieGridSort[hidden]{display:none!important}.movieGridSort select{min-height:44px;max-width:100%;padding:8px 32px 8px 12px;border:1px solid #615e57;border-radius:8px;background:#191919;color:#f5f2ec;font-size:16px}@media(max-width:760px){.movieGridSort{justify-content:space-between;margin:14px 0 12px}.movieGridSort select{width:min(68vw,260px)}}';document.head.append(style);
  let currentKey='',busy=false;
  const numeric=(v)=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
  const year=(v)=>{const match=String(v||'').match(/(?:18|19|20)\d{2}/);return match?Number(match[0]):null};
  const text=(node,selector)=>node.querySelector(selector)?.textContent?.trim()||'';
  function movieFor(node){
    if(page==='search.html')return typeof results!=='undefined'?results[Number(node.dataset.i)]||{}:{};
    if(page==='discover.html')return typeof items!=='undefined'?items.find(m=>String(m.tmdbId)===node.dataset.id)||{}:{};
    if(page==='index.html')return typeof movies!=='undefined'?movies[Number(node.dataset.mi)]||{}:{};
    return {};
  }
  function fields(node){
    const movie=movieFor(node),meta=text(node,'.meta'),title=movie.title||text(node,'.title')||text(node,'.awardTitle')||text(node,'.tvMovieTitle');
    return {title,year:year(movie.year||movie.release_date||(page==='index.html'?movie.original_release_date:movie.date)||text(node,'.awardYear')||meta),score:numeric(movie.score)||numeric(meta.match(/★\s*([\d.]+)/)?.[1]),votes:numeric(movie.votes)||numeric(meta.match(/([\d,]+)票/)?.[1]?.replaceAll(',','')),gross:numeric(text(node,'.body').match(/([\d.]+)億円/)?.[1]),organization:text(node,'.awardMeta').split(' · ')[0],channel:movie.service||text(node,'.tvMovieChannel')};
  }
  function compare(a,b,sort){
    if(sort==='default')return Number(a.dataset.sortOrder)-Number(b.dataset.sortOrder);
    const [field,direction]=sort.split('-'),left=fields(a)[field],right=fields(b)[field];
    if(left==null&&right!=null)return 1;if(right==null&&left!=null)return -1;
    const result=typeof left==='number'&&typeof right==='number'?left-right:String(left||'').localeCompare(String(right||''),'ja');
    return (direction==='desc'?-result:result)||Number(a.dataset.sortOrder)-Number(b.dataset.sortOrder);
  }
  function groups(){return page==='index.html'?[...root.querySelectorAll('.tvWeekMovies')]:[root]}
  function apply(){
    if(busy)return;busy=true;observer.disconnect();
    groups().forEach(group=>{
      const cards=[...group.children].filter(n=>n.matches('.card,.rankCard,.awardCard,.tvMovie'));
      cards.forEach((node,i)=>{if(!node.hasAttribute('data-sort-order'))node.dataset.sortOrder=String(i)});
      if(cards.length>1)cards.sort((a,b)=>compare(a,b,select.value)).forEach(node=>group.append(node));
    });
    observer.observe(root,{childList:true,subtree:page==='index.html'});busy=false;
  }
  function update(){
    const next=key();controls.hidden=page==='index.html'&&(typeof mode==='undefined'||mode!=='tv');
    if(currentKey!==next){currentKey=next;select.innerHTML=(choices[next]||choices.rating).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')}
    if(controls.hidden)observer.observe(root,{childList:true,subtree:true});
    else apply();
  }
  const observer=new MutationObserver(update);
  select.addEventListener('change',apply);
  update();
})();
