const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(require('path').join(__dirname, '../dist/dot-mix.js'),'utf8');
const model=source.slice(source.indexOf('  function positions'),source.indexOf('  function mount'));
const positions=vm.runInNewContext(`(${model.trim()})`);
let samples=0;
for(const shape of ['grid','circle','scatter'])for(let seed=0;seed<1000;seed++){
 const p=positions(shape,seed);assert.equal(p.length,36);
 for(let i=0;i<36;i++){const r=i%7===0?6:4;assert(p[i].x-r>=0&&p[i].x+r<=480&&p[i].y-r>=0&&p[i].y+r<=260);for(let j=0;j<i;j++)assert(Math.hypot(p[i].x-p[j].x,p[i].y-p[j].y)>r+(j%7===0?6:4));samples++;}
}
assert.notDeepEqual(positions('scatter',18),positions('scatter',19));
class Node{constructor(){this.attrs={};this.dataset={};this.handlers={};this.children=[];this.textContent='';}setAttribute(k,v){this.attrs[k]=v;}hasAttribute(k){return k in this.attrs;}append(c){this.children.push(c);}remove(){this.removed=true;}addEventListener(k,v){this.handlers[k]=v;}removeEventListener(k){delete this.handlers[k];}closest(){return this;}}
const board=new Node(),group=new Node(),motion=new Node(),status=new Node();const choices=['circle','grid','scatter'].map(shape=>{const n=new Node();n.dataset.mixShape=shape;n.attrs['data-mix-shape']=shape;return n;});
const section=new Node();section.querySelector=s=>({'.dot-mix-board':board,'[data-mix-dots]':group,'[data-mix-motion]':motion,'[data-mix-status]':status}[s]);section.querySelectorAll=()=>choices;section.contains=()=>true;
let present=true;const main={contains:()=>present,querySelectorAll:()=>present?[section]:[]};let reconcile,globalChange,globalDisconnected=false;const media=new Node();media.matches=false;const doc=new Node();doc.documentElement=new Node();const win=new Node();doc.readyState='complete';doc.hidden=false;doc.querySelector=()=>main;doc.createElementNS=()=>new Node();let id=0,queue=new Map(),now=0;
vm.runInNewContext(source,{document:doc,window:win,matchMedia:()=>media,MutationObserver:class{constructor(cb){this.cb=cb;}observe(node){if(node===main)reconcile=this.cb;else globalChange=this.cb;}disconnect(){globalDisconnected=true;}},performance:{now:()=>now},requestAnimationFrame:cb=>{queue.set(++id,cb);return id;},cancelAnimationFrame:id=>queue.delete(id),Math,Object,Map});
assert.equal(group.children.length,36);assert.equal(queue.size,0);
const click=n=>section.handlers.click({target:n});click(board);assert.equal(queue.size,1);click(choices[2]);assert.equal(queue.size,1);
now=1000;for(const [key,cb] of [...queue]){queue.delete(key);cb(now);}assert.equal(queue.size,0);
click(board);assert.equal(queue.size,1);win.handlers.pagehide();assert.equal(queue.size,0);
click(board);doc.documentElement.dataset.labMotion='off';globalChange();assert.equal(queue.size,0);assert.equal(motion.disabled,true);assert(motion.textContent.includes('全体設定'));click(board);assert.equal(queue.size,0);click(motion);assert.equal(motion.attrs['aria-pressed'],'false');doc.documentElement.dataset.labMotion='on';globalChange();assert.equal(queue.size,0);assert.equal(motion.disabled,false);
click(motion);assert.equal(motion.attrs['aria-pressed'],'false');click(board);assert.equal(queue.size,0);
click(motion);assert.equal(queue.size,0);click(board);assert.equal(queue.size,1);media.matches=true;media.handlers.change();assert.equal(queue.size,0);assert.equal(motion.disabled,true);
media.matches=false;media.handlers.change();assert.equal(queue.size,0);click(board);assert.equal(queue.size,1);present=false;reconcile();assert.equal(queue.size,0);assert.equal(Object.keys(section.handlers).length,0);assert(group.children.every(d=>d.removed));assert(globalDisconnected);assert.equal(Object.keys(win.handlers).length,0);assert.equal(section.dataset.mixReady,'true');
console.log(`PASS ${samples} sampled dot bounds plus pairwise clearance; finite animation, rapid interruption, OFF/OS/global handling, pagehide snap, no resume autoplay, removal cleanup. Numerical geometry and VM DOM mock only, not browser validation.`);
