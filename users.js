/* MONSOON user profiles + sign-in screens. PROTOTYPE: profiles live in localStorage, not real OS accounts. */
(() => {
const LS = localStorage, $ = s => document.querySelector(s);
let users = []; try { users = JSON.parse(LS['monsoon.users']) || []; } catch (e) {}
let cur = null, sc = null, focus = {r: 0, c: 0};
const persist = () => { LS['monsoon.users'] = JSON.stringify(users); };
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const rnd = () => hex(crypto.getRandomValues(new Uint8Array(8)));
async function H(s) {
  if (window.crypto && crypto.subtle) return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  let h = 5381; for (const c of s) h = (h * 33 ^ c.charCodeAt(0)) >>> 0; return 'x' + h; // weak fallback
}

/* profile pictures: your files in assets/profiles/ + 12 built-in generated ones ('b:N') */
const GL = ['M50 14l9 22 24 2-18 16 6 24-21-13-21 13 6-24-18-16 24-2z', 'M50 15C50 15 25 45 25 62a25 25 0 0050 0C75 45 50 15 50 15z', 'M60 20a32 32 0 100 60 26 26 0 010-60z',
  'M56 12L28 56h20l-6 32 30-46H52z', 'M50 14l30 36-30 36-30-36z', 'M14 50c12-18 24-18 36 0s24 18 36 0v16c-12 18-24 18-36 0s-24-18-36 0z'];
const builtin = i => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${i * 47 % 360},55%,62%)'/><stop offset='1' stop-color='hsl(${i * 47 % 360},60%,16%)'/></linearGradient></defs><rect width='100' height='100' fill='url(#g)'/><path d='${GL[i % 6]}' fill='#fff' fill-opacity='.9'/></svg>`);
const src = p => !p ? 'assets/default-avatar.svg' : p.startsWith('b:') ? builtin(+p.slice(2)) : p;
const img = p => `<img src="${src(p)}" onerror="this.onerror=null;this.src='assets/default-avatar.svg'">`;
const setWho = () => { $('#who').innerHTML = cur ? `<span class=wa>${img(cur.pic)}</span><b>${cur.name}</b>` : ''; };

const lg = document.createElement('div'); lg.id = 'login'; document.body.append(lg);
lg.addEventListener('click', e => { const k = e.target.closest('.k'); if (!k || !sc) return; focus = {r: +k.dataset.r, c: +k.dataset.c}; paint(); sc.pick(sc.rows[focus.r][focus.c]); });
lg.addEventListener('mousemove', e => { const k = e.target.closest('.k'); if (k && sc && (+k.dataset.r !== focus.r || +k.dataset.c !== focus.c)) { focus = {r: +k.dataset.r, c: +k.dataset.c}; paint(); } });
const open = mode => { lg.className = mode; lg.style.display = 'grid'; document.body.classList.toggle('lg', mode === 'full'); UI.setGate(act); };
const shut = () => { lg.style.display = 'none'; document.body.classList.remove('lg'); UI.setGate(null); UI.rawKey = null; };

/* generic focusable grid screen; the focused key scrolls into view (carousel / picker) */
function screen(o) {
  sc = o; focus = o.at || {r: 0, c: 0};
  lg.innerHTML = `<div class=lgi><h1>${o.title}</h1>${o.show ? '<div class=fld></div>' : ''}<p class=msg></p><div class="rows ${o.cls || ''}">${
    o.rows.map((r, i) => `<div class=row>${r.map((k, j) => `<span class="k ${k.cls || ''}" data-r=${i} data-c=${j}>${k.h || k.l}</span>`).join('')}</div>`).join('')}</div></div><div class=lh>Arrows / D-pad  Move  ·  Enter / A  Select  ·  Esc / B  Back</div>`;
  UI.rawKey = o.key || null; paint(true);
}
function paint(first) {
  lg.querySelectorAll('.row').forEach((row, i) => [...row.children].forEach((k, j) => k.classList.toggle('on', i === focus.r && j === focus.c)));
  const f = lg.querySelector('.fld'); if (f && sc.show) f.textContent = sc.show();
  lg.querySelector('.msg').textContent = sc.msg ? sc.msg() : '';
  const on = lg.querySelector('.k.on'); if (on && sc.cls) on.scrollIntoView({block: 'nearest', inline: 'center', behavior: first ? 'auto' : 'smooth'});
}
function act(a) {
  const R = sc.rows;
  if (a === 'up') focus.r = Math.max(0, focus.r - 1);
  else if (a === 'down') focus.r = Math.min(R.length - 1, focus.r + 1);
  else if (a === 'left') focus.c = Math.max(0, focus.c - 1);
  else if (a === 'right') focus.c++;
  else if (a === 'ok') return sc.pick(R[focus.r][Math.min(focus.c, R[focus.r].length - 1)]);
  else if (a === 'back') return sc.back && sc.back();
  focus.c = Math.min(focus.c, R[focus.r].length - 1); paint();
}

/* on-screen keyboard (also accepts a physical keyboard) */
function askText(title, init, check, done, cancel) {
  let v = init || '', caps = false, msg = '';
  const submit = () => { const e = check(v); if (e) { msg = e; paint(); } else done(v); };
  const draw = () => screen({title, show: () => v + '▏', msg: () => msg, at: {...focus},
    rows: ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm_-.'].map(s => [...s].map(ch => ({l: caps ? ch.toUpperCase() : ch, v: caps ? ch.toUpperCase() : ch})))
      .concat([[{l: '⇧', v: '⇧', cls: 'w'}, {l: '⌫', v: '⌫', cls: 'w'}, {l: 'Cancel', v: 'C', cls: 'w'}, {l: 'Done', v: 'D', cls: 'w'}]]),
    pick: x => {
      msg = '';
      if (x.v === '⇧') { caps = !caps; draw(); } else if (x.v === '⌫') { v = v.slice(0, -1); paint(); }
      else if (x.v === 'C') cancel && cancel(); else if (x.v === 'D') submit();
      else if (v.length < 16) { v += x.v; if (caps) { caps = false; draw(); } else paint(); }
    },
    back: cancel,
    key: e => {
      if (e.key === 'Backspace') { v = v.slice(0, -1); msg = ''; paint(); return true; }
      if (e.key === 'Enter') { submit(); return true; }
      if (e.key === ' ') return true;
      if (/^[A-Za-z0-9_.-]$/.test(e.key)) { if (v.length < 16) { v += e.key; msg = ''; paint(); } return true; }
      return false;
    }});
  draw();
}

/* PIN keypad */
function askPin(title, done, cancel, msg0) {
  let v = '', msg = msg0 || '';
  const fail = m => { v = ''; msg = m; paint(); };
  const add = d => { if (v.length < 4) { v += d; msg = ''; paint(); if (v.length === 4) setTimeout(() => done(v, fail), 150); } };
  screen({title, show: () => '●'.repeat(v.length) + '○'.repeat(4 - v.length), msg: () => msg,
    rows: [[1, 2, 3], [4, 5, 6], [7, 8, 9], ['⌫', 0, 'Cancel']].map(r => r.map(x => ({l: x === 'Cancel' ? '✕' : String(x), v: String(x), cls: 'pin'}))),
    pick: x => x.v === '⌫' ? (v = v.slice(0, -1), paint()) : x.v === 'Cancel' ? cancel && cancel() : add(x.v),
    back: cancel,
    key: e => { if (/^\d$/.test(e.key)) { add(e.key); return true; } if (e.key === 'Backspace') { v = v.slice(0, -1); paint(); return true; } return false; }});
}
function newPin(done, cancel, m) {
  askPin('Choose a PIN', p => askPin('Confirm PIN', (p2, fail) => p2 === p ? done(p) : newPin(done, cancel, 'PINs did not match'), cancel), cancel, m);
}

/* profile picture picker: [+ browse] + files from assets/profiles/ + built-ins */
const fileIn = document.createElement('input'); fileIn.type = 'file'; fileIn.accept = 'image/*'; fileIn.style.display = 'none'; document.body.append(fileIn);
function pickFile(done) { // any image from anywhere, shrunk to 256px and stored with the profile
  fileIn.value = ''; fileIn.onchange = () => {
    const f = fileIn.files[0]; if (!f) return;
    const im = new Image(); im.onload = () => {
      const c = document.createElement('canvas'), n = Math.min(im.width, im.height); c.width = c.height = 256;
      c.getContext('2d').drawImage(im, (im.width - n) / 2, (im.height - n) / 2, n, n, 0, 0, 256, 256);
      done(c.toDataURL('image/jpeg', .88));
    };
    im.onerror = () => UI.toast('Could not read that image'); im.src = URL.createObjectURL(f);
  };
  fileIn.click();
}
function askPic(curPic, done, cancel) {
  System.profiles().then(mine => {
    const all = ['file', ...mine, ...Array.from({length: 12}, (_, i) => 'b:' + i)], rows = [];
    for (let i = 0; i < all.length; i += 6) rows.push(all.slice(i, i + 6).map(p => ({v: p, cls: 'pf', h: p === 'file' ? '<span class="av2 plus">+</span>' : `<span class=av2>${img(p)}</span>`})));
    const n = Math.max(1, all.indexOf(curPic));
    screen({title: 'Choose a profile picture', cls: 'pk', rows, at: {r: n / 6 | 0, c: n % 6},
      msg: () => mine.length ? '+ browses for any image on this computer' : 'No files found in assets/profiles/ · use + to browse for an image',
      pick: x => x.v === 'file' ? pickFile(done) : done(x.v), back: cancel});
  });
}

/* flows */
function userSelect() {
  open('full'); cur = null; setWho();
  if (!users.length) return signup(false);
  const tiles = users.map(u => ({v: u.id, cls: 't', h: `<span class=av2>${img(u.pic)}</span><b>${u.name}${u.pin ? ' ⚿' : ''}</b>`}))
    .concat({v: '+', cls: 't', h: '<span class="av2 plus">+</span><b>Add user</b>'});
  screen({title: 'Who’s playing?', cls: 'car', rows: [tiles], at: {r: 0, c: Math.max(0, users.findIndex(u => u.id === LS['monsoon.last']))},
    pick: x => x.v === '+' ? signup(true) : tryLogin(users.find(u => u.id === x.v)), back: () => {}});
}
const nameCheck = self => v => v.length < 3 ? 'Use at least 3 characters'
  : users.some(u => u !== self && u.name.toLowerCase() === v.toLowerCase()) ? 'That name is already taken' : '';
function signup(canCancel) {
  const cancel = canCancel ? userSelect : null;
  askText(users.length ? 'Choose a username' : 'Create your user', '', nameCheck(null), name => askPic('b:0', pic => pinChoice(name, pic), () => signup(canCancel)), cancel);
}
function pinChoice(name, pic) {
  screen({title: 'Protect ' + name + '?', msg: () => 'Optional 4-digit PIN', rows: [[{l: 'Set PIN', v: 'p', cls: 'w'}, {l: 'Skip', v: 's', cls: 'w'}]],
    pick: x => x.v === 's' ? create(name, pic, null) : newPin(p => create(name, pic, p), () => pinChoice(name, pic)), back: () => askPic(pic, p => pinChoice(name, p), () => pinChoice(name, pic))});
}
async function create(name, pic, pin) {
  const salt = rnd(), u = {id: rnd(), name, pic, salt, pin: pin ? await H(pin + salt) : null, created: Date.now()};
  users.push(u); persist(); login(u);
}
function tryLogin(u) {
  if (!u.pin) return login(u);
  askPin('PIN for ' + u.name, async (p, fail) => (await H(p + u.salt)) === u.pin ? login(u) : fail('Incorrect PIN'), userSelect);
}
function login(u) {
  cur = u; LS['monsoon.last'] = u.id; UI.loadUser(u.id); setWho(); UI.go(['home', 'games', 'media', 'social'][UI.get('start', 0)]);
  UI.rawKey = null; UI.setGate(() => {});
  lg.innerHTML = `<div class=wl><span class=av2>${img(u.pic)}</span><h1>Welcome, ${u.name}</h1></div>`;
  setTimeout(shut, 1500);
}
const verify = cb => {
  if (!cur.pin) return cb();
  open('over'); askPin('Enter current PIN', async (p, fail) => (await H(p + cur.salt)) === cur.pin ? (shut(), cb()) : fail('Incorrect PIN'), shut);
};

window.Users = {
  name: () => cur ? cur.name : 'Guest',
  hasPin: () => !!(cur && cur.pin),
  logout() { UI.save(); UI.np.stop(); userSelect(); },
  rename() {
    open('over');
    askText('Change username', cur.name, nameCheck(cur), v => { cur.name = v; persist(); setWho(); shut(); UI.toast('Username changed'); UI.refresh(); }, shut);
  },
  changePic() { open('over'); askPic(cur.pic, p => { cur.pic = p; persist(); setWho(); shut(); UI.toast('Profile picture updated'); }, shut); },
  setPin() { verify(() => { open('over'); newPin(async p => { cur.salt = rnd(); cur.pin = await H(p + cur.salt); persist(); shut(); UI.toast('PIN set'); UI.refresh(); }, shut); }); },
  removePin() { verify(() => { cur.pin = null; persist(); UI.toast('PIN removed'); UI.refresh(); }); },
  remove() {
    verify(() => UI.modal({t: 'Delete ' + cur.name + '?', m: 'This removes the user, their settings and favourites.', f: 1,
      b: [['Delete', () => { const id = cur.id; users = users.filter(u => u !== cur); persist(); delete LS['monsoon.u.' + id]; UI.loadUser(null); UI.np.stop(); userSelect(); }], ['Cancel']]}));
  }
};

userSelect();
})();
