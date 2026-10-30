// Portable analytic math checks. Pass a staged/deployed-source HTML path as argv[2].
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=process.argv[2]||path.join(__dirname,'..','dist','motion-timing.html');
const html=fs.readFileSync(file,'utf8'),math=html.split('// MATH BEGIN')[1].split('// MATH END')[0],ctx={};vm.runInNewContext(math,ctx);
const curves={strong:[.76,0,.16,1],gentle:[0,0,.58,1],attack:[.16,1,.3,1],linear:null};
const expected={strong:[.568629,3.725638,.409045],gentle:[1.368289,1.073979,.674598],attack:[1.222532,.224562,.031218],linear:[1,1,1]};
let n=0;function close(a,b,tol=1e-6){assert.ok(Number.isFinite(a)&&Math.abs(a-b)<tol,`${a} ≠ ${b}`);n++}
for(const [name,p]of Object.entries(curves)){
 [.25,.5,.75].forEach((t,i)=>close(ctx.curveRate(t,p),expected[name][i]));
 for(let i=1;i<1000;i++){const t=i/1000,h=1e-5,finite=(ctx.curveProgress(t+h,p)-ctx.curveProgress(t-h,p))/(2*h);close(ctx.curveRate(t,p),finite,1e-5)}
 for(const t of [0,1e-12,1e-9,1e-6,.999999,1-1e-9,1-1e-12,1]){const rate=ctx.curveRate(t,p);assert.ok(Number.isFinite(rate)&&rate>=0);n++}
 for(const time of [.1,.25,.5,.9])for(const duration of [300,600,1200]){const distance=420;const physicalPlannedSpeed=ctx.curveRate(time,p)*distance/duration;const baselineSpeed=distance/duration;close(physicalPlannedSpeed/baselineSpeed,ctx.curveRate(time,p),1e-12)}
}
for(const [name,start,end]of [['strong',0,0],['gentle',1/.58,0],['attack',6.25,0],['linear',1,1]]){close(ctx.curveRate(0,curves[name]),start,1e-12);close(ctx.curveRate(1,curves[name]),end,1e-12)}
assert.ok(html.includes('id="rate-note" aria-live="off"'));assert.ok(html.includes("time<=0?'開始位置':time>=1?'到着位置'"));
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
console.log(JSON.stringify({result:'PASS',mathChecks:n,source:file,limits:'Analytic math and source checks only, not browser or DOM lifecycle'}));
