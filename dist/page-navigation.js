/* Progressive enhancement only: native navigation, history and link semantics stay intact.
 * https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
 * Four staggered CSS dot-mask phases; no per-frame JS or dot DOM.
 * https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/interactive-content-reveal
 * No click interception, network requests, overlays, timers or navigation delay. */
(()=>{'use strict';
 const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const key='dotlab-page-handoff-v1';
 let point=null, active=null;
 function motionOff(){
  if(reduced.matches||root.dataset.labMotion==='off'||new URLSearchParams(location.search).get('labMotion')==='off')return true;
  try{if(localStorage.getItem('dotlab-motion-enabled')==='false')return true;}catch{}
  return !!document.querySelector('#motion[aria-checked="false"],#motion-toggle[aria-pressed="false"]');
 }
 window.DotPageNavigation=Object.freeze({motionOff});
 if(!window.CSS?.registerProperty||!CSS.supports('mask-composite','intersect')||!CSS.supports('selector(:active-view-transition-type(dot-page))')||!('onpageswap' in window)||!('onpagereveal' in window)||!document.startViewTransition)return;
 const style=document.createElement('style');style.dataset.dotPageNavigation='';
 style.textContent=`@view-transition{navigation:auto}
 @property --dot-radius-0{syntax:"<length>";inherits:true;initial-value:0px}
 @property --dot-radius-1{syntax:"<length>";inherits:true;initial-value:0px}
 @property --dot-radius-2{syntax:"<length>";inherits:true;initial-value:0px}
 @property --dot-radius-3{syntax:"<length>";inherits:true;initial-value:0px}
 :root:active-view-transition-type(dot-page)::view-transition, :root:active-view-transition-type(dot-page)::view-transition-group(*), :root:active-view-transition-type(dot-page)::view-transition-image-pair(*), :root:active-view-transition-type(dot-page)::view-transition-old(*), :root:active-view-transition-type(dot-page)::view-transition-new(*){pointer-events:none}
 :root:active-view-transition-type(dot-page)::view-transition-group(root){animation-duration:465ms;background:#e5c54a}
 :root:active-view-transition-type(dot-page)::view-transition-image-pair(root){background:#e5c54a;isolation:isolate;animation:dot-grid-0 360ms cubic-bezier(.76,0,.18,1) 0ms both,dot-grid-1 360ms cubic-bezier(.76,0,.18,1) 35ms both,dot-grid-2 360ms cubic-bezier(.76,0,.18,1) 70ms both,dot-grid-3 360ms cubic-bezier(.76,0,.18,1) 105ms both}
 :root:active-view-transition-type(dot-page)::view-transition-old(root){display:block;animation:none;mix-blend-mode:normal;mask-image:radial-gradient(circle at 25% 25%,transparent var(--dot-radius-0),#000 calc(var(--dot-radius-0) + 1px)),radial-gradient(circle at 75% 25%,transparent var(--dot-radius-1),#000 calc(var(--dot-radius-1) + 1px)),radial-gradient(circle at 25% 75%,transparent var(--dot-radius-2),#000 calc(var(--dot-radius-2) + 1px)),radial-gradient(circle at 75% 75%,transparent var(--dot-radius-3),#000 calc(var(--dot-radius-3) + 1px));mask-size:96px 96px;mask-position:calc(var(--dot-page-x,50vw) - 24px) calc(var(--dot-page-y,42vh) - 24px);mask-composite:intersect}
 :root:active-view-transition-type(dot-page)::view-transition-new(root){animation:none;mix-blend-mode:normal;mask-image:radial-gradient(circle at 25% 25%,#000 max(0px,calc(var(--dot-radius-0) - 2px)),transparent max(.1px,calc(var(--dot-radius-0) - 1px))),radial-gradient(circle at 75% 25%,#000 max(0px,calc(var(--dot-radius-1) - 2px)),transparent max(.1px,calc(var(--dot-radius-1) - 1px))),radial-gradient(circle at 25% 75%,#000 max(0px,calc(var(--dot-radius-2) - 2px)),transparent max(.1px,calc(var(--dot-radius-2) - 1px))),radial-gradient(circle at 75% 75%,#000 max(0px,calc(var(--dot-radius-3) - 2px)),transparent max(.1px,calc(var(--dot-radius-3) - 1px)));mask-size:96px 96px;mask-position:calc(var(--dot-page-x,50vw) - 24px) calc(var(--dot-page-y,42vh) - 24px);mask-composite:add}
 @keyframes dot-grid-0{from{--dot-radius-0:0px}to{--dot-radius-0:37px}}
 @keyframes dot-grid-1{from{--dot-radius-1:0px}to{--dot-radius-1:37px}}
 @keyframes dot-grid-2{from{--dot-radius-2:0px}to{--dot-radius-2:37px}}
 @keyframes dot-grid-3{from{--dot-radius-3:0px}to{--dot-radius-3:37px}}
 @media(prefers-reduced-motion:reduce){::view-transition-group(*),::view-transition-new(*),::view-transition-old(*),::view-transition-image-pair(*){animation:none!important}}`;
 document.head.append(style);
 function sync(){style.disabled=motionOff();if(style.disabled)active?.skipTransition();}
 function clear(){active?.skipTransition();active=null;point=null;root.style.removeProperty('--dot-page-x');root.style.removeProperty('--dot-page-y');}
 // Read only the final unmodified primary click. Never preventDefault or alter a URL.
 document.addEventListener('click',e=>{
  point=null;
  const a=e.target.closest?.('a[href]');
  if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return;
  const url=new URL(a.href,location.href);
  if(url.origin!==location.origin||(url.pathname===location.pathname&&url.search===location.search))return;
  const r=a.getBoundingClientRect();point={url:url.href,x:(e.detail?e.clientX:r.left+r.width/2)/innerWidth,y:(e.detail?e.clientY:r.top+r.height/2)/innerHeight};
 });
 addEventListener('pageswap',e=>{
  if(!e.viewTransition)return;
  active=e.viewTransition;active.ready?.catch(()=>{});active.types?.add('dot-page');
  const off=motionOff();if(off)active.skipTransition();
  try{sessionStorage.setItem(key,JSON.stringify({url:e.activation?.entry?.url,point,off,time:Date.now()}));}catch{}
 });
 addEventListener('pagereveal',e=>{
  if(!e.viewTransition)return;
  active=e.viewTransition;active.ready?.catch(()=>{});active.types?.add('dot-page');let saved=null;
  try{saved=JSON.parse(sessionStorage.getItem(key));sessionStorage.removeItem(key);}catch{}
  const valid=saved&&saved.url===location.href&&Date.now()-saved.time<15000;
  if(motionOff()||(valid&&saved.off)){active.skipTransition();return;}
  const p=valid&&saved.point?.url===location.href?saved.point:null;
  root.style.setProperty('--dot-page-x',`${Math.max(0,Math.min(1,p?.x??.5))*100}vw`);
  root.style.setProperty('--dot-page-y',`${Math.max(0,Math.min(1,p?.y??.42))*100}vh`);
  const transition=active;transition.finished.catch(()=>{}).finally(()=>{if(active===transition){active=null;root.style.removeProperty('--dot-page-x');root.style.removeProperty('--dot-page-y');}});
 });
 new MutationObserver(sync).observe(root,{subtree:true,attributes:true,attributeFilter:['data-lab-motion','aria-checked','aria-pressed']});
 reduced.addEventListener('change',sync);addEventListener('storage',sync);
 addEventListener('pageshow',sync);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 sync();
})();
