(()=>{'use strict';
const patterns={
 '↗':['00111','00011','00101','01000','10000'],
 '→':['00100','00010','11111','00010','00100'],
 '←':['00100','01000','11111','01000','00100'],
 '↑':['00100','01110','10101','00100','00100'],
 '↓':['00100','00100','10101','01110','00100'],
 '↻':['01110','10001','10011','10000','01110'],
 '▶':['10000','11100','11111','11100','10000'],
 'Ⅱ':['11011','11011','11011','11011','11011'],
 '×':['10001','01010','00100','01010','10001'],
 '＋':['00100','00100','11111','00100','00100']
};
const names={'↗':'開く','→':'次へ','←':'戻る','↑':'上へ','↓':'下へ','↻':'再生','▶':'再生','Ⅱ':'一時停止','×':'閉じる','＋':'追加'};
const ns='http://www.w3.org/2000/svg';
function glyph(char){const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 20 20');svg.setAttribute('class','dot-ui-icon');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');patterns[char].forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1'){const c=document.createElementNS(ns,'circle');c.setAttribute('cx',2+x*4);c.setAttribute('cy',2+y*4);c.setAttribute('r','1.35');svg.append(c)}}));return svg}
function decorate(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const pending=[];let n;
 while(n=walker.nextNode()){
  const parent=n.parentElement;
  if(!parent||!parent.closest('a,button,.open-slot')||parent.closest('svg,script,style,textarea,[contenteditable]'))continue;
  if([...n.data].some(c=>patterns[c]))pending.push(n);
 }
 for(const node of pending){const control=node.parentElement.closest('a,button');const original=control?.textContent.trim();
  if(control&&patterns[original]&&!control.hasAttribute('aria-label'))control.setAttribute('aria-label',names[original]);
  const frag=document.createDocumentFragment();let text='';for(const char of node.data){if(patterns[char]){if(text){frag.append(document.createTextNode(text));text=''}frag.append(glyph(char))}else text+=char}if(text)frag.append(document.createTextNode(text));node.replaceWith(frag);
 }
}
function start(){decorate(document.body);const observer=new MutationObserver(records=>{const roots=new Set();for(const r of records){if(r.type==='characterData')roots.add(r.target.parentElement);else for(const n of r.addedNodes){if(n.nodeType===1&&!n.closest('svg'))roots.add(n);else if(n.nodeType===3)roots.add(n.parentElement)}}for(const root of roots)if(root&&root.isConnected)decorate(root)});observer.observe(document.body,{childList:true,subtree:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
