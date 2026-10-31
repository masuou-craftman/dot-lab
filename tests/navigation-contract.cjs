// Static navigation contracts and isolated select() simulation; not a rendering test.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'../dist');
const slugs=['shared-image','filter-grid','process-path','action-feedback','dot-response','selection-ripple','reading-position','type-motion','stroke-shape','matte-depth'];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const url=(href,file)=>new URL(href,'https://example.test/'+file);
const anchors=s=>[...s.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/g)].map(m=>({attrs:m[1],text:m[2],href:/\bhref="([^"]*)"/.exec(m[1])?.[1]}));
let checks=0;
for(const slug of slugs){
 for(const original of [false,true]){
  const file=`studies/${original?'original/':''}${slug}/index.html`,html=read(file),links=anchors(html),prefix=original?'../../../':'../../';
  assert.ok(links.some(a=>a.href===prefix+'motion-table.html#'+slug),file+' returns to exact periodic-table item');checks++;
  assert.ok(!html.includes('10点の一覧'),file+' avoids old competing entry label');
  for(const a of links.filter(a=>/\bclass="brand"/.test(a.attrs))){const u=url(a.href,file);assert.equal(u.pathname,'/');assert.equal(u.hash,'#home');assert.equal(u.searchParams.get('siteDesign'),'dot-lab');checks++;}
  if(original){
   const nav=html.match(/<nav class="study-return-nav"[^>]*>([\s\S]*?)<\/nav>/g)||[];assert.equal(nav.length,1,file+' has exactly one return nav');
   assert.ok(links.some(a=>a.href===`../../${slug}/index.html`));assert.ok(links.some(a=>a.href===prefix+'?siteDesign=dot-lab#home'));checks+=3;
  }else assert.ok(links.some(a=>a.href===`../original/${slug}/index.html`),file+' original comparison remains');
  // All literal local anchor destinations (including template duplicates) remain present.
  for(const a of links){if(!a.href||a.href.includes('${')||/^(https?:|mailto:|tel:|javascript:)/.test(a.href))continue;const u=url(a.href,file);let target=path.join(root,decodeURIComponent(u.pathname));if(u.pathname.endsWith('/'))target=path.join(target,'index.html');assert.ok(fs.existsSync(target),file+' broken link '+a.href);checks++;}
 }
}
for(const file of ['four-edges.html','heading.html','motion-notes.html','motion-patterns.html','motion-table.html','motion-timing.html','overview.html','reading-focus.html']){
 const brand=anchors(read(file)).filter(a=>/\bclass="brand"/.test(a.attrs));assert.ok(brand.length);for(const a of brand){const u=url(a.href,file);assert.equal(u.pathname,'/');assert.equal(u.hash,'#home');assert.equal(u.searchParams.get('siteDesign'),'dot-lab');checks++;}
}
const legacy=read('studies/index.html');assert.ok(legacy.includes('<details>'));assert.ok(anchors(legacy).some(a=>a.href==='../motion-table.html'));for(const slug of slugs){assert.ok(anchors(legacy).some(a=>a.href===slug+'/index.html'));assert.ok(anchors(legacy).some(a=>a.href==='original/'+slug+'/index.html'));checks+=2;}
assert.ok(!/\$\('#table-back'\)\.href\s*=/.test(read('motion-patterns.html')),'Hash navigation must never rewrite brand home URL');
const table=read('motion-table.js'),select=table.match(/function select\(i,updateURL=false\)\{[\s\S]*?\nfunction sync\(/)[0].replace(/\nfunction sync\($/,'');
const ids={},elements=()=>({textContent:'',href:'',hidden:false,setAttribute(){}}),context={studies:[...slugs,'disclosure','direction','reading-focus','heading'].map((s,i)=>['x',s,s,'test',0,'description','use']),groups:[['test']],cells:[],base:'studies/',selected:0,document:{querySelector:s=>ids[s]||(ids[s]=elements())},location:{hash:''},history:{pushState(){}}};
vm.createContext(context);vm.runInContext(select,context);
for(const i of [...Array(14).keys(),0,13,5]){vm.runInContext(`select(${i})`,context);assert.equal(ids['#original-link'].hidden,i>=10);if(i<10)assert.notEqual(ids['#original-link'].href,ids['#demo-link'].href);checks++;}
assert.match(read('motion-table.html'),/#original-link\[hidden\][^{]*\{display:none!important\}/,'Author link display rules must not override hidden');
console.log(`navigation-contract: ${checks} checks passed (home brand, 20 demo routes, preserved comparison URLs, legacy entry, table selection)`);
