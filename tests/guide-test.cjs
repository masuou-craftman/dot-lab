'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../dist/index.html','utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const source=scripts.find(s=>s.includes('window.MasuouAssistantGuide=Object.freeze'));const ctx={window:{}};vm.runInNewContext(source,ctx);const reply=ctx.window.MasuouAssistantGuide.reply;
for(const q of ['モーションエフェクト周期表','作品の動きを見たい','作ったものを見たい','FOUR EDGES','緩急を比べたい','イージング','組み合わせの習作'])assert.equal(reply(q).links[0].route,'works',q);
for(const [q,route] of [['ドットで遊びたい','home'],['ブログを読みたい','post/first-note'],['魔巣王って？','profile'],['活動先','links']])assert.equal(reply(q).links[0].route,route);
assert(reply('モーションエフェクト周期表').message.includes('14の習作'));
assert(reply('AIなの？').message.includes('AIに接続せず'));assert(!reply('AIなの？').message.includes('公開中'));
const assistant=scripts.find(s=>s.includes('let serviceURL=null;'));const block=assistant.slice(assistant.indexOf('let serviceURL=null;'),assistant.indexOf('    function draw(){'));
function resolve(staticFile,protocol='https:'){const env={document:{documentElement:{hasAttribute:n=>staticFile&&n==='data-single-file'}},location:{href:protocol+'//example.test/',protocol,origin:protocol+'//example.test'},URL,endpoint:'/api/assistant'};vm.runInNewContext(block+';globalThis.result=serviceURL;',env);return env.result;}
assert.equal(resolve(true),null,'Static build does not acquire an API URL');assert.equal(resolve(false),'https://example.test/api/assistant','Non-static API capability preserved');assert.equal(resolve(false,'file:'),null);
console.log('PASS 11 local guide intents, accurate local wording, static API suppression and non-static same-origin capability. Source/isolation tests, not network tracing.');
