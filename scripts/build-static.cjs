const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const output = path.join(root, 'public');
const retiredRoutes = [
  'preview/ocean/index.html',
  'preview/ocean/ocean-demo.html',
  'preview/ocean/poc/index.html',
  'preview/ocean/real-fish/ecosystem.html',
  'preview/ocean/real-fish/index.html',
  'preview/ocean/real-fish/milestone-gallery.html',
  'preview/ocean/real-fish/ordinary-species-gallery.html',
  'preview/ocean/renderer/index.html',
];

// Require a clean output directory so an earlier build cannot retain old assets.
fs.mkdirSync(output);
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && /\.(html|png|svg|webmanifest)$/.test(entry.name)) {
    fs.copyFileSync(path.join(root, entry.name), path.join(output, entry.name));
  }
}
for (const directory of ['assets', 'js', 'data', 'preview', 'my-cinelva']) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), {
    recursive: true,
    filter(source) {
      const relative = path.relative(root, source).split(path.sep).join('/');
      if (relative !== 'preview/ocean' && !relative.startsWith('preview/ocean/')) return true;
      return retiredRoutes.some(route => route === relative || route.startsWith(relative + '/'));
    },
  });
}
// Build a single, deterministic TMDB-ID keyed movie master from source datasets.
// Source datasets retain only domain-specific facts (awards, grosses, screening dates).
function movieMaster(){
 const parse=name=>{try{return JSON.parse(fs.readFileSync(path.join(root,'data',name),'utf8'))}catch{return null}};
 const movies=new Map(),unresolved=[];
 const idOf=m=>Number(m?.tmdbId||m?.tmdb_id||m?.id||0);
 const posterOf=m=>String(m?.poster||m?.poster_url||m?.poster_path||m?.posterPath||'');
 function add(m,source){
  if(!m||typeof m!=='object')return;
  const id=idOf(m);
  if(!Number.isSafeInteger(id)||id<=0){if(m.title||m.film_title)unresolved.push({source,title:m.film_title||m.title,year:m.year||null});return}
  const old=movies.get(id)||{};
  const candidate={id,tmdbId:id,title:m.title||m.film_title||'',original_title:m.original_title||'',year:Number(m.release_year||m.year||String(m.release_date||'').slice(0,4))||0,poster:posterOf(m)};
  const result={...old};
  for(const key of ['title','original_title','year','poster'])if(!result[key]&&candidate[key])result[key]=candidate[key];
  result.id=id;result.tmdbId=id;movies.set(id,result);
 }
 const awards=parse('awards.json');for(const m of awards?.catalog||[])add(m,'awards.catalog');
 const box=parse('boxoffice.json');for(const m of box?.all_time||[])add(m,'boxoffice.all_time');
 for(const [year,rows] of Object.entries(box?.by_year||{}))for(const m of rows||[])add(m,'boxoffice.'+year);
 const ranked=parse('rankings.json');function walk(value){if(Array.isArray(value)){for(const m of value)if(m&&typeof m==='object'&&(m.title||m.original_title))add(m,'rankings');else walk(m)}else if(value&&typeof value==='object')for(const child of Object.values(value))walk(child)}
 if(ranked)walk(ranked.rankings||ranked);
 const data={schema_version:1,generated_at:new Date().toISOString(),movies:[...movies.values()].sort((a,b)=>a.id-b.id)};
 fs.writeFileSync(path.join(output,'data','movie-master.json'),JSON.stringify(data));
 fs.writeFileSync(path.join(output,'data','movie-master-audit.json'),JSON.stringify({unique_movies:movies.size,unresolved:unresolved.length,unresolved_examples:unresolved.slice(0,100)},null,2));
 console.log('Movie master:',movies.size,'unique TMDB IDs;',unresolved.length,'source records unresolved');
}
movieMaster();
console.log('Static site built; retired Ocean publishes only its eight legacy redirects.');
