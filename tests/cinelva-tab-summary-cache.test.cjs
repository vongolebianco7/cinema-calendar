const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/cinelva-records-page.js','utf8');
test('restoring an already visible summary preserves its existing content instead of rebuilding it',()=>{
 const nodes={summaryView:{id:'summaryView',hidden:false},recordsView:{id:'recordsView',hidden:true}};
 const tabs=['summary','records'].map(tab=>({dataset:{tab},setAttribute(){}}));let summary=0,awards=0;
 const ctx={$:id=>nodes[id],TAB_STORAGE_KEY:'fixture',sessionStorage:{setItem(){}},document:{querySelectorAll:selector=>selector.includes('.tab')?tabs:Object.values(nodes)},renderCinemaSummary:()=>summary++,renderAwards:()=>awards++};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function setTab('),source.indexOf('  // Dashboard shortcuts'))+';globalThis.setTab=setTab;',ctx);
 ctx.setTab('summary');assert.equal(summary,0);assert.equal(awards,0);
 ctx.setTab('records');assert.equal(nodes.summaryView.hidden,true);ctx.setTab('summary');assert.equal(summary,1);assert.equal(awards,1);
});
