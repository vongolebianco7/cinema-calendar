const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('retired hidden weekly calendar does not scan records while annual calendar remains current',()=>{
 const source=fs.readFileSync('js/cinelva-records-page.js','utf8');let annual=0;
 const ctx={$:id=>id==='calendarView'?{hidden:true}:null,recordMovies(){throw Error('hidden weekly history must not be rebuilt')},renderYearHeatmap:()=>annual++};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function renderCalendar()'),source.indexOf('  function syncCalendarYear()'))+';renderCalendar();',ctx);
 assert.equal(annual,1);
});
