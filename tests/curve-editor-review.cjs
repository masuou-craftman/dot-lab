// Independent numerical/state checks. Not a browser or accessibility certification.
const assert=require('node:assert/strict');
const M=require('../dist/curve-editor-math.js');
let checks=0; function near(a,b,eps=2e-9){assert.ok(Number.isFinite(a)&&Math.abs(a-b)<eps,`${a} != ${b}`);checks++}
const cubic=(u,a,b,c,d)=>(1-u)**3*a+3*(1-u)**2*u*b+3*(1-u)*u*u*c+u**3*d;
for(const p of [[.76,0,.16,1],[0,0,.58,1],[.16,1,.3,1],null]){
 const n=M.seed(p),q=p||[1/3,1/3,2/3,2/3];
 for(let j=0;j<=1000;j++){let u=j/1000;near(M.value(n,cubic(u,0,q[0],q[2],1)),cubic(u,0,q[1],q[3],1));}
 const before=Array.from({length:1001},(_,i)=>M.value(n,i/1000));
 for(const t of [.21,.53,.81])assert.ok(M.add(n,t)>=0);
 before.forEach((v,i)=>near(M.value(n,i/1000),v));
 assert.equal(M.add(n,.21),-1);assert.equal(M.remove(n,0),false);assert.equal(M.remove(n,n.length-1),false);
 const s=JSON.stringify(n);M.move(n,0,.4,.7);M.move(n,n.length-1,.3,.1);assert.equal(JSON.stringify(n),s);
 for(let k=0;k<120;k++){
  const i=1+k%(n.length-2);M.move(n,i,(k%9)/8,(k%7)/6);M.handle(n,i,'in',k%2?Infinity:-10,k%3?NaN:10);M.handle(n,i,'out',k%2?10:NaN,k%3?-10:Infinity);
  for(let j=0;j<n.length;j++){assert.ok(Number.isFinite(n[j].x)&&Number.isFinite(n[j].y));if(j)assert.ok(n[j].x-n[j-1].x>=M.EPS-1e-9)}
  for(let j=0;j<=100;j++){const t=j/100,v=M.value(n,t);assert.ok(Number.isFinite(v)&&v>=-1e-12&&v<=1+1e-12);assert.ok(Number.isFinite(M.rate(n,t)));checks+=2}
 }
 near(M.value(n,0),0);near(M.value(n,1),1);
}
const n=M.seed();for(let i=1;i<9;i++)assert.ok(M.add(n,i/10)>=0);assert.equal(n.length,10);assert.equal(M.add(n,.91),-1);
console.log(`PASS independent curve math: ${checks} checks. Limits: numeric model only, not browser.`);
// Minimal DOM simulation exercises the actual page/controller integration. Not a real browser.
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dist/motion-timing.html'),'utf8');
class El{constructor(){this.style={};this.attrs={};this.events={};this.children=[];this.value='';this.disabled=false;this.classList={add(){},remove(){}}}setAttribute(k,v){this.attrs[k]=v}addEventListener(k,f){this.events[k]=f}append(...a){this.children.push(...a)}replaceChildren(...a){this.children=a}get options(){return this.children}get valueAsNumber(){return this.value===''?NaN:Number(this.value)}focus(){doc.activeElement=this}dispatch(k,p={}){this.events[k]?.({target:this,preventDefault(){},...p})}}
const ids={};for(const[,id]of html.matchAll(/\bid="([^"]+)"/g))ids[id]=new El;
ids['edit-part'].children=['point','in','out'].map(value=>Object.assign(new El,{value}));
const graph=new El,customOption=new El;graph.setPointerCapture=()=>{};graph.getScreenCTM=()=>({inverse(){return {}}});const doc={hidden:false,activeElement:null,documentElement:{classList:{add(){}}},querySelector(s){return s==='.graph'?graph:s==='#curve-select option[value=custom]'?customOption:ids[s.slice(1)]},createElement:()=>new El,createElementNS:()=>new El,addEventListener(){}};
let now=0,seq=0,frames=new Map;const ctx={document:doc,console,matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{getItem(){return null},setItem(){}},performance:{now:()=>now},requestAnimationFrame(f){frames.set(++seq,f);return seq},cancelAnimationFrame(id){frames.delete(id)},addEventListener(){}};ctx.window=ctx;ctx.DOMPoint=class{constructor(x,y){this.x=x;this.y=y}matrixTransform(){return this}};
vm.createContext(ctx);for(const f of ['curve-editor-math.js','curve-editor.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../dist',f),'utf8'),ctx);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
const input=(id,v)=>{ids[id].value=String(v);ids[id].dispatch('input')};
assert.equal(ids['curve-select'].value,'custom');assert.equal(ids['edit-count'].textContent,'3 / 10 POINTS');assert.equal(frames.size,0);input('progress',500);ids['edit-y'].value='80';ids['edit-y'].dispatch('change');assert.equal(ids['selected-value'].textContent,'80.0 %');near(ids['curve-cursor'].attrs.cy,224-.8*208);
ids['editor-keyboard'].dispatch('keydown',{key:'ArrowDown',shiftKey:true});assert.equal(ids['selected-value'].textContent,'75.0 %');ids['edit-delete'].dispatch('click');assert.equal(ids['edit-count'].textContent,'2 / 10 POINTS');
ids['edit-reset'].dispatch('click');const baseline=M.value(M.seed([.76,0,.16,1]),.5);assert.equal(ids['selected-value'].textContent,(baseline*100).toFixed(1)+' %');
ids['replay'].dispatch('click');now=600;for(const[id,f]of[...frames]){frames.delete(id);f(now)}assert.equal(ids['selected-value'].textContent,'100.0 %');assert.equal(frames.size,0);
ids['motion-toggle'].dispatch('click');assert.equal(ids.play.disabled,true);input('progress',500);assert.equal(ids['selected-value'].textContent,(baseline*100).toFixed(1)+' %');
console.log('PASS simulated integration: editable nodes drive path, cursor, track, keyboard, reset, replay, and OFF scrubbing.');

