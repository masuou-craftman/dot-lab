/* DOT LAB: normalized time/value cubic segments, no external dependencies. */
(function(root){'use strict';
const EPS=.02, clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const mix=(a,b,t)=>a+(b-a)*t;
function cubic(u,a,b,c,d){const v=1-u;return v*v*v*a+3*v*v*u*b+3*v*u*u*c+u*u*u*d}
function seed(p){p=p||[1/3,1/3,2/3,2/3];return [{x:0,y:0,out:{x:p[0],y:p[1]},in:{x:0,y:0}},{x:1,y:1,in:{x:p[2],y:p[3]},out:{x:1,y:1}}]}
function segment(nodes,t){let i=0;while(i<nodes.length-2&&t>nodes[i+1].x)i++;return [nodes[i],nodes[i+1]]}
function solve(a,b,t){let lo=0,hi=1;for(let k=0;k<45;k++){let u=(lo+hi)/2;if(cubic(u,a.x,a.out.x,b.in.x,b.x)<t)lo=u;else hi=u}return(lo+hi)/2}
function value(nodes,t){t=clamp(t,0,1);if(t===0)return nodes[0].y;if(t===1)return nodes[nodes.length-1].y;const[a,b]=segment(nodes,t);return cubic(solve(a,b,t),a.y,a.out.y,b.in.y,b.y)}
function rate(nodes,t){const h=.00001,l=Math.max(0,t-h),r=Math.min(1,t+h);return(value(nodes,r)-value(nodes,l))/(r-l||1)}
function constrain(nodes){nodes.forEach((n,i)=>{n.y=clamp(n.y,0,1);for(const side of ['in','out']){const h=n[side];h.y=clamp(h.y,0,1);h.x=clamp(h.x,side==='in'?(nodes[i-1]?.x??n.x):n.x,side==='out'?(nodes[i+1]?.x??n.x):n.x)}});return nodes}
function move(nodes,i,x,y){let n=nodes[i];if(i===0||i===nodes.length-1)return nodes;const nx=clamp(x,nodes[i-1].x+EPS,nodes[i+1].x-EPS),ny=clamp(y,0,1),dx=nx-n.x,dy=ny-n.y;n.x=nx;n.y=ny;for(const side of ['in','out']){n[side].x+=dx;n[side].y+=dy}return constrain(nodes)}
function handle(nodes,i,side,x,y){const n=nodes[i];if((side==='in'&&i===0)||(side==='out'&&i===nodes.length-1))return nodes;n[side]={x:clamp(x,side==='in'?nodes[i-1].x:n.x,side==='out'?nodes[i+1].x:n.x),y:clamp(y,0,1)};return nodes}
function add(nodes,t,y){t=clamp(t,EPS,1-EPS);if(nodes.length>=10||nodes.some(n=>Math.abs(n.x-t)<EPS-1e-9))return -1;let i=nodes.findIndex(n=>n.x>t);const a=nodes[i-1],b=nodes[i],u=solve(a,b,t); // de Casteljau: inserting on curve does not change its shape.
const p=[a,a.out,b.in,b], lerp=(v,w)=>({x:mix(v.x,w.x,u),y:mix(v.y,w.y,u)});const q=[lerp(p[0],p[1]),lerp(p[1],p[2]),lerp(p[2],p[3])],r=[lerp(q[0],q[1]),lerp(q[1],q[2])],s=lerp(r[0],r[1]);a.out=q[0];b.in=q[2];const node={x:t,y:s.y,in:r[0],out:r[1]};nodes.splice(i,0,node);if(Number.isFinite(y))move(nodes,i,t,y);return i}
function remove(nodes,i){if(i<=0||i>=nodes.length-1)return false;nodes.splice(i,1);constrain(nodes);return true}
const api={EPS,clamp,seed,value,rate,move,handle,add,remove,constrain};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DotCurve=api;
})(typeof window!=='undefined'?window:globalThis);
