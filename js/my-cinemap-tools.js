/* My Cinemap assist tools. Local-only: no additional network sources or paid services. */
(() => {
  const CANDIDATE_KEY='cinemap-my-candidates';
  const SAVED_LISTS_KEY='cinemap-my-saved-lists';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const movieKey=m=>String(m?.tmdbId||m?.id||`${m?.title||''}|${m?.year||''}`);
  let replaceIndex=null;
  let candidates=[];
  try{candidates=JSON.parse(localStorage.getItem(CANDIDATE_KEY)||'[]');if(!Array.isArray(candidates))candidates=[]}catch{candidates=[]}

  const style=document.createElement('style');
  style.textContent=`
    .candidateShelf{margin:10px 0 16px;padding:12px;border:1px solid #303030;border-radius:12px;background:#101010}
    .candidateHead{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}.candidateHead b{font-size:13px}.candidateHead span{font-size:11px;color:#888}
    .candidateRail{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x proximity;padding-bottom:4px;overscroll-behavior-x:contain}.candidateCard{flex:0 0 138px;scroll-snap-align:start;background:#171717;border:1px solid #303030;border-radius:10px;padding:8px;min-width:0}.candidateCard img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:6px;background:#222}.candidateCard b{display:block;font-size:12px;line-height:1.3;margin-top:7px;min-height:31px}.candidateMeta{font-size:10px;color:#777;margin-top:3px}.candidateActions{display:grid;grid-template-columns:1fr 36px;gap:5px;margin-top:7px}.candidateActions button,.assistBtn{min-height:36px;border:1px solid #3a3a3a;background:#202020;color:#eee;border-radius:8px;font-weight:750}.candidateActions .toRank{background:#eee;color:#111;border-color:#eee}.assistRow{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.assistBtn{padding:6px 9px;font-size:11px}.replaceActive{outline:2px solid #cdb47a;outline-offset:3px}.movieComment{grid-column:2 / -1;width:100%;margin-top:4px;background:#101010!important;border:1px solid #303030!important;color:#ddd!important;border-radius:8px!important;padding:9px!important;font-size:13px!important}.movieComment::placeholder{color:#666}.completionHint{font-size:11px;color:#888;margin-left:5px}.luxeTheme{border-color:#7b6944!important;background:linear-gradient(135deg,#221f19,#141414)!important}.luxeTheme .themeSwatch{box-shadow:inset 0 0 0 5px #1c1a16,0 0 0 1px #cdb47a;background:linear-gradient(135deg,#ead9a6,#7d6840)!important}.duplicateNotice{font-size:11px;color:#c9b783;margin-top:8px}
    @media(max-width:760px){.candidateCard{flex-basis:124px}.candidateShelf{margin-left:-2px;margin-right:-2px}.assistBtn{min-height:40px}.movieComment{font-size:16px!important}}
  `;
  document.head.appendChild(style);

  function saveCandidates(){localStorage.setItem(CANDIDATE_KEY,JSON.stringify(candidates.slice(0,30)))}
  function renderCandidates(){
    const rail=document.getElementById('candidateRail'),count=document.getElementById('candidateCount');
    if(!rail)return;
    if(count)count.textContent=`${candidates.length}本`;
    rail.innerHTML=candidates.length?candidates.map((m,i)=>`<article class="candidateCard">${m.poster?`<img src="${esc(m.poster)}" alt="">`:''}<b>${esc(m.title)}</b><div class="candidateMeta">${esc(m.year||'')}</div><div class="candidateActions"><button class="toRank" data-candidate-rank="${i}">ランキングへ</button><button aria-label="候補から削除" data-candidate-x="${i}">×</button></div></article>`).join(''):'<div class="legal">迷っている作品をここへ置けます。</div>';
    rail.querySelectorAll('[data-candidate-rank]').forEach(b=>b.onclick=()=>{
      const i=+b.dataset.candidateRank,m=candidates[i];if(!m||picks.length>=10)return;
      if(!picks.some(x=>movieKey(x)===movieKey(m)))picks.push({...m});
      candidates.splice(i,1);saveCandidates();persist();renderCandidates();
    });
    rail.querySelectorAll('[data-candidate-x]').forEach(b=>b.onclick=()=>{candidates.splice(+b.dataset.candidateX,1);saveCandidates();renderCandidates()});
  }

  function addCandidate(movie){
    if(!movie||!movie.title)return;
    if(!candidates.some(x=>movieKey(x)===movieKey(movie))&&!picks.some(x=>movieKey(x)===movieKey(movie)))candidates.unshift({...movie});
    saveCandidates();renderCandidates();
  }

  function enhanceList(){
    const list=document.getElementById('list');if(!list)return;
    [...list.querySelectorAll('.item')].forEach((item,i)=>{
      item.classList.toggle('replaceActive',replaceIndex===i);
      const controls=item.querySelector('.move');
      if(controls&&!controls.querySelector('[data-replace]')){
        const row=document.createElement('div');row.className='assistRow';
        const replace=document.createElement('button');replace.className='assistBtn';replace.dataset.replace=String(i);replace.textContent='差し替え';
        replace.onclick=()=>{replaceIndex=i;document.getElementById('q').focus();document.getElementById('q').placeholder=`${i+1}位を差し替える作品を検索`;enhanceList();document.getElementById('msg').textContent=`${i+1}位「${picks[i]?.title||''}」を差し替えます。`};
        row.appendChild(replace);controls.appendChild(row);
      }
      if(!item.querySelector('.movieComment')){
        const input=document.createElement('input');input.className='movieComment';input.maxLength=40;input.placeholder='一言コメント（任意・40文字まで）';input.value=picks[i]?.movieComment||'';
        input.onchange=()=>{if(!picks[i])return;picks[i].movieComment=input.value.trim().slice(0,40);localStorage.setItem('cinemap-my-list',JSON.stringify(picks));drawArtwork(picks)};
        item.appendChild(input);
      }
    });
    const count=document.getElementById('count');if(count&&!document.getElementById('completionHint')){
      const hint=document.createElement('span');hint.id='completionHint';hint.className='completionHint';count.after(hint);
    }
    const hint=document.getElementById('completionHint');if(hint)hint.textContent=picks.length<10?`あと${10-picks.length}本`:'完成';
  }

  async function enhancedSearch(){
    const input=document.getElementById('q'),box=document.getElementById('results'),t=input.value.trim();if(!t)return;
    box.textContent='検索中…';
    try{
      const r=await fetch('https://backend-one-gray-94.vercel.app/api/movies?q='+encodeURIComponent(t)+'&limit=12'),d=await r.json(),seen=new Set();
      const movies=[...(d.movies||[]),...(d.external||[])].filter(m=>{const k=movieKey(m);if(seen.has(k))return false;seen.add(k);return true}).slice(0,12);
      box.innerHTML=movies.map((m,i)=>`<div class="result">${m.poster?`<img src="${esc(m.poster)}" alt="">`:'<div></div>'}<b>${esc(m.title)}<br><span style="color:#777">${esc(m.year||'')}</span></b><div class="assistRow"><button data-rank-add="${i}">${replaceIndex==null?'ランキング':'差し替え'}</button><button data-candidate-add="${i}">候補に追加</button></div></div>`).join('');
      box.querySelectorAll('[data-candidate-add]').forEach(b=>b.onclick=()=>addCandidate(movies[+b.dataset.candidateAdd]));
      box.querySelectorAll('[data-rank-add]').forEach(b=>b.onclick=()=>{
        const movie=movies[+b.dataset.rankAdd];
        if(replaceIndex!=null){picks[replaceIndex]={...movie,movieComment:picks[replaceIndex]?.movieComment||''};replaceIndex=null;input.placeholder='作品名を検索';persist();return}
        if(picks.length>=10||picks.some(x=>movieKey(x)===movieKey(movie)))return;
        const v=document.getElementById('insertAt').value,pos=v==='end'?picks.length:Math.min(Math.max(Number(v),0),picks.length);picks.splice(pos,0,movie);if(picks.length>10)picks=picks.slice(0,10);persist();
      });
    }catch{box.textContent='検索できませんでした'}
  }

  function duplicateList(){
    let saved=[];try{saved=JSON.parse(localStorage.getItem(SAVED_LISTS_KEY)||'[]');if(!Array.isArray(saved))saved=[]}catch{saved=[]}
    const original={picks:JSON.parse(JSON.stringify(picks)),title:document.getElementById('title').value,sub:document.getElementById('sub').value,theme:document.getElementById('theme').value,format:document.getElementById('format').value,layout:document.getElementById('layout').value,savedAt:new Date().toISOString()};
    saved.unshift(original);localStorage.setItem(SAVED_LISTS_KEY,JSON.stringify(saved.slice(0,20)));
    const title=document.getElementById('title');title.value=(title.value||'My Cinemap')+'（コピー）';render();
    document.getElementById('msg').textContent='元のリストを保存し、編集用のコピーを作りました。';
  }

  function mount(){
    const list=document.getElementById('list');if(!list)return;
    const rankingLabel=list.previousElementSibling;
    const shelf=document.createElement('section');shelf.id='candidateShelf';shelf.className='candidateShelf';shelf.innerHTML='<div class="candidateHead"><b>候補箱</b><span id="candidateCount">0本</span></div><div id="candidateRail" class="candidateRail"></div>';
    rankingLabel?.before(shelf);

    const themeChoices=document.getElementById('themeChoices');
    if(themeChoices&&!themeChoices.querySelector('[data-theme="champagne"]')){
      const luxe=document.createElement('button');luxe.className='themeChoice luxeTheme';luxe.dataset.theme='champagne';luxe.innerHTML='<span class="themeSwatch"></span>Editorial Luxe';
      themeChoices.prepend(luxe);luxe.onclick=()=>{document.getElementById('theme').value='champagne';syncThemeChoices();render()};
    }

    const actions=document.getElementById('saveList')?.parentElement;
    if(actions&&!document.getElementById('duplicateList')){
      const b=document.createElement('button');b.id='duplicateList';b.className='secondary';b.textContent='このリストを複製';b.onclick=duplicateList;actions.appendChild(b);
    }

    const originalRender=render;
    render=function(){originalRender();enhanceList();renderCandidates()};
    const go=document.getElementById('go'),input=document.getElementById('q');
    if(go)go.onclick=enhancedSearch;
    if(input)input.onkeydown=e=>{if(e.key==='Enter')enhancedSearch()};
    renderCandidates();enhanceList();
  }

  window.CinemapTools={addCandidate,duplicateList,renderCandidates};
  mount();
})();