// Fresh editing after a preset change, drag then release preview exactly once.
ids['curve-select'].value='strong';ids['curve-select'].dispatch('change');ids['edit-start'].dispatch('click');
ids['release-preview'].checked=true;ids['motion-toggle'].dispatch('click');
const pointTarget={closest(){return {dataset:{index:'0',part:'out'}}}};
const pe=(type,x,y)=>graph.dispatch(type,{type,button:0,pointerId:1,clientX:x,clientY:y,target:pointTarget});
pe('pointerdown',200,224);pe('pointermove',100,120);assert.equal(frames.size,0);pe('pointerup',100,120);assert.equal(frames.size,1);now+=600;for(const[id,f]of[...frames]){frames.delete(id);f(now)}assert.equal(frames.size,0);
// Cancel/lost capture never initiates playback.
pe('pointerdown',100,120);pe('pointermove',110,120);pe('pointercancel',110,120);assert.equal(frames.size,0);pe('lostpointercapture',110,120);assert.equal(frames.size,0);
// OFF remains still even on a release and undo; manual position feedback still changes.
ids['motion-toggle'].dispatch('click');pe('pointerdown',110,120);pe('pointermove',130,160);pe('pointerup',130,160);assert.equal(frames.size,0);ids['quick-undo'].dispatch('click');assert.equal(frames.size,0);
// Hidden document blocks a delayed release preview too.
ids['motion-toggle'].dispatch('click');pe('pointerdown',110,120);pe('pointermove',140,170);doc.hidden=true;pe('pointerup',140,170);assert.equal(frames.size,0);doc.hidden=false;
console.log('PASS direct manipulation simulation: no boot autoplay, one release playback, cancel/lost capture/OFF/hidden gates, undo OFF.');
// Preset boundaries discard edit history; selecting without moving adds no undo entry.
ids['curve-select'].value='gentle';ids['curve-select'].dispatch('change');ids['edit-start'].dispatch('click');assert.equal(ids['quick-undo'].disabled,true);
pe('pointerdown',100,120);pe('pointerup',100,120);assert.equal(ids['quick-undo'].disabled,true);
// A second pointer cannot terminate the first pointer's ongoing gesture.
pe('pointerdown',100,120);pe('pointermove',120,150);graph.dispatch('pointerup',{type:'pointerup',button:0,pointerId:2,clientX:240,clientY:60,target:pointTarget});assert.equal(frames.size,0);pe('pointerup',120,150);assert.equal(frames.size,1);
console.log('PASS gesture identity, no-op selection, and preset history boundary.');
