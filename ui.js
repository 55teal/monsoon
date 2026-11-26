/* MONSOON UI engine: XMB-style navigation, submenus, controls, modals, background, sounds. Real & working. */
(() => {
const $ = s => document.querySelector(s);
const st = {set:{}, fav:{}, last:{}};
let ukey = null, gate = null; // ukey = storage key of the signed-in user; gate = input interceptor (login screens)
const save = () => { if (ukey) try { localStorage[ukey] = JSON.stringify(st) } catch (e) {} };
function loadUser(id) { // swap in a user's settings/favourites/history
  ukey = id && 'monsoon.u.' + id; let d = {};
  try { d = JSON.parse(localStorage[ukey]) || {} } catch (e) {}
  st.set = d.set || {}; st.fav = d.fav || {}; st.last = d.last || {};
  stack = []; edit = 0; applyAll(); if (M.length) render();
}
const get = (k, d) => k in st.set ? st.set[k] : d;
const ICON = {
  home:'M3 11l9-8 9 8v10h-6v-6H9v6H3z',
  games:'M7 6h10a5 5 0 015 5v3.2a3.3 3.3 0 01-5.9 2L15 14.5H9l-1.1 1.7a3.3 3.3 0 01-5.9-2V11a5 5 0 015-5zM7.5 9.2v3.6M5.7 11h3.6M16 10h.01M18 12h.01',
  media:'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z',
  social:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  downloads:'M12 3v12m-5-5l5 5 5-5M4 21h16',
  settings:'M12 15a3 3 0 100-6 3 3 0 000 6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  power:'M12 3v9M6.3 6.3a8 8 0 1011.4 0'
};
let M = [], cat = 0, stack = [], tops = [], list = [], edit = 0, modal = null, mi = 0, asleep = 0, device = 'kb';
const ticks = [];
const fr = () => stack.length ? stack[stack.length - 1] : tops[cat];

/* ---------- rendering ---------- */
const bar = p => `<span class=sl><span style="width:${p}%"></span></span>`;
function val(it) {
  const c = it.ctl, f = fr();
  if (!c) return it.bar != null ? bar(it.bar) + (it.v || '') : (it.v || '');
  const v = get(c.k, c.def), on = edit && it === list[f.i];
  if (c.t === 'toggle') return v ? 'On' : 'Off';
  if (c.t === 'select') return (on ? '‹ ' : '') + c.opts[v] + (on ? ' ›' : '');
  return bar((v - c.min) / (c.max - c.min) * 100) + v + c.u;
}
function fill(e, it) {
  e.innerHTML = `<i class=ic>${it.img ? `<img src="${it.img}" onerror="this.onerror=null;this.src='assets/default-icon.svg'">` : (it.ic || it.n[0])}</i><div class=tx><b>${it.n}</b><small>${it.s || ''}</small></div><span class=v>${val(it)}</span>${it.m ? '<em class=m>MOCK</em>' : ''}`;
}
const artBg = n => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360; return `linear-gradient(${h}deg,#1c1c1c,#7a7a7a ${40 + h % 30}%,#111)`; };
function pane(it) {
  $('#pane').innerHTML = it ? (it.art ? `<div class=art style="background:${artBg(it.n)}">${it.n[0]}${it.img ? `<img src="${it.img}" onerror="this.remove()">` : ''}</div>` : '') + `<h2>${it.n}</h2><p>${(it.d || '').replace(/\n/g, '<br>')}</p>` : '';
}
function place() {
  const f = fr();
  $('#list').style.transform = `translateY(${-f.i * 4.6}rem)`;
  [...$('#list').children].forEach((e, i) => {
    const d = i - f.i;
    e.classList.toggle('on', i === f.i);
    e.classList.toggle('ed', !!edit && i === f.i);
    e.style.opacity = d < -1 ? 0 : d < 0 ? .2 : Math.max(.12, 1 - d * .2);
  });
  pane(list[f.i]);
}
function render(swap) {
  const f = fr(), l = $('#list');
  list = f.items();
  f.i = Math.max(0, Math.min(f.i, list.length - 1));
  l.innerHTML = '';
  list.forEach(it => { const e = document.createElement('div'); e.className = 'it'; fill(e, it); l.append(e); });
  $('#ui').classList.toggle('sub', stack.length > 0);
  $('#crumb').textContent = stack.length ? '‹  ' + M[cat].n + '  /  ' + stack.map(s => s.t).join('  /  ') : '';
  $('#bar').style.setProperty('--i', cat);
  [...$('#bar').children].forEach((c, i) => c.classList.toggle('on', i === cat));
  if (swap !== false) { l.classList.remove('sw'); void l.offsetWidth; l.classList.add('sw'); }
  place();
}
function refresh() { // update text in place (no DOM rebuild, so transitions stay smooth)
  const f = fr(), nl = f.items();
  if (nl.length !== list.length) return render(false);
  list = nl;
  [...$('#list').children].forEach((e, i) => fill(e, list[i]));
  pane(list[f.i]);
}

/* ---------- settings ---------- */
const set = (k, v) => { st.set[k] = v; save(); };
const THEMES = ['XMB Auto (by month)', 'Monochrome', 'Midnight', 'Ember', 'Forest', 'Violet', 'Custom hue'];
const HUE = [0, 0, 215, 20, 140, 270];
const hsl = (h, s, l) => { h /= 360; const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return [f(0), f(8), f(4)]; };
const hx = c => '#' + c.map(x => x.toString(16).padStart(2, '0')).join('');
let A = '255,255,255'; // accent as r,g,b for canvas
function applyAll() {
  const r = document.documentElement.style, b = document.body, i = get('theme', 0);
  const h = i === 0 ? (new Date().getMonth() * 30 + 200) % 360 : i === 6 ? get('hue', 210) : HUE[i], sat = i === 1 ? 0 : get('sat', 100) / 100;
  const acc = hsl(h, sat * .75, .8);
  r.setProperty('--s', get('scale', 100) / 100); r.setProperty('--g', get('glow', 50) / 50); r.setProperty('--a', acc.join(' '));
  r.setProperty('--bt', hx(hsl(h, sat * .5, .3))); r.setProperty('--bm', hx(hsl(h, sat * .6, .11))); A = acc.join(',');
  b.classList.toggle('rm', !!get('rmotion', false)); b.classList.toggle('noart', !get('art', true));
  b.classList.toggle('wall', get('bgs', 0) === 3); b.dataset.is = get('istyle', 0);
  hints(); clock();
}
const PROMPTS = {kb:['↑ ↓ ← → Navigate','Enter Select','Esc Back'], xbox:['D-pad Navigate','A Select','B Back'], ps:['D-pad Navigate','✕ Select','○ Back']};
function hints() {
  const p = get('prompts', 0), k = p ? ['', 'kb', 'xbox', 'ps'][p] : (device === 'pad' ? 'xbox' : 'kb');
  $('#hints').textContent = PROMPTS[k].join('     ');
}
function clock() {
  const d = new Date(), c24 = get('c24', true);
  $('#clock').textContent = String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0') + '   ' + d.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', hour12: !c24});
}

