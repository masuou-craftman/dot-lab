#!/usr/bin/env node
'use strict';
/* Dependency-free state-machine tests; intentionally not a browser/layout test.
   Usage: node focus-test.cjs [path/to/reading-focus.html]
   Mocks WAAPI frames and lifecycle events. Does NOT validate visual interpolation,
   CSS geometry, screen-reader behavior, actual BFCache or physical touch. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=process.argv[2]||require('node:path').join(__dirname,'../dist/reading-focus.html');
const html=fs.readFileSync(path,'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(scripts.length,1,'Expected current standalone study to have one inline script');
const source=scripts[0];
new vm.Script(source,{filename:path});
const KEY='dotlab-motion-enabled';
let assertions=0;
function check(condition,label){assert.ok(condition,label);assertions++}
function same(actual,expected,label){assert.equal(actual,expected,label);assertions++}
function harness({preference=null,reduced=false,throwGet=false,throwSet=false,noAnimate=false}={}){
  const log=[],created=[],maps=[],store=new Map(),windowEvents=new Map(),documentEvents=new Map();
  if(preference!==null)store.set(KEY,preference);
  const writes=[];
  let document;
  class ObservedMap extends Map{constructor(...args){super(...args);maps.push(this)}}
  function element(name){
    const listeners=new Map(),attrs={};let text='',inner='';
    const e={name,style:{transform:'none'},dataset:{},attrs,listeners,disabled:false,computed:null,
      classList:{contains(){return false},add(value){log.push(['class',name,value])}},
      setAttribute(k,v){attrs[k]=String(v);writes.push([name,'attribute',k,String(v)])},
      addEventListener(k,f){listeners.set(k,f)},
      focus(options){document.activeElement=e;log.push(['focus',name,options])}
    };
    Object.defineProperty(e,'textContent',{get:()=>text,set:v=>{text=v;writes.push([name,'text',v])}});
    Object.defineProperty(e,'innerHTML',{get:()=>inner,set:v=>{inner=v;writes.push([name,'html',v])}});
    e.animate=(frames,options)=>{
      const animation={element:e,frames,options,cancelCount:0,onfinish:null,
        cancel(){this.cancelCount++;e.computed=null;log.push(['cancel',name,this])}
      };
      created.push(animation);log.push(['animate',name,animation]);return animation;
    };
    return e;
  }
  const bars=Array.from({length:8},(_,i)=>{
    const e=element('bar'+i);e.dataset={x:String(i%4<2?-1:1),y:String(i<4?-1:1)};
    e.classList.contains=c=>c==='h'&&i%2===0;
    if(noAnimate)e.animate=undefined;
    return e;
  });
  const nodes=new Map(['#focus-toggle','#motion-toggle','#mode-label','#status','.reading','#reading-title'].map(s=>[s,element(s)]));
  nodes.get('.reading').textContent='CENTER CONTENT SENTINEL';
  nodes.get('#reading-title').textContent='FIXED TITLE SENTINEL';writes.length=0;
  document={hidden:false,activeElement:null,documentElement:element('document'),
    querySelector(selector){assert.ok(nodes.has(selector),'Unexpected selector: '+selector);return nodes.get(selector)},
    querySelectorAll(selector){assert.equal(selector,'.frame');return bars},
    addEventListener(k,f){documentEvents.set(k,f)}
  };
  const mq={matches:reduced,listener:null,addEventListener(event,f){assert.equal(event,'change');this.listener=f}};
  const storage={getItem(k){if(throwGet)throw new Error('Storage denied');return store.get(k)??null},setItem(k,v){if(throwSet)throw new Error('Storage denied');store.set(k,v)}};
  const context={document,matchMedia:q=>{assert.equal(q,'(prefers-reduced-motion: reduce)');return mq},localStorage:storage,Map:ObservedMap,
    getComputedStyle(e){log.push(['read',e.name,e.computed||e.style.transform]);return {transform:e.computed||e.style.transform}},
    addEventListener:(k,f)=>windowEvents.set(k,f),requestAnimationFrame(){throw Error('Unexpected animation loop')},setTimeout(){throw Error('Unexpected timer')}
  };
  vm.runInNewContext(source,context,{filename:path});
  same(maps.length,1,'One active-animation map');
  const active=maps[0];
  return {document,mq,bars,nodes,created,active,log,writes,store,
    click:selector=>nodes.get(selector).listeners.get('click')(),
    event:(event,data={})=>{const f=windowEvents.get(event)||documentEvents.get(event);assert.ok(f,'Missing event '+event);f(data)},
    setReduced:value=>{mq.matches=value;mq.listener()},
    setHidden:value=>{document.hidden=value;documentEvents.get('visibilitychange')()},
    setStorageErrors:(get,set)=>{throwGet=get;throwSet=set},
    assertContent(){same(nodes.get('.reading').textContent,'CENTER CONTENT SENTINEL','Body content untouched');same(nodes.get('#reading-title').textContent,'FIXED TITLE SENTINEL','Heading untouched');check(writes.every(w=>['#focus-toggle','#motion-toggle','#mode-label','#status'].includes(w[0])),'Only control/status DOM text or attributes are written')}
  };
}
function assertTarget(h,focused){
  same(h.nodes.get('#focus-toggle').attrs['aria-pressed'],String(focused),'Immediate semantic target');
  h.bars.forEach((bar,i)=>same(bar.style.transform,focused?'translate('+(Number(bar.dataset.x)*8)+'px,'+(Number(bar.dataset.y)*10)+'px) '+(i%2===0?'scaleX(.32)':'scaleY(.32)'):'translate(0px,0px) '+(i%2===0?'scaleX(1)':'scaleY(1)'),'Base transform is latest target'));
}
// No autoplay; instantaneous semantics; finite finish cleanup.
{
  const h=harness();same(h.created.length,0,'No animation on initialization');same(h.active.size,0,'No active initialization frames');assertTarget(h,false);
  h.click('#focus-toggle');assertTarget(h,true);same(h.active.size,8,'Exactly eight active animations');
  h.created.forEach(a=>{same(a.options.duration,420,'Own proposed duration');same(a.options.easing,'cubic-bezier(.16,1,.3,1)','Strong settling curve');a.onfinish()});
  same(h.active.size,0,'Finished animations removed from map');check(h.created.every(a=>a.cancelCount===1),'Finished effects cancelled');assertTarget(h,true);h.assertContent();
}
// Reverse using actual current computed transforms, not the previous target.
{
  const h=harness();h.click('#focus-toggle');const old=[...h.active.values()];
  h.bars.forEach((bar,i)=>bar.computed=`matrix(0.7, 0, 0, 1, ${i+1}, -4)`);
  h.log.length=0;h.click('#focus-toggle');assertTarget(h,false);
  same(h.active.size,8,'Reversal replaces rather than accumulates effects');
  const reads=h.log.filter(e=>e[0]==='read');same(reads.length,8,'Read all current transforms');
  same(h.log.findIndex(e=>e[0]==='cancel'),8,'All current transforms captured before cancellation');
  [...h.active.values()].forEach((a,i)=>same(a.frames[0].transform,`matrix(0.7, 0, 0, 1, ${i+1}, -4)`,'Reversal begins at visible interrupted position'));
  old.forEach(a=>{same(a.cancelCount,1,'Prior effect cancelled');a.onfinish()});same(h.active.size,8,'Stale finish cannot remove replacement animation');
  for(let n=0;n<100;n++){h.click('#focus-toggle');same(h.active.size,8,'Rapid input remains bounded to eight');assertTarget(h,n%2===0)}
  [...h.active.values()].forEach(a=>a.onfinish());same(h.active.size,0,'Final finite set drains');h.assertContent();
}
// OFF, OS override, focus retention, and latest target remains set after cancellation.
{
  const h=harness();h.click('#focus-toggle');h.click('#motion-toggle');same(h.active.size,0,'Manual OFF cancels');assertTarget(h,true);same(h.store.get(KEY),'false','Manual preference saved');
  let count=h.created.length;h.click('#focus-toggle');same(h.created.length,count,'OFF switches without animation');assertTarget(h,false);
  h.click('#motion-toggle');h.click('#focus-toggle');h.document.activeElement=h.nodes.get('#motion-toggle');h.setReduced(true);
  same(h.active.size,0,'OS reduce cancels');assertTarget(h,true);same(h.store.get(KEY),'true','OS override does not overwrite manual choice');
  same(h.document.activeElement,h.nodes.get('#focus-toggle'),'Disabled motion button transfers focus to mode button');same(h.nodes.get('#motion-toggle').disabled,true,'OS control disabled');
  check(h.log.some(e=>e[0]==='focus'&&e[2].preventScroll===true),'Focus fallback avoids scrolling');count=h.created.length;h.click('#focus-toggle');same(h.created.length,count,'OS reduced switches instantly');assertTarget(h,false);
  const unrelated=h.nodes.get('.reading');h.document.activeElement=unrelated;h.setReduced(true);same(h.document.activeElement,unrelated,'OS change does not steal unrelated focus');
  h.setReduced(false);same(h.nodes.get('#motion-toggle').attrs['aria-pressed'],'true','Manual ON restored after OS override');same(h.active.size,0,'No auto restart after OS override');h.assertContent();
}
// Background/page lifecycle cancellation and preference refresh on BFCache return.
{
  const h=harness();h.click('#focus-toggle');h.setHidden(true);same(h.active.size,0,'Hidden cancels');assertTarget(h,true);
  const count=h.created.length;h.setHidden(false);same(h.created.length,count,'Visibility return does not auto replay');
  h.click('#focus-toggle');h.event('pagehide');same(h.active.size,0,'Pagehide cancels');assertTarget(h,false);
  h.store.set(KEY,'false');h.event('pageshow');same(h.nodes.get('#motion-toggle').attrs['aria-pressed'],'false','Pageshow refreshes OFF preference');
  h.event('storage',{key:'unrelated',newValue:'true'});same(h.nodes.get('#motion-toggle').attrs['aria-pressed'],'false','Ignore unrelated storage event');
  h.event('storage',{key:KEY,newValue:'true'});same(h.nodes.get('#motion-toggle').attrs['aria-pressed'],'true','Cross-document preference applies');
  h.click('#focus-toggle');h.event('storage',{key:KEY,newValue:'false'});same(h.active.size,0,'Cross-document OFF cancels');assertTarget(h,true);h.assertContent();
}
// Restricted storage and missing WAAPI retain functional static UI.
{
  const h=harness({throwGet:true,throwSet:true});h.click('#focus-toggle');h.click('#motion-toggle');same(h.active.size,0,'Storage errors do not prevent OFF');h.event('pageshow');same(h.nodes.get('#motion-toggle').attrs['aria-pressed'],'false','Denied refresh retains in-memory preference');h.click('#focus-toggle');assertTarget(h,false);h.assertContent();
  const staticOnly=harness({noAnimate:true});staticOnly.click('#focus-toggle');same(staticOnly.created.length,0,'No WAAPI has static fallback');assertTarget(staticOnly,true);staticOnly.assertContent();
  const initiallyReduced=harness({preference:'true',reduced:true});initiallyReduced.click('#focus-toggle');same(initiallyReduced.created.length,0,'Initial OS reduce prevents animation');assertTarget(initiallyReduced,true);
  const initiallyOff=harness({preference:'false'});initiallyOff.click('#focus-toggle');same(initiallyOff.created.length,0,'Saved OFF respected on load');assertTarget(initiallyOff,true);
}
console.log(`PASS ${assertions} assertions: ${path}`);
console.log('Covered: reversal/current computed transforms; finite animation map; stale callbacks; immediate/latest target; manual/OS/lifecycle cancellation; shared preferences/storage exceptions/pageshow; endpoint focus fallback; immutable reading content.');
console.log('LIMITS: mocked DOM/WAAPI/media/storage. Not browser interpolation, CSS overlap, actual BFCache, assistive-tech or physical-device validation.');
