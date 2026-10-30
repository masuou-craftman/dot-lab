(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HeadingModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const POINTS=[[80,230],[220,20],[420,340],[560,130]],DURATION=2800,SAMPLES=4096;
function clamp(p){if(!Number.isFinite(p))throw Error('Non-finite progress');return Math.min(1,Math.max(0,p))}
function point(t){t=clamp(t);const v=1-t;return {x:v*v*v*80+3*v*v*t*220+3*v*t*t*420+t*t*t*560,y:v*v*v*230+3*v*v*t*20+3*v*t*t*340+t*t*t*130}}
function derivative(t){t=clamp(t);const v=1-t;return {x:3*v*v*140+6*v*t*200+3*t*t*140,y:3*v*v*(-210)+6*v*t*320+3*t*t*(-210)}}
function buildLUT(samples=SAMPLES){if(!Number.isInteger(samples)||samples<2)throw Error('Invalid sample count');const entries=[{t:0,length:0}];let prev=point(0),total=0;for(let i=1;i<=samples;i++){const t=i/samples,p=point(t);total+=Math.hypot(p.x-prev.x,p.y-prev.y);entries.push({t,length:total});prev=p}return {entries,total,samples}}
const lut=buildLUT();
function parameterAtDistance(progress,table=lut){progress=clamp(progress);if(progress===0||progress===1)return progress;const target=progress*table.total;let lo=0,hi=table.entries.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(table.entries[mid].length<target)lo=mid;else hi=mid}const a=table.entries[lo],b=table.entries[hi],f=(target-a.length)/(b.length-a.length);return a.t+(b.t-a.t)*f}
function pose(progress,mode='tangent'){if(!['fixed','tangent'].includes(mode))throw Error('Unknown orientation');const t=parameterAtDistance(progress),center=point(t),d=derivative(t);return {...center,t,angle:mode==='fixed'?0:Math.atan2(d.y,d.x)*180/Math.PI}}
return {POINTS,DURATION,SAMPLES,point,derivative,buildLUT,parameterAtDistance,pose,length:lut.total};});