/* ---------- sound (WebAudio blips; real) ---------- */
let ac;
function beep(f = 520, len = .05) {
  if (!get('snd', true)) return;
  try {
    ac = ac || new AudioContext();
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = f; g.gain.value = .06 * get('vol', 50) / 100;
    g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + len);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + len);
  } catch (e) {}
}

/* ---------- toast / modal / black screen ---------- */
let tt;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); }
const mpl = () => [...document.querySelectorAll('.btn')].forEach((e, i) => e.classList.toggle('on', i === mi));
function showModal(o) {
  modal = o; mi = o.f || 0;
  const b = o.b || [['OK']];
  $('#modal').innerHTML = `<div class=box><h2>${o.t}</h2><p>${(o.m || '').replace(/\n/g, '<br>')}</p>${o.code ? `<code>${o.code}</code>` : ''}<div class=btns>${b.map(x => `<span class=btn>${x[0]}</span>`).join('')}</div></div>`;
  $('#modal').style.display = 'grid'; mpl();
}
const closeModal = () => { modal = null; $('#modal').style.display = 'none'; };
function black(msg) { $('#black').textContent = msg; $('#black').style.display = 'grid'; asleep = 1; }

/* ---------- input handling ---------- */
function adj(it, d) {
  const c = it.ctl, v = get(c.k, c.def);
  set(c.k, c.t === 'slider' ? Math.max(c.min, Math.min(c.max, v + d * c.step)) : (v + d + c.opts.length) % c.opts.length);
  if (c.k === 'sysvol') System.volume(get('sysvol', 70)); applyAll(); refresh(); beep(660, .03);
}
function enter(it) {
  const f = fr();
  if (it.ctl) {
    if (it.ctl.t === 'toggle') { set(it.ctl.k, !get(it.ctl.k, it.ctl.def)); applyAll(); refresh(); }
    else { edit = 1; place(); refresh(); }
  } else if (it.kids) { push(it.n, it.kids); }
  else if (it.do) it.do();
}
function act(a) {
  if (gate) return gate(a);
  if (asleep) { asleep = 0; $('#black').style.display = 'none'; return; }
  if (a === 'wake') return;
  if (modal) {
    const b = modal.b || [['OK']];
    if (a === 'left' || a === 'up') mi = Math.max(0, mi - 1);
    else if (a === 'right' || a === 'down') mi = Math.min(b.length - 1, mi + 1);
    else if (a === 'back') closeModal();
    else if (a === 'ok') { const fn = b[mi][1]; closeModal(); fn && fn(); }
    mpl(); beep(); return;
  }
  const f = fr(), it = list[f.i];
  if (edit) {
    if (a === 'left') adj(it, -1); else if (a === 'right') adj(it, 1);
    else if (a === 'ok' || a === 'back') { edit = 0; refresh(); place(); beep(400); }
    return;
  }
  if (a === 'up' || a === 'down') {
    const n = Math.max(0, Math.min(list.length - 1, f.i + (a === 'up' ? -1 : 1)));
    if (n !== f.i) { f.i = n; place(); beep(); }
  } else if (a === 'left') {
    if (stack.length) pop(); else if (cat > 0) { cat--; render(); beep(440); }
  } else if (a === 'right') {
    if (!stack.length && cat < M.length - 1) { cat++; render(); beep(440); }
  } else if (a === 'ok' && it) { beep(760); enter(it); }
  else if (a === 'back' && stack.length) { pop(); beep(380); }
}
function push(t, items) { stack.push({t, items, i: 0}); render(); }
function pop() { stack.pop(); render(); }
function go(id) { cat = M.findIndex(m => m.id === id); stack = []; edit = 0; render(); }
const pickAt = i => { if (gate || modal || asleep) return; const f = fr(); if (i === f.i) act('ok'); else if (i >= 0 && i < list.length) { f.i = i; place(); beep(); } };
const catAt = i => { if (gate || modal || asleep || i === cat) return; cat = i; stack = []; edit = 0; render(); beep(440); };
const modalAt = i => { if (modal) { mi = i; act('ok'); } };

