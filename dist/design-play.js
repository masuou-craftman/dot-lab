/* A small physical response on work posters. Links keep their native behavior. */
(() => {
 'use strict';
 const root=document.documentElement, main=document.querySelector('#main');
 if(!main)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'), fine=matchMedia('(hover: hover) and (pointer: fine)');
 let active=null, frame=0, point=null;
 const allowed=()=>!reduce.matches&&fine.matches&&root.dataset.labMotion!=='off'&&root.dataset.siteDesign==='dot-lab';
 function reset(){if(frame)cancelAnimationFrame(frame);frame=0;point=null;if(active){active.style.removeProperty('--tilt-x');active.style.removeProperty('--tilt-y');active=null;}}
 function paint(){frame=0;if(!active?.isConnected||!allowed()){reset();return;}const b=active.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(point.x-b.left)/b.width*2-1)),y=Math.max(-1,Math.min(1,(point.y-b.top)/b.height*2-1));active.style.setProperty('--tilt-x',(-y*3).toFixed(2)+'deg');active.style.setProperty('--tilt-y',(x*3).toFixed(2)+'deg');}
 main.addEventListener('pointermove',e=>{if(!allowed()||e.pointerType==='touch'){reset();return;}const card=e.target.closest('.feature-card,.motion-work');const visual=card?.querySelector('.feature-visual,.motion-work-art,.composition-work-art');if(!visual){reset();return;}if(active!==visual){reset();active=visual;}point={x:e.clientX,y:e.clientY};if(!frame)frame=requestAnimationFrame(paint);});
 main.addEventListener('pointerleave',reset);
 main.addEventListener('pointerout',e=>{if(active&&!e.relatedTarget?.closest?.('.feature-card,.motion-work'))reset();});
 new MutationObserver(reset).observe(main,{childList:true});
 new MutationObserver(()=>{if(!allowed())reset();}).observe(root,{attributes:true,attributeFilter:['data-site-design','data-lab-motion']});
 reduce.addEventListener('change',reset);fine.addEventListener('change',reset);window.addEventListener('pagehide',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
})();
