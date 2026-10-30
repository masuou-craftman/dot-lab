'use strict';
// Independent source regression; event/DOM simulation, not a browser observation.
const fs=require('fs'), vm=require('vm'), assert=require('assert/strict');
const root=require('path').join(__dirname,'../dist/');
function harness(code,extra={}){
 const ids={},events={},queue=new Map();let now=0,n=0;
 const node=()=>({style:{},attrs:{},events:{},value:'',classList:{add(){},toggle(){}},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.events[k]=f},focus(){doc.activeElement=this}});
 const get=s=>ids[s]||(ids[s]=node());const doc={hidden:false,activeElement:null,documentElement:node(),querySelector:get,querySelectorAll:()=>[],addEventListener:(k,f)=>events[k]=f};
 vm.runInNewContext(code,{...extra,document:doc,matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>now},requestAnimationFrame:f=>{queue.set(++n,f);return n},cancelAnimationFrame:n=>queue.delete(n),addEventListener:(k,f)=>events[k]=f});
 return {get,events,queue,setNow:t=>now=t,frame(t){const jobs=[...queue.values()];queue.clear();jobs.forEach(f=>f(t))}};
}
let failures=0;
function check(name,fn){try{fn();console.log('PASS',name)}catch(e){failures++;console.log('FAIL',name,'—',e.message)}}
let four=fs.readFileSync(root+'four-edges.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
check('FOUR EDGES resumed progress never moves backward on a stale first rAF',()=>{
 const h=harness(four);h.get('#progress').events.input({target:{value:'200'}});const before=h.get('#bar-0').attrs.transform;
 h.setNow(1000);h.get('#play').events.click();h.frame(984);
 console.log('  evidence',JSON.stringify({before,after:h.get('#bar-0').attrs.transform,clock:h.get('#clock').textContent,slider:h.get('#progress').value}));
 assert.equal(h.get('#bar-0').attrs.transform,before);
});
check('HEADING restored pagehide/pageshow status agrees with stopped clock',()=>{
 let heading=fs.readFileSync(root+'heading.js','utf8');
 const h=harness(heading,{HeadingModel:require(root+'heading-model.js')});
 h.get('#play').events.click();h.frame(700);h.events.pagehide();h.events.pageshow();
 console.log('  evidence',JSON.stringify({queue:h.queue.size,button:h.get('#play').textContent,status:h.get('#status').textContent}));
 assert.equal(h.queue.size,0);assert(!h.get('#status').textContent.includes('再生中'));
});
console.log('LIMIT: deterministic VM event order; not evidence of native browser BFCache ordering or an observed production incident.');
process.exitCode=failures?1:0;
