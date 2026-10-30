(()=>{'use strict';
const M=OverviewModel,$=s=>document.querySelector(s),mq=matchMedia('(prefers-reduced-motion: reduce)'),key='dotlab-motion-enabled';
const names={all:'全体',a:'A / 左上',b:'B / 右上',c:'C / 左下',d:'D / 右下'};
const copy={all:['全体 — 4つの場所を見渡す。','Aは左上、Bは右上、Cは左下、Dは右下。形を選ぶと、その区画を2倍で見ます。図の座標での位置・大きさ・向きは変えません。'],a:['A / 左上 — 高さの異なる縦線。','3本の縦線が並ぶ区画です。黄色い短い基線が、3本の下にあります。全体図では左上の位置にあります。'],b:['B / 右上 — 重なった四角。','2つの四角を右下にずらして重ねた区画です。黄色い部分は内側の上辺にあります。全体図では右上の位置にあります。'],c:['C / 左下 — 開いた円。','太い円の右上が開いている区画です。開いた端の一方が黄色です。全体図では左下の位置にあります。'],d:['D / 右下 — 3段の階段。','左下から右上へ上がる3段の線です。右端の短い水平線が黄色です。全体図では右下の位置にあります。']};
let selected='all',camera={...M.views.all},manual=true,mode='eased',frame=null,generation=0;
try{manual=localStorage.getItem(key)!=='false'}catch{}
function allowed(){return manual&&!mq.matches&&!document.hidden&&mode==='eased'}
function cancel(){generation++;if(frame!==null)cancelAnimationFrame(frame);frame=null}
function paint(){const b=M.box(camera);$('#camera').setAttribute('viewBox',[b.x,b.y,b.w,b.h].join(' '));for(const [attr,value]of Object.entries({x:b.x,y:b.y,width:b.w,height:b.h}))$('#locator-box').setAttribute(attr,value);$('#scale').textContent=(M.WIDTH/camera.w).toFixed(2)+' ×'}
function controls(){const focused=document.activeElement;$('#motion').setAttribute('aria-pressed',String(manual&&!mq.matches));$('#motion').textContent=mq.matches?'動きOFF · 端末設定':'動き '+(manual?'ON':'OFF');$('#motion').disabled=mq.matches;if(focused===$('#motion')&&mq.matches)document.querySelector('[data-view="'+selected+'"]').focus({preventScroll:true})}
function explain(){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===selected)));$('#view-name').textContent=names[selected];$('#selection-title').textContent=copy[selected][0];$('#selection-description').textContent=copy[selected][1];$('#locator-desc').textContent='選んだ範囲は'+names[selected]+'。黄色い枠は現在の視野です。';$('#diagram-desc').textContent=copy[selected][1]+' 選んだ範囲は'+names[selected]+'です。'}
function settle(message){cancel();camera={...M.views[selected]};paint();controls();$('#status').textContent=message}
function select(id){if(!M.views[id]||id===selected)return;selected=id;explain();cancel();if(!allowed()){settle(names[id]+'を静止表示しています。');return}const from={...camera},to={...M.views[id]},start=performance.now(),token=generation;$('#status').textContent=names[id]+'へ視野を移しています。説明はすでに読めます。';function tick(now){if(token!==generation)return;frame=null;if(!allowed()){settle(names[selected]+'を静止表示しています。');return}const t=Math.max(0,Math.min(1,(now-start)/M.DURATION));camera=M.interpolate(from,to,M.ease(t));paint();if(t<1)frame=requestAnimationFrame(tick);else $('#status').textContent=names[id]+'で停止しました。自動では繰り返しません。'}frame=requestAnimationFrame(tick)}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.view)));
document.querySelectorAll('input[name="transition"]').forEach(r=>r.addEventListener('change',()=>{mode=r.value;settle('切り替え方を変更しました。次に範囲を選ぶまで動きません。')}));
$('#motion').addEventListener('click',()=>{manual=!manual;try{localStorage.setItem(key,String(manual))}catch{}settle('動き'+(manual?'ON':'OFF')+'。次に範囲を選ぶまで動きません。')});
mq.addEventListener('change',()=>settle('端末設定を反映しました。選んだ範囲で静止しています。'));
addEventListener('storage',e=>{if(e.key===key){manual=e.newValue!=='false';settle('動きの設定を反映しました。自動では動きません。')}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)settle('画面を離れたため、選んだ範囲で静止しています。')});
addEventListener('pagehide',()=>settle('選んだ範囲で静止しています。'));
addEventListener('pageshow',()=>{try{manual=localStorage.getItem(key)!=='false'}catch{}settle('範囲を選ぶと表示を切り替えます。自動では動きません。')});
paint();controls();document.documentElement.classList.add('enhanced');
})();
