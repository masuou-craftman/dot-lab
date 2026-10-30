'use strict';
const assert=require('node:assert/strict'),M=require('../dist/heading-model.js');
// Independent quadrature reference: integrate derivative magnitude rather than
// compare a second polyline built from the same position sampler.
function speed(t){return Math.hypot(420+360*t-360*t*t,-630+3180*t-3180*t*t)}
function integrate(end,n=65536){let s=speed(0)+speed(end),h=end/n;for(let i=1;i<n;i++)s+=(i%2?4:2)*speed(i*h);return s*h/3}
const total=integrate(1);let maxResidual=0,maxHeadingError=0;
for(let i=0;i<=100;i++){const p=i/100,pose=M.pose(p,'tangent'),d=integrate(pose.t,4096)/total;maxResidual=Math.max(maxResidual,Math.abs(d-p));const expected=Math.atan2(-630+3180*pose.t-3180*pose.t**2,420+360*pose.t-360*pose.t**2)*180/Math.PI;maxHeadingError=Math.max(maxHeadingError,Math.abs(expected-pose.angle));const fixed=M.pose(p,'fixed');assert.equal(pose.x,fixed.x);assert.equal(pose.y,fixed.y);assert.equal(fixed.angle,0);}
assert(maxResidual<4e-8);assert(maxHeadingError<1e-10);assert(Math.abs(total-M.length)<.000012);
console.log(JSON.stringify({result:'PASS',method:'independent Simpson quadrature of expanded derivative',total,LUTlength:M.length,lengthError:M.length-total,maxResidual,maxHeadingError,samples:101,limit:'numerical source model, not browser timing or perceived usefulness'},null,2));