/* ---------- animated backgrounds: full-resolution canvas (Settings → Background quality scales it) ---------- */
const cv = $('#bg'), g = cv.getContext('2d');
let t = 0, last = 0;
const qual = () => [1, .75, .5][get('bgq', 0)] || 1;
const size = () => { cv.width = innerWidth * qual() | 0; cv.height = innerHeight * qual() | 0; };
addEventListener('resize', size); size();
const R = () => Math.random();
const dust = Array.from({length: 60}, () => ({x: R(), y: R(), s: .3 + R(), p: R() * 6}));
const rain = Array.from({length: 130}, () => ({x: R(), y: R(), l: .03 + R() * .06, s: .6 + R() * .8}));
const bokeh = Array.from({length: 26}, () => ({x: R(), y: R(), r: .05 + R() * .12, a: .4 + R() * .6, vx: (R() - .5) * .0004, vy: -.0001 - R() * .0003}));
const RB = [[.60,.07,2.2,.9,.17,0],[.66,.06,3,1.2,.12,1.7],[.54,.09,1.6,.7,.21,3.1],[.74,.05,3.6,1.5,.1,4.4],[.46,.06,2.6,.5,.15,5.5],[.82,.04,4.2,1.7,.08,2.4],[.38,.05,2,.6,.12,.9]]; // base,amp,freq,speed,thickness,phase
const spot = (w, a, pos) => { // horizontal gradient with a travelling bright spot
  const q = g.createLinearGradient(0, 0, w, 0), c = x => Math.min(1, Math.max(0, x));
  [[0, 0], [c(pos - .22), a * .3], [c(pos), a], [c(pos + .22), a * .3], [1, 0]].forEach(([o, al]) => q.addColorStop(o, `rgba(${A},${al})`)); return q;
};
function ribbons(w, h, n, m, sp) {
  const k = h / 1080, step = Math.max(6, w / 180);
  g.lineJoin = 'round';
  RB.slice(0, n).forEach(([b, a, f, s, th, ph]) => {
    const top = [], bot = [];
    for (let x = 0; x <= w + step; x += step) {
      const u = x / w, ha = get('wh', 50) / 50, y = h * (b + a * ha * Math.sin(u * f * 3 + t * s + ph) + a * ha * .5 * Math.sin(u * f * 5.5 - t * s * 1.3 + ph * 2));
      top.push([x, y]); bot.push([x, y + h * th * (.55 + .45 * Math.sin(u * 4 + t * .8 + ph))]);
    }
    const path = pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
    path(top); for (let i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]); g.closePath();
    g.fillStyle = spot(w, .11 * m, .5 + .3 * Math.sin(t * .3 + ph)); g.fill();
    const pos = ((t * .06 * sp + ph / 6.3) % 1.4) - .2;
    path(top);
    g.lineWidth = 12 * k; g.strokeStyle = spot(w, .06 * m, pos); g.stroke();
    g.lineWidth = 4 * k; g.strokeStyle = spot(w, .14 * m, pos); g.stroke();
    g.lineWidth = Math.max(1, 1.4 * k); g.strokeStyle = spot(w, .65 * m, pos); g.stroke();
    path(bot); g.lineWidth = Math.max(1, 1.2 * k); g.strokeStyle = spot(w, .18 * m, pos + .1); g.stroke();
  });
}
function draw(ts) {
  requestAnimationFrame(draw);
  if (ts - last < 33) return; last = ts;
  if (cv.width !== (innerWidth * qual() | 0)) size();
  const w = cv.width, h = cv.height, k = h / 1080, br = get('wbright', 50) / 50, sp = get('wspeed', 50) / 50, still = get('rmotion', false), mode = get('bgs', 0);
  if (!still) t += .012 * sp;
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h);
  g.globalCompositeOperation = 'lighter';
  const bl = g.createRadialGradient(w / 2, h * 1.05, 0, w / 2, h * 1.05, h * .9);
  bl.addColorStop(0, `rgba(${A},${.14 * br})`); bl.addColorStop(1, `rgba(${A},0)`); g.fillStyle = bl; g.fillRect(0, 0, w, h);
  if (mode === 1) {
    g.strokeStyle = `rgba(${A},${.3 * br})`; g.lineWidth = Math.max(1, 1.3 * k); g.beginPath();
    rain.forEach(d => { if (!still) { d.y += d.s * .012 * sp; if (d.y > 1) { d.y = -.1; d.x = R(); } } const x = d.x * w, y = d.y * h; g.moveTo(x, y); g.lineTo(x - d.l * h * .18, y + d.l * h); });
    g.stroke(); ribbons(w, h, 3, .35 * br, sp);
  } else if (mode === 2) {
    for (let i = 0; i < 4; i++) {
      const cx = w * (.5 + .38 * Math.sin(t * .5 + i * 1.7)), cy = h * (.45 + .25 * Math.cos(t * .4 + i * 2.3)), r = Math.max(w, h) * (.35 + .08 * i);
      const q = g.createRadialGradient(cx, cy, 0, cx, cy, r); q.addColorStop(0, `rgba(${A},${.17 * br})`); q.addColorStop(1, `rgba(${A},0)`);
      g.fillStyle = q; g.fillRect(0, 0, w, h);
    }
    ribbons(w, h, 2, .5 * br, sp);
  } else if (mode === 4) {
    bokeh.forEach(d => {
      if (!still) { d.x += d.vx * sp; d.y += d.vy * sp; if (d.y < -.2) { d.y = 1.2; d.x = R(); } }
      const x = d.x * w, y = d.y * h, r = d.r * h, q = g.createRadialGradient(x, y, 0, x, y, r);
      q.addColorStop(0, `rgba(${A},${.2 * br * d.a})`); q.addColorStop(.7, `rgba(${A},${.07 * br * d.a})`); q.addColorStop(1, `rgba(${A},0)`);
      g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    });
    ribbons(w, h, 2, .5 * br, sp);
  } else ribbons(w, h, mode === 3 ? 3 : get('wc', 7), mode === 3 ? .4 * br : br, sp);
  if (mode !== 1 && get('dust', true)) dust.forEach(d => {
    if (!still) { d.y -= d.s * .0004 * sp; if (d.y < 0) { d.y = 1; d.x = R(); } }
    g.fillStyle = `rgba(${A},${.45 * br * (.5 + .5 * Math.sin(t * 2 + d.p))})`; g.beginPath(); g.arc(d.x * w, d.y * h, (.8 + d.s) * k * 1.2, 0, 6.3); g.fill();
  });
}
requestAnimationFrame(draw);

