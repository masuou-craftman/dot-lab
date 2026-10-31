
(()=>{'use strict';const base='studies/';const groups=[['01','CONTINUITY / つなぐ'],['02','RESPONSE / 応える'],['03','READING / 読ませる'],['04','FORM / かたち']];
const studies=[
['Si','shared-image','画像を、引き継ぐ。','SHARED IMAGE',0,'一覧と詳細を、同じ画像の連続した移動でつなぐ。ためてから加速し、最後はゆっくり着地する。','作品一覧 → 作品詳細 / 位置のつながり'],
['Fg','filter-grid','位置を、並べ直す。','FILTER & FLOW',0,'絞り込んだ後も、残ったカードの位置関係をたどれるように。情報を消すことより、次の配置へ運ぶことを見せる。','カテゴリ切り替え / 残るものの連続性'],
['Pp','process-path','工程を、たどる。','PROCESS PATH',0,'説明はすぐに切り替え、短い線だけが選んだ工程へ走る。遅い出発、速い移動、静かな到着。','工程説明 / 視線の案内'],
['Af','action-feedback','操作に、手応え。','ACTION FEEDBACK',1,'押した、処理している、終わった。小さな形と文字の変化で状態を知らせる。待ち時間を飾るためには使わない。','ボタンの操作 / 状態の通知'],
['Dr','dot-response','点が、応え合う。','PHASE RESPONSE',1,'同じ動きに、小さな時間差。起点から外へ伝わり、すばやくふくらんだ点がゆっくり元の大きさへ戻る。','任意の図解 / 有限の反応'],
['Sr','selection-ripple','選択、そのあと。','SELECT & RIPPLE',1,'選んだ画像が着地してから、点が一度だけ応える。ふたつの動きを重ねず、順番に見せる。','選択 → 移動 → 応答'],
['Rp','reading-position','読む位置の、手がかり。','READING POSITION',2,'記事の現在位置を小さな線で示す。本文は隠さず、スクロールの主導権を読む人に残す。理解度を示すものではない。位置の表示は遅らせず、ミニプレビューは読む位置の変化を短く示す。','長い記事 / 現在位置の把握'],
['Ty','type-motion','言葉が、立ち上がる。','KINETIC TYPE',2,'同じベースラインから、文字が少しずつ時間差で交代する。読める静止を保ち、動く瞬間にだけ強い緩急をつける。','短い見出し / 文字の交代'],
['Ct','stroke-shape','線から、かたちへ。','CONTINUOUS CONTOUR',3,'一本の輪郭が、四角・線・アーチ・菱形へ。つながりを保ったまま、変化の始めと終わりはゆっくり、中間は速く動く。','幾何表現 / 形の連続性'],
['Md','matte-depth','重なりが、奥行きに。','MATTE DEPTH',3,'マットな面を離し、一つの面を前へ出す。光沢を足さず、重なり・角度・間隔で奥行きをつくる。','面の選択 / 重なりの表現'],
['Ds','disclosure','余白を、ひらく。','DISCLOSURE',2,'説明を開くと、その分だけ周りの情報が移動する。操作はすぐに受け取り、途中で閉じても今の高さから戻る。','補足説明 / 高さの連続性'],
['Dn','direction','進む向きを、残す。','DIRECTIONAL NAV',0,'次へ進むと左へ、戻ると右へ。操作の方向と画面の移動を合わせ、連打しても最後に選んだ内容へ着地する。','手順・作品の切り替え / 前後の関係'],
['Fa','reading-focus','読む場所は、そのまま。','QUIET APERTURE',2,'本文を動かさず、周囲の枠だけが退く。新しい情報を隠して待たせず、すでに読める場所の余白を変える。','任意の集中モード / 周辺の優先順位'],
['He','heading','向きが、進路を語る。','PATH HEADING',3,'同じ形が、同じ道を、同じ時間で。黄色い端を前として、水平のままと進路に向く場合を比べる。移動と回転を分けて見る習作。','図形の移動 / 進路と向きの関係']];
const useCases=['一覧 → 詳細','カテゴリ絞り込み','工程ガイド','ボタンの状態','図解への反応','選択後の合図','記事の現在位置','短い見出し','幾何図形','重なった面','補足の開閉','前へ・次へ','任意の集中モード','進路と向き'];
const shapes=[
'<rect class="a" x="15" y="24" width="35" height="32" rx="5" fill="#eee"/><rect x="57" y="10" width="30" height="58" rx="4" fill="none" stroke="#555"/>',
'<g fill="#eee"><rect class="a" x="14" y="15" width="24" height="23" rx="3"/><rect class="b" x="45" y="15" width="24" height="23" rx="3"/><rect class="c" x="14" y="45" width="24" height="23" rx="3"/></g>',
'<path d="M12 42H88" stroke="#444"/><circle cx="12" cy="42" r="4" fill="#aaa"/><circle cx="88" cy="42" r="4" fill="#aaa"/><path class="a" d="M12 42H29" stroke="#fc0" stroke-width="3"/>',
'<rect class="a" x="13" y="25" width="74" height="34" rx="7" fill="none" stroke="#eee"/><circle class="b" cx="50" cy="42" r="5" fill="#fc0"/>',
'<g fill="#eee"><circle class="a" cx="24" cy="42" r="5"/><circle class="b" cx="50" cy="42" r="5"/><circle class="c" cx="76" cy="42" r="5"/></g>',
'<g class="a"><rect x="8" y="18" width="52" height="46" rx="5" fill="#111" stroke="#eee"/><circle cx="34" cy="41" r="3" fill="#fc0"/><circle class="b" cx="20" cy="41" r="3" fill="#aaa"/><circle class="c" cx="48" cy="41" r="3" fill="#aaa"/></g>',
'<path d="M22 22H80M22 35H72M22 48H80M22 61H65" stroke="#555" stroke-width="3"/><path class="a" d="M18 10H82" stroke="#fc0" stroke-width="3"/><circle class="b" cx="12" cy="22" r="3" fill="#eee"/>',
'<path d="M10 61H90" stroke="#555"/><g class="a"><text x="16" y="53" fill="#eee" font-family="monospace" font-size="35">Aa</text></g>',
'<polyline class="a" points="39.5,51.5 39.5,30.5 60.5,30.5 60.5,51.5 39.5,51.5" fill="none" stroke="#eee" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle class="b" cx="39.5" cy="51.5" r="3" fill="#fc0"/>',
'<rect class="a" x="18" y="17" width="46" height="42" rx="4" fill="#111" stroke="#777"/><rect class="b" x="28" y="24" width="46" height="42" rx="4" fill="#111" stroke="#aaa"/><rect class="c" x="38" y="31" width="46" height="42" rx="4" fill="#111" stroke="#eee"/>',
'<rect x="14" y="14" width="72" height="15" rx="3" fill="#eee"/><rect class="a" x="14" y="35" width="72" height="24" rx="3" fill="#fc0"/><path class="b" d="M14 69H86" stroke="#777" stroke-width="4"/>',
'<rect class="a" x="17" y="19" width="55" height="45" rx="4" fill="#eee"/><path d="M76 34L84 42L76 50" fill="none" stroke="#fc0" stroke-width="2"/>',
'<path d="M34 33H66M34 42H62M34 51H66" stroke="#aaa" stroke-width="2"/><path class="a" d="M14 31V14H31" fill="none" stroke="#eee" stroke-width="2"/><path class="b" d="M69 14H86V31" fill="none" stroke="#fc0" stroke-width="2"/><path class="c" d="M14 51V68H31" fill="none" stroke="#eee" stroke-width="2"/><path class="d" d="M69 68H86V51" fill="none" stroke="#eee" stroke-width="2"/>',
'<g transform="translate(-1 12) scale(.16)"><path d="M80 230 C220 20 420 340 560 130" fill="none" stroke="#777" stroke-width="6"/><g class="a" transform="translate(80 230) rotate(-56.309932474020215) scale(1.8)"><rect x="-26" y="-13" width="46" height="26" rx="6" fill="#eee"/><rect x="20" y="-6" width="10" height="12" fill="#fc0"/><circle r="2" fill="#555"/></g></g>' ];
const table=document.querySelector('#table'),toggle=document.querySelector('#motion-toggle'),mq=matchMedia('(prefers-reduced-motion: reduce)');let preference=true;try{preference=localStorage.getItem('dotlab-motion-enabled')!=='false'}catch{}let motion=preference&&!mq.matches,selected=0,active=[],lastPreview=-1,lastPreviewTime=0;
const cellRuns=new Map(),loopTimers=new Map(),visible=new Set();let loopPaused=false,pageAway=false,pendingReplay=-1;const canObserve=typeof IntersectionObserver==='function';const loopToggle=document.querySelector('#loop-toggle');
function cancelCell(i){for(const a of cellRuns.get(i)||[])a.cancel();cellRuns.delete(i)}
function clearLoops(){for(const timer of loopTimers.values())clearTimeout(timer);loopTimers.clear()}
function loopAllowed(){return canObserve&&motion&&!mq.matches&&!document.hidden&&!pageAway&&!loopPaused}
function queueLoop(i,delay=220){if(!loopAllowed()||!visible.has(i)||loopTimers.has(i))return;const timer=setTimeout(()=>{if(loopTimers.get(i)!==timer)return;loopTimers.delete(i);if(!loopAllowed()||!visible.has(i))return;preview(i,true,true);queueLoop(i,2400)},delay);loopTimers.set(i,timer)}
function syncLoops(){clearLoops();if(loopToggle){loopToggle.disabled=!motion||!canObserve;loopToggle.setAttribute('aria-pressed',String(loopPaused));loopToggle.textContent=!motion?'一覧 · 静止表示':loopPaused?'一覧を再開 ▶':'一覧を一時停止 Ⅱ'}if(loopAllowed())for(const i of visible)queueLoop(i,180+(i%4)*100)}
groups.forEach((g,gi)=>{const col=document.createElement('section');col.innerHTML=`<h2 class="group-title"><b>${g[0]}</b>${g[1]}</h2>`;studies.forEach((s,i)=>{if(s[4]!==gi)return;const b=document.createElement('a');b.href=demoURL(i);b.className='cell';b.dataset.index=i;b.setAttribute('data-selected',String(i===0));b.setAttribute('aria-label',`${String(i+1).padStart(2,'0')} ${s[0]} ${s[2]} ${useCases[i]} デモを開く`);b.innerHTML=`<span class="cell-top"><span>${String(i+1).padStart(2,'0')} / ${g[0]}</span><em aria-hidden="true">SELECTED</em></span><span class="symbol">${s[0]}</span><span class="glyph" aria-hidden="true"><svg viewBox="0 0 100 82">${shapes[i]}</svg></span><span class="cell-name">${s[2]}</span><span class="cell-use">${useCases[i]}</span>`;b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')preview(i)});b.addEventListener('focus',()=>{select(i);preview(i)});b.addEventListener('click',e=>{if(e.defaultPrevented||e.button>0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;select(i);try{history.replaceState({...history.state,dotlabReturn:{index:i}},'','#'+s[1])}catch{} });col.append(b)});if(gi===3){const blank=document.createElement('div');blank.className='open-slot';blank.setAttribute('aria-hidden','true');blank.innerHTML='<strong>＋</strong><span>ROOM FOR THE NEXT<br>次の実験のために。</span>';col.append(blank)}table.append(col)});
const cells=[...document.querySelectorAll('.cell')];function cancel(){clearLoops();for(const i of cellRuns.keys())cancelCell(i);for(const a of active)a.cancel();active=[]}function animate(el,frames,options={}){if(!el||typeof el.animate!=='function')return;el.style.transformBox='fill-box';el.style.transformOrigin='center';const a=el.animate(frames,{duration:900,easing:'cubic-bezier(.76,0,.16,1)',fill:'none',...options});active.push(a)}
function contourPoints(angles){
  const p=[[0,0]];
  for(const angle of angles){
    const r=angle*Math.PI/180, q=p[p.length-1];
    p.push([q[0]+21*Math.cos(r),q[1]+21*Math.sin(r)]);
  }
  const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);
  const dx=50-(Math.min(...xs)+Math.max(...xs))/2;
  const dy=41-(Math.min(...ys)+Math.max(...ys))/2;
  return p.map(q=>[q[0]+dx,q[1]+dy]);
}
function contourEase(x){
  x=Math.max(0,Math.min(1,x));
  const a=x**4,b=(1-x)**4;return a/(a+b);
}
function previewContour(line,origin,loop=false){
  const baseline=[line.getAttribute('points'),origin.getAttribute('cx'),origin.getAttribute('cy')];
  let frame=null,stopped=false;
  const start=performance.now();
  const paint=angles=>{
    const p=contourPoints(angles);
    line.setAttribute('points',p.map(q=>q.join(',')).join(' '));
    origin.setAttribute('cx',p[0][0]);origin.setAttribute('cy',p[0][1]);
  };
  const handle={cancel(){
    stopped=true;if(frame!==null)cancelAnimationFrame(frame);frame=null;
    line.setAttribute('points',baseline[0]);
    origin.setAttribute('cx',baseline[1]);origin.setAttribute('cy',baseline[2]);
  }};
  active.push(handle);
  function tick(now){
    frame=null;if(stopped)return;
    const t=Math.max(0,now-start);
    let angles;
    if(loop){
      const square=[-90,0,90,180],diamond=[-135,-45,45,135];
      if(t<100)angles=square;
      else if(t<650){const u=contourEase((t-100)/550);angles=square.map(v=>v*(1-u));}
      else if(t<800)angles=[0,0,0,0];
      else if(t<1350){const u=contourEase((t-800)/550);angles=diamond.map(v=>v*u);}
      else if(t<1550)angles=diamond;
      else {const u=contourEase((t-1550)/550);angles=diamond.map((v,k)=>v+(square[k]-v)*u);}
      paint(angles);
      if(t<2200)frame=requestAnimationFrame(tick);
      else {line.setAttribute('points',baseline[0]);origin.setAttribute('cx',baseline[1]);origin.setAttribute('cy',baseline[2]);}
      return;
    }
    if(t<100) angles=[-90,0,90,180];
    else if(t<580){const u=contourEase((t-100)/480);angles=[-90,0,90,180].map(v=>v*(1-u));}
    else if(t<700) angles=[0,0,0,0];
    else if(t<1220){const u=contourEase((t-700)/520);angles=[-135,-45,45,135].map(v=>v*u);}
    else angles=[-135,-45,45,135];
    paint(angles);
    if(t<1320)frame=requestAnimationFrame(tick);
    // At end leave a meaningful static diamond, no ongoing frame or loop.
    // Next preview / OFF / hide invokes handle.cancel() and restores baseline.
  }
  paint([-90,0,90,180]);frame=requestAnimationFrame(tick);
}

function previewHeading(glyph,loop=false){
  if(typeof HeadingModel==='undefined')return;
  const baseline=glyph.getAttribute('transform');let frame=null,stopped=false;const start=performance.now();
  const handle={cancel(){stopped=true;if(frame!==null)cancelAnimationFrame(frame);frame=null;glyph.setAttribute('transform',baseline)}};active.push(handle);
  function tick(now){frame=null;if(stopped)return;
    if(loop){
      const t=Math.max(0,now-start);let progress,turn;
      if(t<850){progress=contourEase(t/850);turn=0;}
      else if(t<1050){progress=1;turn=180*contourEase((t-850)/200);}
      else if(t<1900){progress=1-contourEase((t-1050)/850);turn=180;}
      else {progress=0;turn=180*(1-contourEase((t-1900)/250));}
      const p=HeadingModel.pose(progress,'tangent');
      glyph.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${p.angle+turn}) scale(1.8)`);
      if(t<2200)frame=requestAnimationFrame(tick);else glyph.setAttribute('transform',baseline);
      return;
    }
    const progress=Math.min(1,Math.max(0,now-start)/1400),p=HeadingModel.pose(progress,'tangent');glyph.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${p.angle}) scale(1.8)`);if(progress<1)frame=requestAnimationFrame(tick)}
  frame=requestAnimationFrame(tick);
}
// Each automatic cycle begins and ends at the underlying SVG pose. No fill-none snap.
// 2.2 seconds of motion + 0.2 seconds of breathing room; segment easings stop at joins.
function previewLoop(i,a,z,c,d){
  const ease='cubic-bezier(.65,0,.35,1)';
  const track=(el,poses,options={})=>animate(el,poses.map(([offset,transform,opacity=1])=>({offset,transform,opacity,easing:ease})),{duration:2200,easing:'linear',...options});
  const identity='translate(0,0) scale(1)';
  switch(i){
    case 0:track(a,[[0,identity],[.42,'translate(35px,-5px) scale(1.25)'],[.55,'translate(35px,-5px) scale(1.25)'],[.94,identity],[1,identity]]);break;
    case 1:track(a,[[0,identity],[.4,'translate(31px,30px)'],[.56,'translate(31px,30px)'],[.94,identity],[1,identity]]);track(z,[[0,identity],[.4,'translate(-31px,0)'],[.56,'translate(-31px,0)'],[.94,identity],[1,identity]]);break;
    case 2:track(a,[[0,identity],[.42,'translateX(59px)'],[.55,'translateX(59px)'],[.94,identity],[1,identity]]);break;
    case 3:track(a,[[0,identity],[.22,'scale(.9)'],[.58,identity],[1,identity]]);track(z,[[0,identity],[.22,'scale(1.5)'],[.58,identity],[1,identity]]);break;
    case 4:[a,z,c].forEach((el,k)=>track(el,[[0,identity],[.1+k*.08,identity],[.24+k*.08,'scale(1.8)'],[.65+k*.08,identity],[1,identity]]));break;
    case 5:track(a,[[0,identity],[.3,'translateX(26px)'],[.62,'translateX(26px)'],[.95,identity],[1,identity]]);[z,c].forEach((el,k)=>track(el,[[0,identity],[.32+k*.05,identity],[.42+k*.05,'scale(1.8)'],[.6+k*.05,identity],[1,identity]]));break;
    case 6:track(a,[[0,identity],[.4,'scaleX(.2)'],[.55,'scaleX(.2)'],[.95,identity],[1,identity]]);a.style.transformOrigin='left';track(z,[[0,identity],[.4,'translateY(39px)'],[.55,'translateY(39px)'],[.95,identity],[1,identity]]);break;
    case 7:track(a,[[0,identity],[.3,'translateY(15px)',.25],[.45,'translateY(15px)',.25],[.85,identity],[1,identity]]);break;
    case 8:previewContour(a,z,true);break;
    case 9:[a,z,c].forEach((el,k)=>track(el,[[0,identity],[.08+k*.04,identity],[.4+k*.04,`translate(${(k-1)*9}px,${(k-1)*-10}px)`],[.57,`translate(${(k-1)*9}px,${(k-1)*-10}px)`],[.9+k*.04,identity],[1,identity]]));break;
    case 10:track(a,[[0,identity],[.35,'scaleY(.15)',.35],[.5,'scaleY(.15)',.35],[.9,identity],[1,identity]]);a.style.transformOrigin='top';track(z,[[0,identity],[.35,'translateY(-20px)'],[.5,'translateY(-20px)'],[.9,identity],[1,identity]]);break;
    // The page exchange crosses the seam only while fully transparent.
    case 11:track(a,[[0,identity],[.4,'translateX(-17px)',0],[.49,'translateX(-17px)',0],[.51,'translateX(17px)',0],[.6,'translateX(17px)',0],[.95,identity],[1,identity]]);break;
    case 12:[a,z,c,d].forEach((el,k)=>{const away=`translate(${k%2?5:-5}px,${k>1?5:-5}px) scale(.4)`;track(el,[[0,identity],[.35,away],[.6,away],[.95,identity],[1,identity]])});break;
    case 13:previewHeading(a,true);break;
  }
}
function preview(i,force=false,fromLoop=false){if(!force&&loopAllowed()&&cellRuns.has(i))return;const now=performance.now();if(!force&&lastPreview===i&&now-lastPreviewTime<160)return;lastPreview=i;lastPreviewTime=now;if(canObserve){cancelCell(i);active=[]}else cancel();if(!motion||mq.matches||document.hidden||pageAway||(loopPaused&&!force)||(canObserve&&!visible.has(i)))return;if(!fromLoop){if(loopTimers.has(i)){clearTimeout(loopTimers.get(i));loopTimers.delete(i)}queueLoop(i,2400)}cellRuns.set(i,active);const b=cells.find(c=>+c.dataset.index===i),a=b.querySelector('.a'),z=b.querySelector('.b'),c=b.querySelector('.c'),d=b.querySelector('.d');if(fromLoop){previewLoop(i,a,z,c,d);return}switch(i){case 0:animate(a,[{transform:'translate(0,0) scale(1)'},{transform:'translate(35px,-5px) scale(1.25)'},{transform:'translate(0,0) scale(1)'}]);break;case 1:animate(a,[{transform:'translate(0,0)'},{transform:'translate(31px,30px)'},{transform:'translate(0,0)'}]);animate(z,[{transform:'translate(0,0)'},{transform:'translate(-31px,0)'},{transform:'translate(0,0)'}]);break;case 2:animate(a,[{transform:'translateX(0)',opacity:0},{opacity:1,offset:.1},{transform:'translateX(59px)',opacity:1,offset:.85},{transform:'translateX(59px)',opacity:0}]);break;case 3:animate(a,[{transform:'scale(1)'},{transform:'scale(.9)',offset:.24},{transform:'scale(1)'}]);animate(z,[{transform:'scale(1)'},{transform:'scale(1.5)',offset:.24},{transform:'scale(1)'}]);break;case 4:[a,z,c].forEach((el,k)=>animate(el,[{transform:'scale(1)'},{transform:'scale(1.8)',offset:.24,easing:'cubic-bezier(.16,1,.3,1)'},{transform:'scale(1)'}],{duration:540,delay:k*120,easing:'linear'}));break;
case 5:animate(a,[{transform:'translateX(0)',offset:0,easing:'cubic-bezier(.76,0,.16,1)'},{transform:'translateX(26px)',offset:420/1180},{transform:'translateX(26px)',offset:1}],{duration:1180,easing:'linear'});[z,c].forEach(el=>animate(el,[{transform:'scale(1)',offset:0,easing:'cubic-bezier(.6,0,.9,.3)'},{transform:'scale(1.8)',offset:.24,easing:'cubic-bezier(.16,1,.3,1)'},{transform:'scale(1)',offset:1}],{duration:540,delay:540,easing:'linear'}));break;
case 6:animate(a,[{transform:'scaleX(.2)'},{transform:'scaleX(1)'}],{duration:720,easing:'linear'});a.style.transformOrigin='left';animate(z,[{transform:'translateY(0)'},{transform:'translateY(39px)'}],{duration:720,easing:'linear'});break;
case 7:animate(a,[{transform:'translateY(15px)',opacity:.25},{transform:'translateY(0)',opacity:1}],{duration:800});break;case 8:previewContour(a,z);break;case 9:[a,z,c].forEach((el,k)=>animate(el,[{transform:'translate(0,0)'},{transform:`translate(${(k-1)*9}px,${(k-1)*-10}px)`},{transform:'translate(0,0)'}],{delay:k*65}));break;case 10:animate(a,[{transform:'scaleY(.15)',opacity:.35},{transform:'scaleY(1)',opacity:1},{transform:'scaleY(.15)',opacity:.35}]);a.style.transformOrigin='top';animate(z,[{transform:'translateY(-20px)'},{transform:'translateY(0)'},{transform:'translateY(-20px)'}]);break;case 11:animate(a,[{transform:'translateX(0)',opacity:1},{transform:'translateX(-17px)',opacity:0,offset:.48},{transform:'translateX(17px)',opacity:0,offset:.5},{transform:'translateX(0)',opacity:1}]);break;case 12:[a,z,c,d].forEach((el,k)=>animate(el,[{transform:'translate(0,0) scale(1)',offset:0,easing:'cubic-bezier(.16,1,.3,1)'},{transform:`translate(${k%2?5:-5}px,${k>1?5:-5}px) scale(.4)`,offset:.6},{transform:`translate(${k%2?5:-5}px,${k>1?5:-5}px) scale(.4)`,offset:1}],{duration:700,easing:'linear'}));break;case 13:previewHeading(a);break;}}
function demoURL(i){const s=studies[i];return i<10?base+s[1]+'/index.html':i===12?'reading-focus.html':i===13?'heading.html':'motion-patterns.html#'+s[1]}
function select(i,updateURL=false){selected=i;const s=studies[i];cells.forEach(b=>b.setAttribute('data-selected',String(+b.dataset.index===i)));document.querySelector('#detail-number').textContent=`${String(i+1).padStart(2,'0')} / ${groups[s[4]][0]}`;document.querySelector('#detail-symbol').textContent=s[0];document.querySelector('#detail-title').textContent=s[2];document.querySelector('#detail-description').textContent=s[5];document.querySelector('#detail-use').textContent=s[3]+' / '+s[6];document.querySelector('#demo-link').href=i<10?base+s[1]+'/index.html':i===12?'reading-focus.html':i===13?'heading.html':'motion-patterns.html#'+s[1];const original=document.querySelector('#original-link');original.href=i<10?base+'original/'+s[1]+'/index.html':i===12?'reading-focus.html':i===13?'heading.html':'motion-patterns.html#'+s[1];original.textContent=i<10?'元の緩急と比べる ↗':i===12?'動きON / OFFを比べる ↗':i===13?'同じ地点で向きを比べる ↗':'同じ長さで緩急を比べる ↗';document.querySelector('#dock-number').textContent=String(i+1).padStart(2,'0')+' / '+s[0];document.querySelector('#dock-name').textContent=s[2];document.querySelector('#announcement').textContent=s[2]+' 説明を更新しました。';if(updateURL&&location.hash!=='#'+s[1])history.pushState(null,'','#'+s[1]);}
function sync(){const focused=document.activeElement;motion=preference&&!mq.matches;if(!motion)pendingReplay=-1;toggle.setAttribute('aria-pressed',String(motion));toggle.textContent=mq.matches?'動き OFF · 端末設定':'動き '+(motion?'ON':'OFF');toggle.disabled=mq.matches;const replay=document.querySelector('#replay');replay.disabled=!motion;replay.textContent=motion?'このマスを再生 ↻':'動き OFF · 静止表示';cancel();syncLoops();if(focused&&focused.disabled)document.querySelector('#detail-jump').focus({preventScroll:true})}
toggle.addEventListener('click',()=>{preference=!preference;try{localStorage.setItem('dotlab-motion-enabled',String(preference))}catch{}sync()});document.querySelector('#replay').addEventListener('click',()=>{if(canObserve&&!visible.has(selected)){pendingReplay=selected;const cell=cells.find(c=>+c.dataset.index===selected);cell.scrollIntoView({behavior:'auto',block:'center'});cell.focus({preventScroll:true})}else preview(selected,true)});mq.addEventListener('change',sync);addEventListener('storage',e=>{if(e.key==='dotlab-motion-enabled'){preference=e.newValue!=='false';sync()}});document.addEventListener('visibilitychange',()=>{pendingReplay=-1;cancel();syncLoops()});addEventListener('pagehide',()=>{pendingReplay=-1;pageAway=true;cancel()});addEventListener('pageshow',()=>{pageAway=false;const back=history.state&&history.state.dotlabReturn;if(back&&Number.isInteger(back.index)&&back.index>=0&&back.index<studies.length){select(back.index);const cell=cells.find(c=>+c.dataset.index===back.index);cell.focus({preventScroll:true})}try{preference=localStorage.getItem('dotlab-motion-enabled')!=='false'}catch{}sync()});function fromHash(){pendingReplay=-1;cancel();lastPreview=-1;const index=studies.findIndex(s=>location.hash==='#'+s[1]);select(index>=0?index:0);syncLoops()}addEventListener('popstate',fromHash);addEventListener('hashchange',()=>{if(location.hash!=='#detail')fromHash()});document.querySelector('#detail-jump').addEventListener('click',e=>{e.preventDefault();document.querySelector('#detail').focus({preventScroll:true});document.querySelector('#detail').scrollIntoView({behavior:'auto',block:'start'})});if(canObserve){const observer=new IntersectionObserver(entries=>{for(const entry of entries){const i=+entry.target.dataset.index;if(entry.isIntersecting&&entry.intersectionRatio>=.25){visible.add(i);if(pendingReplay===i){pendingReplay=-1;preview(i,true)}queueLoop(i)}else{visible.delete(i);if(loopTimers.has(i)){clearTimeout(loopTimers.get(i));loopTimers.delete(i)}cancelCell(i)}}},{threshold:[0,.25]});cells.forEach(cell=>observer.observe(cell))}
if(loopToggle)loopToggle.addEventListener('click',()=>{loopPaused=!loopPaused;cancel();syncLoops()});
fromHash();sync();})();
