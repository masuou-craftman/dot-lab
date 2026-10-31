'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../dist/page-navigation.js'),'utf8');
const KEY='dotlab-page-handoff-v1';
function setup(options={}){
 const handlers={},docHandlers={},props=new Map(),store=options.store||new Map(),styles=[];
 const root={dataset:{},style:{setProperty:(k,v)=>props.set(k,v),removeProperty:k=>props.delete(k)}};
 const media={matches:!!options.reduced,addEventListener:(n,fn)=>handlers.media=fn};
 let observer;
 const location=new URL(options.url||'https://example.test/index.html');
 const document={documentElement:root,hidden:false,head:{append:s=>styles.push(s)},createElement:()=>({dataset:{},disabled:false}),querySelector:()=>options.controlOff?{}:null,addEventListener:(n,fn)=>docHandlers[n]=fn};
 if(!options.unsupported)document.startViewTransition=()=>{throw Error('Native link handling must not start a same-document transition');};
 const context={CSS:{registerProperty(){},supports(){return true;}},CSS:options.noCSS?undefined:{registerProperty:options.noRegistration?undefined:()=>{},supports:(feature)=>!(options.noMask&&feature==='mask-composite')&&!(options.noTypedSelector&&feature.startsWith('selector('))},document,location,URL,URLSearchParams,innerWidth:1000,innerHeight:800,Date,Math,JSON,Promise,console,
  matchMedia:()=>media,MutationObserver:class{constructor(fn){observer=fn}observe(){}},
  localStorage:{getItem:()=>{if(options.storageError)throw Error('denied');return options.localOff?'false':null;}},
  sessionStorage:{getItem:k=>{if(options.storageError)throw Error('denied');return store.get(k)||null;},setItem:(k,v)=>{if(options.storageError)throw Error('denied');store.set(k,v);},removeItem:k=>store.delete(k)},
  addEventListener:(n,fn)=>handlers[n]=fn};
 context.window=context;if(!options.unsupported){context.onpageswap=null;context.onpagereveal=null;}
 vm.runInNewContext(code,context,{filename:'page-navigation.js'});
 function click(url='https://example.test/next.html',overrides={}){
  let prevented=0;
  const a={href:url,target:'',hasAttribute:()=>false,getBoundingClientRect:()=>({left:100,top:200,width:60,height:40}),...overrides.anchor};
  const event={target:{closest:()=>a},button:0,detail:1,clientX:250,clientY:320,preventDefault:()=>prevented++,...overrides};
  docHandlers.click?.(event);assert.equal(prevented,0,'Never preventDefault on links');
 }
 return{context,root,props,store,styles,document,handlers,docHandlers,media,click,mutate:()=>observer?.(),fire:(name,event={})=>handlers[name]?.(event)};
}
function transition(){let resolve,reject;return{types:new Set(),ready:Promise.resolve(),skips:0,skipTransition(){this.skips++;},finished:new Promise((a,b)=>{resolve=a;reject=b;}),resolve:()=>resolve(),reject:()=>reject(Error('transition aborted'))};}
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
(async()=>{
 let h=setup({unsupported:true});assert.equal(h.styles.length,0);assert.equal(h.docHandlers.click,undefined);assert.equal(h.context.DotPageNavigation.motionOff(),false);
 for(const feature of ['noCSS','noRegistration','noMask','noTypedSelector']){const fallback=setup({[feature]:true});assert.equal(fallback.styles.length,0,feature+' must leave native navigation untouched');assert.equal(fallback.docHandlers.click,undefined);}
 for(const options of [{reduced:true},{localOff:true},{controlOff:true},{url:'https://example.test/index.html?labMotion=off'}]){
  h=setup(options);assert.equal(h.context.DotPageNavigation.motionOff(),true);const t=transition();h.fire('pagereveal',{viewTransition:t});assert.equal(t.skips,1);t.resolve();
 }
 h=setup();h.root.dataset.labMotion='off';h.mutate();assert.equal(h.context.DotPageNavigation.motionOff(),true);
 h=setup();h.click();let t=transition();h.fire('pageswap',{viewTransition:t,activation:{entry:{url:'https://example.test/next.html'}}});let saved=JSON.parse(h.store.get(KEY));assert.ok(t.types.has('dot-page'),'Only native page transitions receive page type');assert.equal(saved.point.x,.25);assert.equal(saved.point.y,.4);assert.equal(saved.off,false);
 const incoming=setup({url:'https://example.test/next.html',store:h.store});let incomingT=transition();incoming.fire('pagereveal',{viewTransition:incomingT});assert.equal(incoming.props.get('--dot-page-x'),'25vw');assert.equal(incoming.props.get('--dot-page-y'),'40vh');assert.equal(h.store.has(KEY),false);incomingT.resolve();await flush();assert.equal(incoming.props.size,0,'Finished reveal cleans positioning');
 for(const [url,override] of [['https://other.test/a',{}],['https://example.test/index.html#x',{}],['https://example.test/next.html',{ctrlKey:true}],['https://example.test/next.html',{defaultPrevented:true}],['https://example.test/next.html',{button:1}],['https://example.test/next.html',{anchor:{target:'_blank'}}],['https://example.test/next.html',{anchor:{hasAttribute:()=>true}}]]){
  h=setup();h.click(url,override);t=transition();h.fire('pageswap',{viewTransition:t,activation:{entry:{url:'https://example.test/next.html'}}});assert.equal(JSON.parse(h.store.get(KEY)).point,null,'Modified/external/download/same-document link ignored');t.resolve();
 }
 h=setup();h.click(undefined,{detail:0});t=transition();h.fire('pageswap',{viewTransition:t,activation:{entry:{url:'https://example.test/next.html'}}});saved=JSON.parse(h.store.get(KEY));assert.equal(saved.point.x,.13);assert.equal(saved.point.y,.275);t.resolve();
 // Browser Back: no click handoff required; position uses the default and no history mutation.
 h=setup();t=transition();h.fire('pagereveal',{viewTransition:t,activation:{navigationType:'traverse'}});assert.equal(h.props.get('--dot-page-x'),'50vw');assert.equal(h.props.get('--dot-page-y'),'42vh');t.reject();await flush();assert.equal(h.props.size,0,'Rejected reveal also cleans positioning');
 h=setup({storageError:true});h.click();t=transition();assert.doesNotThrow(()=>h.fire('pageswap',{viewTransition:t}));assert.doesNotThrow(()=>h.fire('pagereveal',{viewTransition:t}));t.resolve();await flush();assert.equal(h.props.size,0);
 h=setup({store:new Map([[KEY,'{malformed']])});t=transition();assert.doesNotThrow(()=>h.fire('pagereveal',{viewTransition:t}));t.resolve();await flush();
 h=setup();t=transition();h.fire('pagereveal',{viewTransition:t});h.media.matches=true;h.handlers.media();assert.ok(t.skips>0,'Changing to reduced motion skips active animation');t.resolve();await flush();
 h=setup();t=transition();h.fire('pagereveal',{viewTransition:t});h.document.hidden=true;h.docHandlers.visibilitychange();assert.equal(h.props.size,0,'Hidden incoming page cleans positioning');assert.ok(t.skips>0);t.resolve();await flush();
 h=setup();h.fire('pageswap',{});h.fire('pagereveal',{});assert.equal(h.props.size,0);
 // Cross-document root CSS must not override standalone same-document demos.
 h=setup();assert.match(h.styles[0].textContent,/:root:active-view-transition-type\(dot-page\)::view-transition-new\(root\)/);
 for(const off of [false,true]){
  h=setup({store:new Map([[KEY,JSON.stringify({url:'https://example.test/index.html',off,time:Date.now(),point:{url:'https://example.test/index.html',x:.2,y:.3}})]])});t=transition();h.fire('pagereveal',{viewTransition:t});assert.equal(t.skips,off?1:0);t.resolve();await flush();assert.equal(h.props.size,0);
 }
 h=setup({store:new Map([[KEY,JSON.stringify({url:'https://example.test/index.html',off:true,time:Date.now()-20000})]])});t=transition();h.fire('pagereveal',{viewTransition:t});assert.equal(t.skips,0,'Expired motion handoff ignored');t.resolve();await flush();
 // Four inherited numeric radii, not per-dot DOM/JS animation.
 const css=setup().styles[0].textContent;
 for(let i=0;i<4;i++){
  assert.match(css,new RegExp('@property --dot-radius-'+i+'\\{syntax:"<length>";inherits:true;initial-value:0px\\}'));
  assert.match(css,new RegExp('@keyframes dot-grid-'+i+'\\{from\\{--dot-radius-'+i+':0px\\}to\\{--dot-radius-'+i+':37px\\}\\}'));
  assert.ok(css.includes('dot-grid-'+i+' 360ms cubic-bezier(.76,0,.18,1) '+(i*35)+'ms both'));
 }
 assert.ok(css.includes('mask-composite:intersect'));assert.ok(css.includes('mask-composite:add'));
 assert.ok(css.includes('::view-transition-image-pair(root){background:#e5c54a;isolation:isolate;animation:'));
 assert.ok(!/requestAnimationFrame|setInterval|setTimeout/.test(code),'No animation frame JS or timers');
 // Each 96px tile has four centers, 48px apart. The farthest corner is
 // sqrt(24^2+24^2); the new snapshot is fully opaque at radius 37-2=35.
 const centers=[[24,24],[72,24],[24,72],[72,72]],opaqueRadius=37-2;
 assert.ok(opaqueRadius>Math.hypot(24,24),'Opaque new mask must cover diagonal gaps');
 for(let x=0;x<=96;x+=.5)for(let y=0;y<=96;y+=.5){
  const d=Math.min(...centers.map(([cx,cy])=>Math.hypot(x-cx,y-cy)));
  assert.ok(d<opaqueRadius,'New snapshot coverage gap at '+x+','+y);
  assert.ok(d<37,'Old snapshot is completely removed at end');
 }
 assert.ok(!/preventDefault\s*\(/.test(code));assert.ok(!/history\.(pushState|replaceState|go|back)\s*\(/.test(code));
 console.log('page-navigation: native semantics, motion preferences, capability fallback, cross-document handoff, Back, errors and cleanup passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
