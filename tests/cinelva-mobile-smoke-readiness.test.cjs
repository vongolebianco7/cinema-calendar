const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const smoke = fs.readFileSync('scripts/mobile_smoke.mjs', 'utf8');

test('mobile smoke isolates every backend request from the live service', () => {
  assert.match(smoke, /context\.route\(\/backend-one-gray-94\\\.vercel\\\.app\\\/api\\\//);
  assert.doesNotMatch(smoke, /context\.route\(\/backend-one-gray-94\\\.vercel\\\.app\\\/api\\\/movies\//);
});

test('mobile smoke waits for index network activity before navigating away', () => {
  assert.match(smoke, /if\(path==='index\.html'\)await page\.waitForLoadState\('networkidle'/);
});

async function captureWithScreenshotError(message) {
  const vm=require('node:vm'), calls=[];
  const code=smoke.slice(smoke.indexOf(' const docHeight='),smoke.indexOf('\n}\nawait browser.close()'));
  const page={evaluate:async()=>5000,screenshot:async options=>{calls.push(options);if(calls.length===1)throw new Error(message)}};
  await vm.runInNewContext('(async()=>{'+code+'})()', {page,browserName:'webkit',path:'index.html',safeName:'index',console:{warn(){},log(){}}});
  return calls;
}
test('a page growing beyond WebKit screenshot limits still preserves viewport evidence',async()=>{
 const calls=await captureWithScreenshotError('page.screenshot: Cannot take screenshot larger than 32767 pixels on any dimension');
 assert.equal(calls.length,2);
 assert.equal(calls[0].fullPage,true);
 assert.equal(calls[1].fullPage,false);
 assert.equal(calls[1].path,calls[0].path);
});
test('screenshot capture never hides unrelated browser failures',async()=>{
 await assert.rejects(captureWithScreenshotError('browser has disconnected'),/browser has disconnected/);
});
