const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve('public'),server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(404).end();return;}try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.fulfill({json:r.request().url().includes('/status')?{configured:true,appId:'12345678',loginMode:'unified',configId:'98765432',counts:[],profiles:[],licensingPaused:true}:r.request().url().includes('/rules')?[]:{data:[]}}));
 for(const width of [390,1280]){
 await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:'+server.address().port+'/#setup');await page.waitForLoadState('networkidle');
 assert.equal(await page.locator('[name=loginMode]').inputValue(),'unified');assert.equal(await page.locator('[name=configId]').inputValue(),'98765432');
 assert.ok(await page.locator('#meta-config-field').isVisible());assert.equal(await page.locator('#meta-app-label').textContent(),'ID do aplicativo Meta');
 await page.locator('[name=loginMode]').selectOption('instagram');assert.ok(await page.locator('#meta-config-field').isHidden());
 assert.equal(await page.locator('[name=configId]').isEnabled(),false);
 await page.locator('[name=loginMode]').selectOption('unified');assert.equal(await page.locator('[name=configId]').getAttribute('required'),'');
 assert.ok(await page.locator('#settings-form').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
 if(width===390){fs.mkdirSync('build-release',{recursive:true});await page.locator('#settings-form').screenshot({path:'build-release/unified-login-mobile.png'});}
 }
 assert.deepEqual(errors,[]);console.log('PASS: legacy/unified fields, saved config, mobile/desktop layout, no JS errors.');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
