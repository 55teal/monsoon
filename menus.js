/* MONSOON menu tree. Items: {n, s, d, ic, art, bar, v, m(mock), kids(), do(), ctl}. All content is mock unless a setting is `real`. */
(() => {
const {st, save, get, toast, push, go, refresh, modal, np} = UI, D = Data, S = System;
const T = (n, s, o) => ({n, s, ...o});
const ne = a => a.length ? a : [T('Nothing here yet', 'Add favourites from a game’s menu')];
const ago = t => { const h = (Date.now() - t) / 36e5; return h < 1 ? 'just now' : h < 24 ? Math.round(h) + 'h ago' : Math.round(h / 24) + 'd ago'; };
const mmss = s => (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0');

/* settings controls: real = actually works in the prototype, otherwise stored only */
const C = (n, c, s) => ({n, s, ctl: c, m: !c.real, d: c.real ? 'Works in this prototype.' : 'Mock: saved, but not applied to the system yet.'});
const tg = (k, def, real) => ({t: 'toggle', k, def, real});
const sl = (k, def, min, max, step, real, u) => ({t: 'slider', k, def, min, max, step, real, u: u || ''});
const se = (k, opts, real) => ({t: 'select', k, opts, def: 0, real});

/* games */
const isFav = g => g.id in st.fav ? st.fav[g.id] : !!g.fav;
const lp = g => st.last[g.id] || g.last;
const recent = () => [...D.games].sort((a, b) => lp(b) - lp(a));
const launch = g => modal({t: 'Launch ' + g.n + '?', m: S.native ? 'This will run:' : 'Simulated. A real build would run:', code: S.cmd.launch(g), f: 0,
  b: [['Launch', () => { st.last[g.id] = Date.now(); save(); refresh(); S.launch(g).then(r => toast((r.dry || r.mock ? 'Simulated launch: ' : 'Launching: ') + g.n)); }], ['Cancel']]});
const gi = g => T(g.n, `${isFav(g) ? '★ ' : ''}${g.genre} · ${g.hrs}h · ${ago(lp(g))}`, {art: 1, img: 'assets/icons/' + g.id + '.png', d: g.d + `\n${g.size} GB installed`, kids: () => [
  T('Play', 'Launch ' + g.n, {ic: '▶', do: () => launch(g)}),
  T(isFav(g) ? 'Remove from favourites' : 'Add to favourites', '', {ic: '★', do: () => { st.fav[g.id] = !isFav(g); save(); refresh(); }}),
  T('Uninstall', g.size + ' GB', {ic: '✕', m: 1, do: () => modal({t: 'Uninstall ' + g.n + '?', m: 'Mock: nothing is deleted.', f: 1, b: [['Uninstall', () => toast('Mock: nothing removed')], ['Cancel']]})})]});

/* power */
const pw = (a, n, s, ic, verb) => T(n, s, {ic, do: () => modal({t: n + '?', m: S.native ? 'This will run:' : 'Simulated. A real build would run:', code: S.cmd.power[a], f: 1,
  b: [[n, () => { S.power(a).then(r => UI.black(r.dry || r.mock ? verb + ' (simulated' + (r.dry ? ': dry run, start with MONSOON_REAL=1' : '') + ')\n\nPress any key to return' : verb + '…')); }], ['Cancel']]})});

/* downloads (simulated progress, sped up for demo) */
UI.tick(() => {
  const a = D.dl.find(x => x.st !== 'paused');
  D.dl.forEach(x => x.act = x === a);
  if (!a) return;
  a.p = Math.min(100, a.p + a.rate / (a.size * 1024) * 100 * 20);
  if (a.p >= 100) { D.dl.splice(D.dl.indexOf(a), 1); D.done.unshift({n: a.n, when: 'Just now'}); toast('Download complete: ' + a.n); }
});
const dli = x => T(x.n, x.st === 'paused' ? 'Paused' : x.act ? `Downloading · ${x.rate} MB/s · ${x.size} GB` : 'Queued', {ic: '↓', bar: x.p, v: ' ' + (x.p | 0) + '%', kids: () => [
  T(x.st === 'paused' ? 'Resume' : 'Pause', '', {do: () => { x.st = x.st === 'paused' ? 'queued' : 'paused'; refresh(); }}),
  T('Cancel download', '', {m: 1, do: () => modal({t: 'Cancel download?', m: x.n, f: 1, b: [['Cancel download', () => { D.dl.splice(D.dl.indexOf(x), 1); UI.pop(); }], ['Keep']]})})]});

UI.start([
{id: 'home', n: 'Home', items: () => { const g = recent()[0]; return [
  T('Resume ' + g.n, 'Last played ' + ago(lp(g)), {art: 1, ic: '▶', d: g.d, do: () => launch(g)}),
  T('Jump back in', 'Recently played', {kids: () => recent().slice(0, 5).map(gi)}),
  T('Recent activity', D.feed.length + ' updates', {kids: () => D.feed.map(f => T(f[0], 'Open ' + f[1], {do: () => go(f[1])}))}),
  T('Downloads', D.dl.length + ' in queue', {do: () => go('downloads')})]; }},

{id: 'games', n: 'Games', items: () => [
  T('Installed', D.games.length + ' games', {kids: () => D.games.map(gi)}),
  T('Favourites', D.games.filter(isFav).length + ' games', {kids: () => ne(D.games.filter(isFav).map(gi))}),
  T('Recently played', 'Latest first', {kids: () => recent().slice(0, 5).map(gi)}),
  T('Library by genre', 'Browse', {kids: () => [...new Set(D.games.map(g => g.genre))].map(ge => T(ge, D.games.filter(g => g.genre === ge).length + ' games', {kids: () => D.games.filter(g => g.genre === ge).map(gi)}))}),
  T('Scan for games', 'Steam, Heroic, Lutris', {m: 1, do: () => toast('Mock: no library scanner connected')})]},

{id: 'media', n: 'Media', items: () => [
  T('Music', D.tracks.length + ' tracks', {kids: () => [...D.tracks.map(x => T(x[0], x[1] + ' · ' + mmss(x[2]), {ic: '♪', do: () => np.play(x)})), T('Stop playback', '', {ic: '■', do: () => np.stop()})]}),
  T('Video', D.videos.length + ' items', {kids: () => D.videos.map(v => T(v[0], v[1], {ic: '▶', art: 1, do: () => modal({t: v[0], m: 'Video playback is not implemented. A real build would run:', code: 'mpv --fs "/path/to/video.mkv"'})}))}),
  T('Images', D.images.length + ' items', {kids: () => D.images.map(v => T(v[0], v[1], {ic: '▣', art: 1, do: () => modal({t: v[0], m: 'Image viewer is not implemented. A real build would run:', code: 'imv "/path/to/image.png"'})}))})]},

{id: 'social', n: 'Social', items: () => [
  T('Profile', Users.name() + ' · Level 27', {kids: () => [T('Username', Users.name()), T('Level', '27 · 64% to next'), T('Member since', 'March 2024'), T('Change avatar', '', {m: 1, do: () => toast('Mock: avatar picker not built')})]}),
  T('Friends', D.friends.filter(f => f[1] !== 'Offline').length + ' online', {kids: () => D.friends.map(f => T(f[0], f[1], {ic: f[1] === 'Offline' ? '○' : '●', kids: () => [T('Send message', '', {m: 1, do: () => toast('Mock: composer not built')}), T('Invite to game', '', {m: 1, do: () => toast('Mock: invite sent to ' + f[0])})]}))}),
  T('Messages', D.msgs.filter(m => !m.read).length + ' unread', {kids: () => D.msgs.map(m => T(m.f, m.read ? 'Read' : 'New', {ic: m.read ? '✉' : '●', do: () => { m.read = 1; modal({t: m.f, m: m.txt, b: [['Close']]}); }}))}),
  T('Achievements', D.ach.filter(a => a.pct === 100).length + ' of ' + D.ach.length + ' complete', {kids: () => D.ach.map(a => T(a.n, a.d, {ic: '★', bar: a.pct, v: ' ' + a.pct + '%'}))})]},

{id: 'downloads', n: 'Downloads', live: 1, items: () => [
  ...D.dl.map(dli),
  T('Completed', D.done.length + ' items', {kids: () => D.done.map(x => T(x.n, x.when, {ic: '✓'}))}),
  T('Download settings', '', {kids: () => [C('Bandwidth limit', sl('bw', 0, 0, 100, 10, 0, ' MB/s'), '0 = unlimited'), C('Auto-update games', tg('auto', true, 0)), C('Download while asleep', tg('dlsleep', false, 0))]})]},

{id: 'settings', n: 'Settings', items: () => [
  T('Account', Users.name(), {kids: () => [
    T('Username', Users.name(), {ic: '✎', do: Users.rename}),
    T('Profile picture', 'Choose a new picture', {ic: '◉', do: Users.changePic}),
    T('PIN', Users.hasPin() ? 'On' : 'Off', {ic: '⚿', do: Users.setPin}),
    ...(Users.hasPin() ? [T('Remove PIN', '', {do: Users.removePin})] : []),
    T('Sign out', 'Switch user', {ic: '⇄', do: Users.logout}),
    T('Delete user', 'Removes this user and its data', {ic: '✕', do: Users.remove})]}),
  T('System', 'Information and reset', {kids: () => [...(S.info ? [T('Operating system', S.info.os), T('Session', S.info.session), T('CPU', S.info.cpu), T('Memory', S.info.mem)] : [T('Operating system', 'Arch Linux · Hyprland', {m: 1}), T('CPU', 'Intel Core i5-6600', {m: 1}), T('Memory', '8 GB', {m: 1})]), T('GPU', 'NVIDIA GTX 1050', {m: 1}), T('MONSOON', S.native ? 'Native shell 0.2' : 'Browser prototype 0.2'),
    T('Reset settings', 'Restore defaults', {do: () => modal({t: 'Reset settings?', m: 'Every setting returns to its default.', f: 1, b: [['Reset', () => { st.set = {}; save(); UI.applyAll(); refresh(); toast('Settings reset'); }], ['Cancel']]})})]}),
  T('Display', 'Resolution and scale', {kids: () => [C('Resolution', se('res', ['1920 × 1080', '2560 × 1440', '3840 × 2160'])), C('Refresh rate', se('hz', ['60 Hz', '120 Hz'])), C('HDR', tg('hdr', false)), C('UI scale', sl('scale', 100, 80, 130, 5, 1, '%'))]}),
  T('Audio', 'Volume and sounds', {kids: () => [C('System volume', sl('sysvol', 70, 0, 100, 5, S.native)), C('Interface sounds', tg('snd', true, 1)), C('Interface sound volume', sl('vol', 50, 0, 100, 10, 1)), C('Output', se('out', ['HDMI', 'Headphones', 'Bluetooth']))]}),
  T('Storage', 'Drives', {kids: () => [S.disk ? T('Root filesystem', ((S.disk.total - S.disk.free) / 2 ** 30).toFixed(0) + ' of ' + (S.disk.total / 2 ** 30).toFixed(0) + ' GB used', {bar: (S.disk.total - S.disk.free) / S.disk.total * 100 | 0}) : T('System SSD', '124 of 200 GB used', {m: 1, bar: 62}), T('Games drive', '610 of 1000 GB used', {m: 1, bar: 61}), T('Removable', 'Not connected', {m: 1})]}),
  T('Controller', 'Prompts and input', {kids: () => [C('Button prompts', se('prompts', ['Automatic', 'Keyboard', 'Xbox', 'PlayStation'], 1)), C('Stick deadzone', sl('dz', 15, 0, 50, 5, 0, '%')), C('Vibration', tg('vib', true)), C('Layout', se('lay', ['Default', 'Swapped A/B']))]}),
  T('Network', 'Connection', {kids: () => [C('Wi-Fi', tg('wifi', false)), T('Connection', 'Ethernet · 192.168.1.42', {m: 1}), C('DNS', se('dns', ['Automatic', 'Custom'])),
    T('Test connection', '', {m: 1, do: () => { toast('Testing connection…'); setTimeout(() => toast('Mock result: 412 Mbps down · 38 up · 9 ms'), 1400); }})]}),
  T('Personalisation', 'Look and feel', {kids: () => [C('Theme', se('theme', UI.themes, 1), 'Auto shifts colour with the month'), C('Hue (Custom theme)', sl('hue', 210, 0, 350, 10, 1)), C('Colour intensity', sl('sat', 100, 0, 100, 10, 1, '%')),
    C('Background', se('bgs', ['Silk waves', 'Monsoon rain', 'Aurora', 'Wallpaper', 'Bokeh'], 1), 'Wallpaper uses assets/wallpaper.jpg'), C('Background quality', se('bgq', ['High', 'Balanced', 'Light'], 1), 'Lower it if the GPU struggles'),
    C('Wave count', sl('wc', 7, 2, 7, 1, 1)), C('Wave height', sl('wh', 50, 0, 100, 10, 1)), C('Wave speed', sl('wspeed', 50, 0, 150, 10, 1)), C('Wave brightness', sl('wbright', 50, 0, 100, 10, 1)),
    C('Particles', tg('dust', true, 1)), C('Glow intensity', sl('glow', 50, 0, 100, 10, 1, '%')), C('Icon style', se('istyle', ['Glass', 'Outline', 'Round'], 1)), C('Art panel', tg('art', true, 1)),
    C('Start screen', se('start', ['Home', 'Games', 'Media', 'Social'], 1)), C('Reduce motion', tg('rmotion', false, 1)), C('24-hour clock', tg('c24', true, 1))]})]},

{id: 'power', n: 'Power', items: () => [
  T('Sign out', Users.name(), {ic: '⇄', do: Users.logout}),
  pw('sleep', 'Sleep', 'Suspend to RAM', '☾', 'Sleeping'),
  pw('restart', 'Restart', 'Reboot MONSOON', '↻', 'Restarting'),
  pw('shutdown', 'Shut down', 'Power off', '⏻', 'Shutting down'),
  pw('desktop', 'Exit to desktop', 'Leave the console session', '⌂', 'Exiting to desktop')]}
]);
})();
