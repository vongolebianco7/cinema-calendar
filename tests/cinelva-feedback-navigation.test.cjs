const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

function htmlFiles(directory){
 return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
  const full=path.join(directory,entry.name);
  if(entry.isDirectory())return entry.name==='preview'?[]:htmlFiles(full);
  return entry.isFile()&&entry.name.endsWith('.html')?[full]:[];
 });
}

test('every shared drawer links to the feedback page with a route-correct relative URL',()=>{
 const root=path.resolve(__dirname,'..');
 const pages=htmlFiles(root).filter(file=>!file.startsWith(path.join(root,'preview')+path.sep));
 const menuPages=[];
 for(const file of pages){
  const source=fs.readFileSync(file,'utf8');
  const start=source.indexOf('id="gDrawer"');
  if(start<0)continue;
  const end=source.indexOf('</aside>',start);
  assert.notEqual(end,-1,path.relative(root,file)+' has a closed shared drawer');
  const drawer=source.slice(start,end);
  const relative=path.relative(path.dirname(file),path.join(root,'feedback.html')).split(path.sep).join('/');
  const links=[...drawer.matchAll(/<a href="([^"]*feedback\.html)">ご意見・ご要望<\/a>/g)];
  assert.equal(links.length,1,path.relative(root,file)+' has exactly one feedback link in its drawer');
  assert.equal(links[0][1],relative,path.relative(root,file)+' resolves feedback.html from its route');
  menuPages.push(file);
 }
 assert.equal(menuPages.length,26,'all main and mirrored shared drawers are checked');
});
