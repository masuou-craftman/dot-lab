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
 const context={CSS:{registerProperty(){},supports(){return true;}},CSS:options.noCSS?undefined:{registerProperty:options.noRegistration?undefined:()=>{},supports:(feature)=>!(options.noMask&&feature==='mask-composite')&&!(options.noTypedSelector&&feature.startsWith('selector('))},document,location,URL,URLSearchParams,innerWidth:options.width||1000,innerHeight:options.height||800,Date,Math,JSON,Promise,console,
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
 // Coarse nonrepeating dots share diagonal bands from top-left to bottom-right.
 const viewports=[...[320,375,390,768,1000,1440,1920,3840].map(w=>[w,800]),[320,2400],[390,844],[800,320],[3840,2160],[320,5000],[5000,320]];
 for(const [width,height] of viewports){
  const env=setup({width,height}),css=env.styles[0].textContent;
  const targetCols=Math.max(4,Math.min(16,Math.ceil(width/112))),cell=Math.max(width/targetCols,height/16),cols=Math.ceil(width/cell),rows=Math.ceil(height/cell),bands=cols+rows-1,radius=Math.ceil(cell*Math.SQRT1_2)+2;
  const defaults=[...css.matchAll(/@property --dot-band-\d+\{[^}]*initial-value:([\d.]+)px/g)].map(m=>+m[1]);
  assert.equal(defaults.length,bands);assert.ok(defaults.every(r=>r===radius));
  assert.ok(cols<=16&&rows<=16&&cols*rows<=256&&bands<=31,'Bound masks and properties');
  for(let i=0;i<bands;i++)assert.ok(css.includes(`@keyframes dot-band-${i}{from{--dot-band-${i}:0px}to{--dot-band-${i}:${radius}px}}`));
  const animations=[...css.matchAll(/dot-band-(\d+) 360ms cubic-bezier\(\.25,\.25,\.45,1\) ([\d.]+)ms both/g)];
  assert.equal(animations.length,bands);
  for(let i=0;i<bands;i++){assert.equal(+animations[i][1],i);assert.ok(Math.abs(+animations[i][2]-i*180/Math.max(1,bands-1))<.001);}
  assert.ok(css.includes('animation-duration:540ms;background:transparent'));
  assert.ok(css.includes('mask-repeat:no-repeat;mask-composite:add'));
  const dots=[...css.matchAll(/radial-gradient\(circle at ([\d.]+)px ([\d.]+)px,#000 var\(--dot-band-(\d+)\)/g)].map(m=>({x:+m[1],y:+m[2],band:+m[3]}));
  assert.equal(dots.length,cols*rows);
  assert.ok(css.includes('mask-size:'+Array(cols*rows).fill(`${width}px ${height}px`).join(',')+';'),'Full viewport layers avoid tile seams');
  assert.ok(css.includes('mask-position:'+Array(cols*rows).fill('0px 0px').join(',')+';'));
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const dot=dots.find(d=>Math.abs(d.x-(x+.5)*cell)<1e-8&&Math.abs(d.y-(y+.5)*cell)<1e-8);
   assert.ok(dot,'Every grid center exists');assert.equal(dot.band,x+y,'Same x+y uses same radius/delay');
   if(x+1<cols)assert.ok(dot.band<(x+1+y));if(y+1<rows)assert.ok(dot.band<(x+y+1));
  }
  assert.equal(dots.find(d=>d.x===cell/2&&d.y===cell/2).band,0,'Top-left begins first');
  for(let x=0;x<=40;x++)for(let y=0;y<=40;y++)assert.ok(Math.min(...dots.map(d=>Math.hypot(width*x/40-d.x,height*y/40-d.y)))<radius,'Final viewport has no uncovered pixels');
  assert.ok(radius>Math.hypot(cell/2,cell/2),'Final and unanimated fallback cover tile corners');
  const old=css.match(/::view-transition-old\(root\)\{([^}]+)\}/)[1];assert.equal(old,'display:block;animation:none;mix-blend-mode:normal');
  assert.ok(!css.includes('#e5c54a'));assert.ok(!css.includes('mask-composite:intersect'));
  // The continuous curve has no held plateau or reversal.
  const bezier=(u,a,b)=>3*(1-u)*(1-u)*u*a+3*(1-u)*u*u*b+u*u*u;
  let last=0;for(let ms=1;ms<=360;ms++){let lo=0,hi=1;for(let k=0;k<40;k++){let mid=(lo+hi)/2;if(bezier(mid,.25,.45)<ms/360)lo=mid;else hi=mid;}let r=radius*bezier((lo+hi)/2,.25,1);assert.ok(r>last);last=r;}
  for(const dimension of ['innerWidth','innerHeight']){
   const resized=setup({width,height}),vt=transition();resized.fire('pagereveal',{viewTransition:vt});resized.context[dimension]+=100;resized.fire('resize');assert.ok(resized.styles[0].disabled);assert.ok(vt.skips>0);resized.fire('pageshow');assert.ok(resized.styles[0].disabled,'Any changed viewport dimension stays disabled');vt.resolve();await flush();
  }
 }
 assert.ok(!/requestAnimationFrame|setInterval|setTimeout/.test(code),'No animation frame JS or timers');
 assert.ok(!/preventDefault\s*\(/.test(code));assert.ok(!/history\.(pushState|replaceState|go|back)\s*\(/.test(code));
 console.log('page-navigation: native semantics, motion preferences, capability fallback, cross-document handoff, Back, errors and cleanup passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
