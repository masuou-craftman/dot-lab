/* DOT MIX: finite, user-triggered play. No startup or existing motion state changes. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const LABELS = {grid: '整列', circle: '輪', scatter: 'ばらばら'};
  const ORDER = ['grid', 'circle', 'scatter'];
  let manualMotion = true;
  function positions(shape, seed) {
    let state = seed >>> 0;
    const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    return Array.from({length: 36}, (_, i) => {
      if (shape === 'circle') {
        const angle = i / 36 * Math.PI * 2 - Math.PI / 2;
        return {x: 240 + Math.cos(angle) * 94, y: 130 + Math.sin(angle) * 94};
      }
      if (shape === 'scatter') {
        // One dot per cell: changing arrangements without collisions or edge clipping.
        return {x: 55 + (i % 6) * 74 + random() * 20, y: 28 + Math.floor(i / 6) * 38 + random() * 14};
      }
      return {x: 110 + (i % 6) * 52, y: 40 + Math.floor(i / 6) * 36};
    });
  }
  function mount(section) {
    const board = section.querySelector('.dot-mix-board');
    const group = section.querySelector('[data-mix-dots]');
    const motionButton = section.querySelector('[data-mix-motion]');
    const status = section.querySelector('[data-mix-status]');
    const choices = [...section.querySelectorAll('[data-mix-shape]')];
    if (!board || !group || !motionButton || !status) return () => {};
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let shape = 'grid', seed = 17, frame = 0, dead = false;
    let current = positions(shape, seed), target = current;
    const dots = current.map((point, i) => {
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', i % 7 === 0 ? '6' : '4');
      dot.setAttribute('class', i % 7 === 0 ? 'mix-dot mix-dot-accent' : 'mix-dot');
      group.append(dot);
      return dot;
    });
    group.setAttribute('aria-hidden', 'true');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const globalOff = () => document.documentElement.dataset.labMotion === 'off';
    const enabled = () => manualMotion && !media.matches && !globalOff();
    function paint(points) {
      current = points;
      dots.forEach((dot, i) => {dot.setAttribute('cx', String(points[i].x)); dot.setAttribute('cy', String(points[i].y));});
    }
    function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; }
    function controls() {
      choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mixShape === shape)));
      motionButton.setAttribute('aria-pressed', String(enabled()));
      motionButton.textContent = media.matches ? '動き OFF · 端末設定' : globalOff() ? '動き OFF · 全体設定' : manualMotion ? '動き ON' : '動き OFF';
      motionButton.disabled = media.matches || globalOff();
      section.dataset.mixMotion = enabled() ? 'on' : 'off';
      board.setAttribute('aria-label', `ドットを組み替える。現在：${LABELS[shape]}。次は${LABELS[ORDER[(ORDER.indexOf(shape) + 1) % ORDER.length]]}`);
    }
    function choose(next) {
      if (dead || !Object.hasOwn(LABELS, next)) return;
      stop(); shape = next;
      if (shape === 'scatter') seed++;
      target = positions(shape, seed);
      controls();
      status.textContent = `${LABELS[shape]}${shape === 'scatter' ? ` / ${seed - 17}` : ''} — ${enabled() ? '36個のドットを組み替えました' : '静止したかたちで表示'}。`;
      if (!enabled() || document.hidden) {paint(target); return;}
      const from = current.map(point => ({...point}));
      const start = performance.now();
      function tick(now) {
        if (dead) return;
        const elapsed = Math.max(0, now - start);
        paint(target.map((point, i) => {
          const p = Math.max(0, Math.min(1, (elapsed - i * 5) / 620));
          const eased = 1 - Math.pow(1 - p, 4);
          return {x: from[i].x + (point.x - from[i].x) * eased, y: from[i].y + (point.y - from[i].y) * eased};
        }));
        frame = elapsed < 795 ? requestAnimationFrame(tick) : 0;
      }
      frame = requestAnimationFrame(tick);
    }
    function click(event) {
      const button = event.target.closest('button');
      if (!button || !section.contains(button)) return;
      if (button === board) choose(ORDER[(ORDER.indexOf(shape) + 1) % ORDER.length]);
      else if (button === motionButton) {
        if (media.matches || globalOff()) return;
        manualMotion = !manualMotion; stop(); paint(target); controls();
        status.textContent = enabled() ? '動き ON。次の操作で動きます。' : '動き OFF。かたちは静止して切り替わります。';
      } else if (button.hasAttribute('data-mix-shape')) choose(button.dataset.mixShape);
    }
    function mediaChange() {stop(); paint(target); controls(); status.textContent = enabled() ? '動き ON。次の操作で動きます。' : '動き OFF。静止したかたちで遊べます。';}
    function hide() { if (document.hidden) {stop(); paint(target);} }
    function pageHide() {stop(); paint(target);}
    const globalObserver = new MutationObserver(mediaChange);
    globalObserver.observe(document.documentElement, {attributes: true, attributeFilter: ['data-lab-motion']});
    section.addEventListener('click', click);
    media.addEventListener('change', mediaChange);
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', pageHide);
    paint(current); controls(); status.textContent = '36個のドット。押すたび、かたちが変わる。';
    section.dataset.mixReady = 'true';
    return () => {dead = true; stop(); section.removeEventListener('click', click); media.removeEventListener('change', mediaChange); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', pageHide); globalObserver.disconnect(); dots.forEach(dot => dot.remove());};
  }
  function start() {
    const main = document.querySelector('#main');
    if (!main) return;
    const mounted = new Map();
    function reconcile() {
      for (const [section, cleanup] of mounted) if (!main.contains(section)) {cleanup(); mounted.delete(section);}
      for (const section of main.querySelectorAll('.dot-mix')) if (!mounted.has(section)) mounted.set(section, mount(section));
    }
    // The router replaces #main children; do not observe our own SVG/label mutations.
    const observer = new MutationObserver(reconcile);
    observer.observe(main, {childList: true});
    reconcile();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