/* ---------- now playing (simulated) ---------- */
const np = {
  t: null, p: 0,
  play(x) { this.t = x; this.p = 0; toast('Simulated playback: ' + x[0]); },
  stop() { this.t = null; $('#np').textContent = ''; }
};
const mmss = s => (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0');

function start(menus) {
  M = menus;
  $('#bar').innerHTML = M.map(m => `<div class=cat><svg viewBox="0 0 24 24"><path d="${ICON[m.id]}"/></svg><span>${m.n}</span></div>`).join('');
  tops = M.map(m => ({items: m.items, i: 0}));
  applyAll(); render();
  setInterval(() => {
    clock();
    ticks.forEach(f => f());
    if (np.t) { np.p++; if (np.p >= np.t[2]) np.stop(); else $('#np').textContent = `♪ ${np.t[0]} — ${mmss(np.p)} / ${mmss(np.t[2])} (simulated)`; }
    if (!modal && !edit && M[cat].live) refresh();
  }, 1000);
}

window.UI = {pickAt, catAt, modalAt, themes: THEMES, st, save, loadUser, setGate: f => { gate = f; }, get, set, toast, modal: showModal, push, pop, go, refresh, act, black, np, start, applyAll,
  tick: f => ticks.push(f), dev: d => { if (d !== device) { device = d; hints(); } }};
})();
