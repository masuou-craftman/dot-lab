/* Progressive enhancement only: native navigation, history and link semantics stay intact.
 * https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
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
 if(!('onpageswap' in window)||!('onpagereveal' in window)||!document.startViewTransition)return;
 const style=document.createElement('style');style.dataset.dotPageNavigation='';
 style.textContent=`@view-transition{navigation:auto}
 :root:active-view-transition-type(dot-page)::view-transition, :root:active-view-transition-type(dot-page)::view-transition-group(*), :root:active-view-transition-type(dot-page)::view-transition-image-pair(*), :root:active-view-transition-type(dot-page)::view-transition-old(*), :root:active-view-transition-type(dot-page)::view-transition-new(*){pointer-events:none}
 :root:active-view-transition-type(dot-page)::view-transition-group(root){animation-duration:340ms}
 :root:active-view-transition-type(dot-page)::view-transition-old(root){display:block;animation:none;mix-blend-mode:normal}
 :root:active-view-transition-type(dot-page)::view-transition-new(root){mix-blend-mode:normal;animation:dot-page-open 340ms cubic-bezier(.76,0,.18,1) both}
 @keyframes dot-page-open{from{clip-path:circle(5px at var(--dot-page-x,50vw) var(--dot-page-y,42vh))}to{clip-path:circle(150vmax at var(--dot-page-x,50vw) var(--dot-page-y,42vh))}}
 @media(prefers-reduced-motion:reduce){::view-transition-group(*),::view-transition-new(*),::view-transition-old(*){animation:none!important}}`;
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
