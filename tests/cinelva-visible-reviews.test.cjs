const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs');
const target=path.join(__dirname,'../js/cinelva-visible-reviews.js');
function api(){assert.ok(fs.existsSync(target),'visible review queue must exist');return require(target);}
function fake(){let callback;const watched=new Set();class Observer{constructor(cb){callback=cb}observe(node){watched.add(node)}unobserve(node){watched.delete(node)}disconnect(){watched.clear()}}return{Observer,watched,emit:entries=>callback(entries)};}
test('1000 offscreen reviews defer construction and visible entries mount once',()=>{
 const {create}=api(),observer=fake(),mounted=[],nodes=Array.from({length:1000},()=>({isConnected:true}));
 const queue=create({mount:node=>mounted.push(node),Observer:observer.Observer});queue.observe(nodes);assert.equal(mounted.length,0);assert.equal(observer.watched.size,1000);
 observer.emit([{target:nodes[0],isIntersecting:false}]);assert.equal(mounted.length,0);
 observer.emit([{target:nodes[0],isIntersecting:true},{target:nodes[0],isIntersecting:true}]);assert.deepEqual(mounted,[nodes[0]]);assert.equal(observer.watched.size,999);
 queue.observe(nodes);observer.emit([{target:nodes[0],isIntersecting:true}]);assert.equal(mounted.length,1);
});
test('replaced nodes release observations and cannot mount stale records',()=>{
 const {create}=api(),observer=fake(),mounted=[],old={isConnected:true},next={isConnected:true};
 const queue=create({mount:node=>mounted.push(node),Observer:observer.Observer});queue.observe([old]);old.isConnected=false;queue.observe([next]);assert.equal(observer.watched.has(old),false);
 observer.emit([{target:old,isIntersecting:true},{target:next,isIntersecting:true}]);assert.deepEqual(mounted,[next]);queue.disconnect();assert.equal(observer.watched.size,0);
});
test('without IntersectionObserver reviews remain immediately operable',()=>{
 const {create}=api(),mounted=[],node={isConnected:true};const queue=create({mount:n=>mounted.push(n),Observer:null});queue.observe([node,node]);assert.deepEqual(mounted,[node]);
});
