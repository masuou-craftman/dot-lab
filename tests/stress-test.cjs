// Deterministic event-order testing using fake DOM; no browser claims.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').join(__dirname,'../dist/')+require('node:path').sep;
const prefix=fs.readFileSync(require('node:path').join(__dirname,'table-test.cjs'),'utf8').split('let passed=0,failed=0;')[0];
const tableSetup=new Function('require','process',prefix+'\nreturn setup;')(require,{argv:['node','test',root+'motion-table.js']});
function rng(seed){let n=seed>>>0;return max=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%max}}
const seeds=[0xD07,0xA11CE,0xBACC,0xC0FFEE],trace=[];let total=0;
function checkTable(seed){const r=rng(seed),t=tableSetup();assert.equal(t.cells.length,14);let reduced=false;
 for(let i=0;i<512;i++){const op=r(12);trace.push({suite:'table',seed,step:i,op});if(trace.length>12)trace.shift();
 switch(op){case 0:t.cell(r(14)).dispatch('click');break;case 1:t.ids.replay.dispatch('click');break;case 2:t.location.hash=['#stroke-shape','#direction','#reading-focus','#heading','#invalid','#detail',''][r(7)];t.window('hashchange');break;case 3:t.location.hash=t.history.entries[r(t.history.entries.length)];t.window('popstate');break;case 4:t.ids['motion-toggle'].dispatch('click');break;case 5:reduced=!reduced;t.reduce(reduced);break;case 6:t.visibility(!t.document.hidden);break;case 7:t.window('pagehide');assert.equal(t.frames.size,0);assert.equal(t.live().length,0);t.window('pageshow');break;case 8:{const value=r(2)?'true':'false';t.storage.set('dotlab-motion-enabled',value);t.window('storage',{key:'dotlab-motion-enabled',newValue:value});break}case 9:t.advance(r(1500));break;case 10:t.cell(r(14)).dispatch('focus');break;case 11:t.ids[r(2)?'motion-toggle':'replay'].focus();break;}
 assert.equal(t.cells.filter(c=>c.attrs['data-selected']==='true').length,1);
 assert.ok(t.frames.size<=1);assert.ok(t.live().length<=4);assert.ok(!(t.frames.size&&t.live().length));
 const off=t.ids['motion-toggle'].attrs['aria-pressed']==='false';if(t.document.hidden||reduced||off){assert.equal(t.frames.size,0);assert.equal(t.live().length,0)}
 const path=t.cell(8).querySelector('.a').getAttribute('points');assert.ok(path.split(/[ ,]+/).every(x=>Number.isFinite(Number(x))));
 total++;
 }
 t.window('pagehide');t.invokeCanceled();assert.equal(t.frames.size,0);assert.equal(t.cell(8).querySelector('.a').getAttribute('points'),'39.5,51.5 39.5,30.5 60.5,30.5 60.5,51.5 39.5,51.5');
}
function timingSetup(){const html=fs.readFileSync(root+'motion-timing.html','utf8'),code=html.match(/<script>([\s\S]*?)<\/script>/)[1];const ids={},events={},docEvents={},frames=new Map(),storage=new Map();let now=1000,serial=0;const mq={matches:false,events:[],addEventListener(k,f){this.events.push(f)}};
 for(const [,id] of html.matchAll(/\bid="([^"]+)"/g))ids[id]={style:{},attrs:{},events:{},disabled:false,addEventListener(k,f){this.events[k]=f},setAttribute(k,v){this.attrs[k]=v},focus(){document.activeElement=this},dispatch(k,value){if(k==='click'&&this.disabled)return;this.events[k]?.({target:{value}})}};
 const document={hidden:false,querySelector:s=>ids[s.slice(1)],documentElement:{classList:{add(){}}},addEventListener(k,f){docEvents[k]=f}};
 vm.runInNewContext(code,{document,matchMedia:()=>mq,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>now},requestAnimationFrame(f){frames.set(++serial,f);return serial},cancelAnimationFrame:id=>frames.delete(id),addEventListener(k,f){events[k]=f}});
 return {ids,document,mq,frames,storage,window:(k,e)=>events[k]?.(e),reduce(){mq.matches=!mq.matches;mq.events.forEach(f=>f())},visibility(){document.hidden=!document.hidden;docEvents.visibilitychange()},advance(ms){now+=ms;const batch=[...frames];frames.clear();batch.forEach(([id,f])=>f(now))}};
}
function checkTiming(seed){const r=rng(seed),t=timingSetup();
 for(let i=0;i<512;i++){const op=r(13);trace.push({suite:'timing',seed,step:i,op});if(trace.length>12)trace.shift();switch(op){case 0:t.ids.play.dispatch('click');break;case 1:t.ids.replay.dispatch('click');break;case 2:t.ids.reset.dispatch('click');break;case 3:t.ids.progress.dispatch('input',String(r(1001)));break;case 4:t.ids['curve-select'].dispatch('change',['strong','linear','attack','gentle'][r(4)]);break;case 5:t.ids['duration-select'].dispatch('change',['300','600','1200'][r(3)]);break;case 6:t.ids['motion-toggle'].dispatch('click');break;case 7:t.reduce();break;case 8:t.visibility();break;case 9:{const value=r(2)?'true':'false';t.storage.set('dotlab-motion-enabled',value);t.window('storage',{key:'dotlab-motion-enabled',newValue:value});break}case 10:t.advance(r(1500));break;case 11:t.window('pagehide');assert.equal(t.frames.size,0);t.window('pageshow');break;case 12:t.ids[['play','replay','motion-toggle','progress'][r(4)]].focus();break;}
 assert.ok(t.frames.size<=1);const off=t.ids['motion-toggle'].attrs['aria-pressed']==='false';if(t.document.hidden||t.mq.matches||off)assert.equal(t.frames.size,0);
 for(const id of ['linear-dot','selected-dot']){const x=parseFloat(t.ids[id].style.left);assert.ok(Number.isFinite(x)&&x>=0&&x<=100)}
 const progress=Number(t.ids.progress.value);assert.ok(Number.isFinite(progress)&&progress>=0&&progress<=1000);
 assert.ok(Math.abs(parseFloat(t.ids['linear-dot'].style.left)-progress/10)<=.051);
 for(const id of ['reference-cursor','curve-cursor']){const attrs=t.ids[id].attrs;assert.ok(+attrs.cx>=36-1e-9&&+attrs.cx<=276+1e-9);assert.ok(+attrs.cy>=16-1e-9&&+attrs.cy<=224+1e-9)}
 assert.equal(t.ids.play.disabled,Boolean(t.document.hidden||t.mq.matches||off));assert.equal(t.ids.replay.disabled,t.ids.play.disabled);
 total++;
 }
 t.window('pagehide');assert.equal(t.frames.size,0);
}
try{for(const seed of seeds){checkTable(seed);checkTiming(seed)}console.log(JSON.stringify({result:'PASS',seeds,actions:total,suites:['14-cell table','timing workbench'],limitations:'Fake DOM and scheduled callback queue only; not browser rendering, native event ordering, WAAPI interpolation, assistive technology, or physical devices.'},null,2))}catch(e){console.error('FAIL',e.stack,'LAST ACTIONS',trace);process.exitCode=1}
