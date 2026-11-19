import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authorizationURL,exchangeUnified,accountCredential} from '../src/instagram-auth';
import {graph,type AppEnv,type Settings} from '../src/meta';
import {seal} from '../src/core';
import {digest} from '../src/core';
import worker from '../src/index';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {readFileSync} from 'node:fs';
const env={APP_KEY:'test-private-key',GRAPH_VERSION:'v25.0'} as AppEnv;
const cfg:Settings={appId:'12345678',appSecret:'private-secret',configId:'98765432',loginMode:'unified',owner:'Test',contact:'test@example.com',verifyToken:'test'};
test('new login uses config_id, old login keeps scopes; both carry state and exact callback',()=>{
 for(const mode of ['unified','instagram'] as const){
  const url=new URL(authorizationURL({...cfg,loginMode:mode},'https://panel.test','session-random-state'));
  assert.equal(url.searchParams.get('state'),'session-random-state');
  assert.equal(url.searchParams.get('redirect_uri'),'https://panel.test/oauth/callback');
  assert.equal(url.searchParams.get('response_type'),'code');
  assert.equal(url.searchParams.has('client_secret'),false);
  assert.equal(url.hostname,mode==='unified'?'www.facebook.com':'www.instagram.com');
  assert.equal(url.searchParams.has('config_id'),mode==='unified');
  assert.equal(url.searchParams.has('scope'),mode==='instagram');
 }
 assert.throws(()=>authorizationURL({...cfg,configId:''},'https://panel.test','state'));
});
test('unified code exchange discovers actual IG account, stores metadata encrypted, routes API per token',async()=>{
 const previous=globalThis.fetch,seen:URL[]=[];
 globalThis.fetch=async(input,init)=>{
  const url=new URL(String(input));seen.push(url);
  assert.equal(url.hostname,'graph.facebook.com');assert.ok(url.pathname.startsWith('/v26.0/'));
  if(url.pathname.endsWith('/oauth/access_token')){
   assert.equal(url.searchParams.get('code'),'test-code');
   return Response.json({access_token:'unified-test-token'});
  }
  assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer unified-test-token');
  if(url.pathname.endsWith('/me'))return Response.json({id:'111111',client_business_id:'222222'});
  if(url.pathname.endsWith('/assigned_instagram_accounts'))return Response.json({data:[{id:'333333',username:'testprofile'}]});
  return Response.json({id:'333333'});
 };
 try{
  const a=await exchangeUnified(env,cfg,'test-code');
  assert.equal(a.id,'333333');assert.equal(a.expires,0);assert.ok(!a.token.includes('unified-test-token'));
  const credential=await accountCredential(env,a);assert.equal(credential.unified,true);assert.equal(credential.accessToken,'unified-test-token');
  await graph(env,a,a.id+'?fields=id,username');assert.equal(seen.length,4);
  const old={...a,token:await seal('old-token',env.APP_KEY)};
  globalThis.fetch=async(input,init)=>{assert.equal(new URL(String(input)).host,'graph.instagram.com');assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer old-token');return Response.json({id:old.id});};
  await graph(env,old,old.id+'?fields=id');
 }finally{globalThis.fetch=previous;}
});
test('unified rejects ambiguous accounts instead of attaching a wrong profile',async()=>{
 const previous=globalThis.fetch;
 try{
  for(const data of [[],[{id:'1',username:'one'},{id:'2',username:'two'}]]){
   globalThis.fetch=async(input)=>{const url=String(input);return Response.json(url.includes('oauth/access_token')?{access_token:'test'}:url.includes('assigned_instagram_accounts')?{data}:{client_business_id:'222222'});};
   await assert.rejects(()=>exchangeUnified(env,cfg,'code'),/somente uma conta/);
  }
 }finally{globalThis.fetch=previous;}
});
test('OAuth callback requires matching session and one-time state, persists scoped unified account',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-09-15',d1Databases:['DB'],bindings:{APP_KEY:'test-private-key',ADMIN_PASSWORD:'test-password',GRAPH_VERSION:'v25.0',LICENSE_ENFORCEMENT:'disabled'}}));
 const original=globalThis.fetch;
 try{
  const e=await mf.getBindings<AppEnv>();
  for(const f of ['0001_initial.sql','0002_conversations.sql','0003_profiles.sql'])for(const sql of readFileSync('migrations/'+f,'utf8').split(';').map(s=>s.trim()).filter(Boolean))await e.DB.prepare(sql).run();
  const ctx={waitUntil(){}} as unknown as ExecutionContext;
  const request=(path:string,cookie='test-session',body?:unknown)=>worker.fetch(new Request('https://panel.test'+path,{method:body?'POST':'GET',headers:{Cookie:'dc_session='+cookie,Origin:'https://panel.test','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),e,ctx);
  for(const id of ['test-session','other-session'])await e.DB.prepare('INSERT INTO sessions VALUES(?,?)').bind(await digest(id),Math.floor(Date.now()/1000)+600).run();
  let response=await request('/api/settings','test-session',{...cfg,appSecret:'private-secret-long-enough'});assert.equal(response.status,200);
  response=await request('/oauth/start?add=1');assert.equal(response.status,302);
  const state=new URL(response.headers.get('Location')!).searchParams.get('state');assert.ok(state);
  let calls=0;globalThis.fetch=async(input)=>{calls++;const url=String(input);return Response.json(url.includes('oauth/access_token')?{access_token:'secret-token',expires_in:3600}:url.includes('assigned_instagram_accounts')?{data:[{id:'333333',username:'test'}]}:url.includes('/me?')?{client_business_id:'222222'}:{success:true});};
  response=await request('/oauth/callback?state='+state+'&code=secret-code','other-session');assert.ok(response.headers.get('Location')?.includes('cancelled'));assert.equal(calls,0);
  response=await request('/oauth/callback?state='+state+'&code=secret-code');assert.ok(response.headers.get('Location')?.includes('connection=ok'));assert.equal(calls,4);
  const stored=await e.DB.prepare('SELECT * FROM p333333_account').first<any>();assert.equal(stored.id,'333333');assert.equal((await accountCredential(e,stored)).unified,true);
  response=await request('/oauth/callback?state='+state+'&code=secret-code');assert.ok(response.headers.get('Location')?.includes('cancelled'));assert.equal(calls,4);
 }finally{globalThis.fetch=original;await mf.dispose();}
});
