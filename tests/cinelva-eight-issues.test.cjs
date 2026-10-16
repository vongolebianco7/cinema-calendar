const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const page=read('index.html'),ranking=read('rankings.html'),experience=read('experience.html'),search=read('search.html');
test('official CINELVA URL and legacy-preserving routing',()=>{
 assert.match(page,/rel="canonical" href="https:\/\/cinelva\.vercel\.app\//);
 assert.match(page,/href="my-cinelva\/" class="heroAction ghost"/);
 assert.match(read('README.md'),/Legacy frontend origin/);
});
test('three movie columns and balanced action layout on iPhone',()=>{
 assert.match(page,/\.streamingWeekMovies\{grid-template-columns:repeat\(3/);
 assert.match(page,/\.heroActions\{display:grid!important;grid-template-columns:repeat\(2/);
});
test('ranking deduplicates normalized identity after gross sorting',()=>{
 assert.match(ranking,/seenBox\.has\(key\)/);
 assert.match(ranking,/replace\(\/\[/);
 const box=JSON.parse(read('data/boxoffice.json'));
 const rows=(box.by_year||{})['1994']||[];
 const normalized=rows.map(m=>String(m.title).normalize('NFKC').toLowerCase().replace(/[\s　・:：!！?？'’"“”]/g,''));
 assert.ok(new Set(normalized).size<rows.length,'fixture contains normalized duplicates to guard');
});
test('Interstellar receives explicit IMAX recommendation evidence',()=>{
 assert.match(experience,/interstellar/);
 assert.match(experience,/s\.IMAX=5/);
 assert.match(experience,/www\.imax\.com\/movie\/interstellar/);
});
test('cast links and poster fallback are present',()=>{
 assert.match(search,/www\.themoviedb\.org\/search\/person/);
 assert.match(page,/function cinelvaCastLinks/);
 assert.match(page,/posterMissing/);
 assert.match(ranking,/img\.onerror=/);
});
test('document disabled automatic showtimes rather than falsely claiming coverage',()=>{
 assert.match(read('.github/workflows/update-theaters.yml'),/if:\s*\$\{\{ false \}\}/);
 assert.match(read('docs/cinelva-data-refresh-audit-20261017.md'),/Disabled/);
});
