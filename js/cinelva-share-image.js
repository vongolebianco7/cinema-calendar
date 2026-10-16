(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const records = globalThis.CinelvaLibraryRecords;
  const canvas = $('art'), ctx = canvas.getContext('2d');
  let imageUrl = '', renderToken = 0;
  const sizes = { portrait: [1200, 1500], square: [1200, 1200], landscape: [1600, 1000] };
  const escapeName = name => String(name || 'Cinelva').replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);
  const note = text => { $('status').textContent = text; };
  function selectedRecords() {
    let list = records.all().filter(item => item.watched !== false);
    const period = $('period').value;
    if (period === 'year') list = list.filter(item => String(item.watchedAt || '').slice(0, 4) === String(new Date().getFullYear()));
    return list.sort($('imageSort').value==='rating'?(a,b)=>(b.rating??-1)-(a.rating??-1)||String(a.title).localeCompare(String(b.title),'ja'):(a,b)=>String(b.watchedAt||'').localeCompare(String(a.watchedAt||''))||(b.rating??-1)-(a.rating??-1)).slice(0,12);
  }
  function loadPoster(url) {
    if (!url) return Promise.resolve(null);
    return new Promise(resolve => {
      const image=new Image();let settled=false;const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);resolve(value);};const timer=setTimeout(()=>{finish(null);image.src='';},6000);image.crossOrigin = 'anonymous';image.onload=()=>finish(image);image.onerror=()=>finish(null);image.src=url;
    });
  }
  async function render(withPosters = true) {
    const token=++renderToken;
    let list;
    try { list = selectedRecords(); } catch (error) { note(`記録を読み込めません：${error.message}`); return; }
    const year = new Date().getFullYear(), allTime = $('period').value === 'all';
    const total = records.all().filter(item => item.watched !== false && (allTime || String(item.watchedAt || '').slice(0, 4) === String(year))).length;
    const loaded = withPosters ? await Promise.all(list.map(item => loadPoster(item.poster))) : list.map(() => null);
    if(token!==renderToken)return null;
    const [width, height] = sizes[$('format').value] || sizes.portrait;
    canvas.width = width; canvas.height = height;
    const background = ctx.createLinearGradient(0, 0, width, height); background.addColorStop(0, '#f4efe4'); background.addColorStop(1, '#ddd1bb');
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#6d303c'; ctx.font = '700 28px system-ui'; ctx.fillText('CINELVA  /  MY FILM JOURNAL', 70, 76);
    ctx.fillStyle = '#292821'; ctx.font = '500 76px Georgia, "Yu Mincho", serif'; ctx.fillText(allTime ? 'My Cinema Life' : `${year} — The Films I Watched`, 70, 174, width - 140);
    ctx.fillStyle = '#706d63'; ctx.font = '28px system-ui'; ctx.fillText(`${total}本の鑑賞記録${list.length < total ? ` · 最新 ${list.length}本を表示` : ''}`, 72, 226);
    const columns = $('format').value === 'landscape' ? 4 : 3;
    const top = 280, bottom = 92, gap = 24, cardWidth = (width - 140 - (columns - 1) * gap) / columns;
    const cardHeight = Math.min(260, (height - top - bottom - Math.ceil(list.length / columns) * gap) / Math.max(1, Math.ceil(list.length / columns)));
    list.forEach((movie, index) => {
      const row = Math.floor(index / columns), column = index % columns, x = 70 + column * (cardWidth + gap), y = top + row * (cardHeight + gap);
      ctx.fillStyle = '#fffdf8'; ctx.fillRect(x, y, cardWidth, cardHeight);
      const image = loaded[index], imageHeight = Math.min(cardHeight - 82, cardWidth * 1.1);
      if (image) { const scale = Math.max(cardWidth / image.width, imageHeight / image.height), w = image.width * scale, h = image.height * scale; ctx.save(); ctx.beginPath(); ctx.rect(x, y, cardWidth, imageHeight); ctx.clip(); ctx.drawImage(image, x + (cardWidth - w)/2, y + (imageHeight-h)/2, w, h); ctx.restore(); }
      else { ctx.fillStyle = '#e8e0d2'; ctx.fillRect(x, y, cardWidth, imageHeight); ctx.fillStyle = '#5b4d40'; ctx.font = `600 ${Math.min(25, cardWidth/8)}px system-ui`; drawWrapped(ctx, movie.title || '作品名未登録', x + 12, y + 40, cardWidth - 24, 3, Math.min(25, cardWidth/8)); }
      const nameY = y + imageHeight + 34;
      ctx.fillStyle = '#292821'; ctx.font = `700 ${Math.min(22, cardWidth/8)}px system-ui`; drawWrapped(ctx, ($('imageSort').value==='rating'?`${index+1}. `:'')+(movie.title || '作品名未登録'), x + 12, nameY, cardWidth - 24, 2, Math.min(22, cardWidth/8));
      ctx.fillStyle = '#706d63'; ctx.font = `${Math.min(18, cardWidth/10)}px system-ui`; ctx.fillText(`${movie.year || '公開年不明'}${movie.rating == null ? ' · 未評価' : ` · ★ ${Number(movie.rating).toFixed(1)}`}`, x + 12, y + cardHeight - 14, cardWidth - 24);
    });
    if (!list.length) { ctx.fillStyle='#292821';ctx.font='36px system-ui';ctx.fillText('この期間の鑑賞記録はありません。',70,top+60); }
    ctx.fillStyle = '#706d63'; ctx.font = '18px system-ui'; ctx.fillText('Created with CINELVA · cinelva.vercel.app', 70, height - 35);
    if(withPosters&&loaded.some(Boolean)){ctx.font='14px system-ui';ctx.fillText('Poster images: TMDB · © respective rights holders',70,height-58);}
    const average = list.filter(item => typeof item.rating === 'number');
    $('summary').textContent = allTime ? '生涯の鑑賞実績' : `${year}年の鑑賞実績`;
    $('detail').textContent = `${total}本を記録${average.length ? ` · 表示作品の平均評価 ${(average.reduce((sum, item) => sum + item.rating, 0) / average.length).toFixed(1)}` : ''}`;
    return list;
  }
  function drawWrapped(context, text, x, y, maxWidth, maxLines, lineHeight) {
    let line = '', lines = [];
    for (const char of String(text)) { const candidate = line + char; if (line && context.measureText(candidate).width > maxWidth) { lines.push(line); line = char; } else line = candidate; }
    if (line) lines.push(line);
    for (const value of lines.slice(0, maxLines)) { context.fillText(value, x, y, maxWidth); y += lineHeight * 1.2; }
  }
  function toBlob() { return new Promise((resolve, reject) => { try { canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('画像を作成できませんでした。')), 'image/png'); } catch (error) { reject(error); } }); }
  async function makeImage() {
    try { await render(true); return await toBlob(); }
    catch (_) { await render(false); try { const blob = await toBlob(); note('ポスター画像は利用できなかったため、作品名カードで画像を作りました。'); return blob; } catch (error) { note(`画像を作成できません：${error.message}`); return null; } }
  }
  function setDownload(blob) { if (imageUrl) URL.revokeObjectURL(imageUrl); imageUrl=URL.createObjectURL(blob); $('download').href=imageUrl; $('download').download=`cinelva-${escapeName($('summary').textContent)}.png`; $('savePreview').src=imageUrl; }
  async function save() { const blob=await makeImage(); if(!blob)return;setDownload(blob);if(/iPhone|iPad|iPod/i.test(navigator.userAgent))$('saveDialog').showModal();else { const link=document.createElement('a');link.href=imageUrl;link.download=$('download').download;link.click();note('PNGをダウンロードしました。'); } }
  async function share() { const blob=await makeImage();if(!blob)return;setDownload(blob);const file=new File([blob],$('download').download,{type:'image/png'});if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'My Cinelva',text:'鑑賞実績を共有'});return;}catch(error){if(error.name==='AbortError')return;}}$('saveDialog').showModal(); }
  $('imageSort').onchange=()=>render();$('period').onchange=()=>render();$('format').onchange=()=>render();$('save').onclick=save;$('share').onclick=share;$('closeDialog').onclick=()=>$('saveDialog').close();
  try{render();}catch(error){note(`鑑賞記録を利用できません：${error.message}`);}
})();
