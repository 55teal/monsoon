/* Keyboard + Gamepad API → semantic actions (up/down/left/right/ok/back). Real & working. */
(() => {
const K = {ArrowUp:'up', w:'up', ArrowDown:'down', s:'down', ArrowLeft:'left', a:'left', ArrowRight:'right', d:'right',
           Enter:'ok', ' ':'ok', Escape:'back', Backspace:'back'};
addEventListener('keydown', e => {
  UI.dev('kb');
  if (UI.rawKey && UI.rawKey(e)) { e.preventDefault(); return; } // text entry on login screens
  const a = K[e.key];
  if (a) { e.preventDefault(); UI.act(a); } else UI.act('wake');
});

const held = {}, DIR = {up:1, down:1, left:1, right:1};
let raf;
function poll() {
  const p = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(x => x);
  if (p) {
    const b = i => p.buttons[i] && p.buttons[i].pressed, ax = p.axes;
    const s = {up: b(12) || ax[1] < -.6, down: b(13) || ax[1] > .6, left: b(14) || ax[0] < -.6, right: b(15) || ax[0] > .6, ok: b(0), back: b(1)};
    const now = performance.now();
    for (const a in s) {
      if (!s[a]) { delete held[a]; continue; }
      if (!(a in held)) { held[a] = now + (DIR[a] ? 380 : 1e9); UI.dev('pad'); UI.act(a); }
      else if (now > held[a]) { held[a] = now + 110; UI.act(a); }
    }
  }
  raf = requestAnimationFrame(poll);
}
addEventListener('gamepadconnected', () => { UI.toast('Controller connected'); if (!raf) poll(); });
addEventListener('gamepaddisconnected', () => UI.toast('Controller disconnected'));

// mouse: cursor shows only while moving; click and wheel work everywhere
let ct; addEventListener('mousemove', () => { document.body.style.cursor = 'default'; clearTimeout(ct); ct = setTimeout(() => document.body.style.cursor = 'none', 2500); });
addEventListener('click', e => {
  const q = s => e.target.closest(s), idx = el => [...el.parentNode.children].indexOf(el);
  if (q('.it')) UI.pickAt(idx(q('.it'))); else if (q('.cat')) UI.catAt(idx(q('.cat'))); else if (q('.btn')) UI.modalAt(idx(q('.btn')));
});
let wt = 0; addEventListener('wheel', e => { const n = performance.now(); if (n - wt > 120) { wt = n; UI.act(e.deltaY > 0 ? 'down' : 'up'); } }, {passive: true});
})();
