/* MONSOON system adapter. Inside the native shell (Electron, see main.js) window.monsoonNative exists and
 * these calls reach Linux through a WHITELIST in main.js. In a plain browser everything stays mock. */
const N = window.monsoonNative;
window.System = {
  native: !!N, mock: !N, info: null, disk: null,
  cmd: {  // shown in confirmation dialogs
    launch: g => `steam steam://rungameid/${g.id}`,
    power: { sleep: 'systemctl suspend', restart: 'systemctl reboot', shutdown: 'systemctl poweroff', desktop: 'quit MONSOON (ends the session)' }
  },
  launch: g => N ? N.launch(g.id) : Promise.resolve({ok: true, mock: true}),
  power: a => N ? N.power(a) : Promise.resolve({ok: true, mock: true}),
  profiles: async () => { // native: folder listing; http server: directory listing; file:// browser: assets/profiles.js
    if (N) return N.profiles();
    let names = (window.PROFILE_PICS || []).slice();
    if (location.protocol.startsWith('http')) try {
      const t = await (await fetch('assets/profiles/')).text();
      names = names.concat([...t.matchAll(/href="([^"?#]+\.(?:png|jpe?g|webp|svg|gif))"/gi)].map(m => decodeURIComponent(m[1]).split('/').pop()));
    } catch (e) {}
    return [...new Set(names)].map(f => 'assets/profiles/' + encodeURIComponent(f));
  },
  volume: v => N ? N.volume(v) : Promise.resolve({ok: true, mock: true})
  // TODO: real game library scan, network (nmcli), display modes (hyprctl/wlr-randr), real PAM login.
};
if (N) { N.sysinfo().then(i => System.info = i); N.storage().then(d => System.disk = d); }
