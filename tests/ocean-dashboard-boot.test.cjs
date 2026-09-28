const assert=require('assert');const fs=require('fs');const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','preview/ocean/ocean-demo.html'),'utf8');
const boot=fs.readFileSync(path.join(__dirname,'..','preview/ocean/js/ocean-demo.js'),'utf8');
assert.ok(html.includes('id="dashboard" hidden'),'dashboard starts hidden until JS initializes it');
assert.ok(html.includes('src="js/ocean-demo.js?v=6"'),'dashboard boot script is loaded');
assert.ok(boot.includes('dashboard.hidden=false'),'boot explicitly reveals dashboard');
assert.ok(boot.includes("catch(err)"),'boot has a graceful failure path');
assert.ok(boot.includes('dashboard)dashboard.hidden=false'),'failure path keeps page content visible');
console.log('Ocean dashboard boot regression test passed');
