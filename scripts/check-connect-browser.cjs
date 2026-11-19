const { chromium } = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('https://directcash.test/**',r=>r.fulfill({contentType:'text/html',body:'<a href="/oauth/start?add=1">Adicionar conta</a><a href="/oauth/start">Conectar</a>'}));
 await page.goto('https://directcash.test/');
 await page.addScriptTag({path:'public/connect-browser.js'});
 await page.getByText('Adicionar conta',{exact:true}).click();
 assert.equal(await page.locator('#browser-connection input').inputValue(),'https://directcash.test/?connect_browser=add');
 assert.equal(await page.getByText('Continuar conexão neste navegador').getAttribute('href'),'/oauth/start?add=1');
 assert.ok(await page.locator('#browser-connection').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
 await page.getByText('Fechar',{exact:true}).click();
 await page.getByText('Conectar',{exact:true}).click();
 assert.equal(await page.getByText('Continuar conexão neste navegador').getAttribute('href'),'/oauth/start');
 await page.getByText('Fechar',{exact:true}).click();
 await page.evaluate(()=>{history.replaceState(null,'','/?connect_browser=add');window.resumeBrowserConnection();});
 assert.equal(await page.getByText('Continuar conexão neste navegador').getAttribute('href'),'/oauth/start?add=1');
 assert.equal(new URL(page.url()).search,'');
 console.log('PASS: mobile layout, add account, reconnect, browser resume.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
