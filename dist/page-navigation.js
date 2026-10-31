/* Progressive enhancement only: native navigation, history and link semantics stay intact.
 * https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
 * One top-left to bottom-right pass of coarse dots; no edge color, flashing or dot DOM.
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
 // Coarse dots open along diagonals from top left to bottom right.
 // Bound the grid to 16 x 16; adjacent diagonals share one animated property.
 const cell=Math.max(innerWidth/Math.max(4,Math.min(16,Math.ceil(innerWidth/112))),innerHeight/16);
 const columns=Math.ceil(innerWidth/cell),rows=Math.ceil(innerHeight/cell);
 const bands=columns+rows-1,radius=Math.ceil(cell*Math.SQRT1_2)+2;
 // Completed radius is the default; from + backwards fill handles the opening.
 const duration=540, scope=':root:active-view-transition-type(dot-page)';
 let css='@view-transition{navigation:auto}';
 const masks=[],sizes=[],positions=[],animations=[];
 for(let i=0;i<bands;i++){
  css+=`@property --dot-band-${i}{syntax:"<length>";inherits:false;initial-value:${radius}px}`;
  css+=`@keyframes dot-band-${i}{from{--dot-band-${i}:0px}to{--dot-band-${i}:${radius}px}}`;
  animations.push(`dot-band-${i} 360ms cubic-bezier(.25,.25,.45,1) ${i*180/Math.max(1,bands-1)}ms both`);
 }
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
  const band=x+y;
  masks.push(`radial-gradient(circle at ${(x+.5)*cell}px ${(y+.5)*cell}px,#000 var(--dot-band-${band}),transparent calc(var(--dot-band-${band}) + .7px))`);
  sizes.push(`${innerWidth}px ${innerHeight}px`);positions.push('0px 0px');
 }
 css+=['','-group(*)','-image-pair(*)','-old(*)','-new(*)'].map(x=>scope+'::view-transition'+x).join(',')+'{pointer-events:none}';
 css+=`${scope}::view-transition-group(root){animation-duration:${duration}ms;background:transparent}`;
 css+=`${scope}::view-transition-image-pair(root){background:transparent;isolation:isolate}`;
 css+=`${scope}::view-transition-old(root){display:block;animation:none;mix-blend-mode:normal}`;
 css+=`${scope}::view-transition-new(root){mix-blend-mode:normal;mask-image:${masks.join(',')};mask-size:${sizes.join(',')};mask-position:${positions.join(',')};mask-repeat:no-repeat;mask-composite:add;animation:${animations.join(',')}}`;
 css+='@media(prefers-reduced-motion:reduce){::view-transition-group(*),::view-transition-new(*),::view-transition-old(*),::view-transition-image-pair(*){animation:none!important}}';
 style.textContent=css;
 document.head.append(style);
 const initialWidth=innerWidth,initialHeight=innerHeight;
 function sync(){style.disabled=(innerWidth!==initialWidth||innerHeight!==initialHeight)||motionOff();if(style.disabled)active?.skipTransition();}
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
  const off=motionOff()||(innerWidth!==initialWidth||innerHeight!==initialHeight);if(off)active.skipTransition();
  try{sessionStorage.setItem(key,JSON.stringify({url:e.activation?.entry?.url,point,off,time:Date.now()}));}catch{}
 });
 addEventListener('pagereveal',e=>{
  if(!e.viewTransition)return;
  active=e.viewTransition;active.ready?.catch(()=>{});active.types?.add('dot-page');let saved=null;
  try{saved=JSON.parse(sessionStorage.getItem(key));sessionStorage.removeItem(key);}catch{}
  const valid=saved&&saved.url===location.href&&Date.now()-saved.time<15000;
  if(motionOff()||(innerWidth!==initialWidth||innerHeight!==initialHeight)||(valid&&saved.off)){active.skipTransition();return;}
  const p=valid&&saved.point?.url===location.href?saved.point:null;
  root.style.setProperty('--dot-page-x',`${Math.max(0,Math.min(1,p?.x??.5))*100}vw`);
  root.style.setProperty('--dot-page-y',`${Math.max(0,Math.min(1,p?.y??.42))*100}vh`);
  const transition=active;transition.finished.catch(()=>{}).finally(()=>{if(active===transition){active=null;root.style.removeProperty('--dot-page-x');root.style.removeProperty('--dot-page-y');}});
 });
 new MutationObserver(sync).observe(root,{subtree:true,attributes:true,attributeFilter:['data-lab-motion','aria-checked','aria-pressed']});
 addEventListener('resize',()=>{clear();style.disabled=true;});
 reduced.addEventListener('change',sync);addEventListener('storage',sync);
 addEventListener('pageshow',sync);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 sync();
})();
