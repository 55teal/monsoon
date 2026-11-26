/* MONSOON native shell. Real actions only run when MONSOON_REAL=1 (the console session sets it);
 * otherwise they are dry runs that only return the command. The UI can only call the whitelisted handlers below. */
const {app, BrowserWindow, ipcMain} = require('electron');
const {spawn, execFile} = require('child_process');
const os = require('os'), fs = require('fs'), path = require('path');
const REAL = process.env.MONSOON_REAL === '1', WINDOWED = process.env.MONSOON_WINDOWED === '1';
const POWER = {sleep: ['systemctl', 'suspend'], restart: ['systemctl', 'reboot'], shutdown: ['systemctl', 'poweroff']};
app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(() => {
  const w = new BrowserWindow({fullscreen: !WINDOWED, kiosk: !WINDOWED, width: 1280, height: 720, backgroundColor: '#000', autoHideMenuBar: true,
    webPreferences: {preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true}});
  w.loadFile(path.join(__dirname, 'index.html'));
  w.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
  w.webContents.on('will-navigate', e => e.preventDefault());
  w.webContents.on('before-input-event', (e, i) => { if (i.control && i.key.toLowerCase() === 'q') app.quit(); }); // dev escape hatch
});
app.on('window-all-closed', () => app.quit());

const run = (cmd, dry) => {
  if (!REAL) return {ok: true, dry: true, cmd: cmd.join(' ')};
  spawn(cmd[0], cmd.slice(1), {detached: true, stdio: 'ignore'}).unref(); return {ok: true};
};
ipcMain.handle('launch', (e, id) => Number.isInteger(id) ? run(['steam', 'steam://rungameid/' + id]) : {ok: false});
ipcMain.handle('power', (e, a) => {
  if (a === 'desktop') { if (REAL) app.quit(); return {ok: true, dry: !REAL}; }
  return POWER[a] ? run(POWER[a]) : {ok: false};
});
ipcMain.handle('volume', (e, v) => {
  if (!Number.isInteger(v) || v < 0 || v > 100) return {ok: false};
  if (REAL) execFile('wpctl', ['set-volume', '@DEFAULT_AUDIO_SINK@', v + '%'], () => {});
  return {ok: true, dry: !REAL};
});
ipcMain.handle('sysinfo', () => {
  let name = 'Linux'; try { name = fs.readFileSync('/etc/os-release', 'utf8').match(/PRETTY_NAME="?([^"\n]+)/)[1]; } catch (e) {}
  return {os: name, session: process.env.XDG_CURRENT_DESKTOP || process.env.XDG_SESSION_DESKTOP || 'MONSOON',
          cpu: os.cpus()[0].model.replace(/\s+/g, ' '), mem: Math.round(os.totalmem() / 2 ** 30) + ' GB'};
});
ipcMain.handle('storage', () => { try { const s = fs.statfsSync('/'); return {total: s.blocks * s.bsize, free: s.bavail * s.bsize}; } catch (e) { return null; } });
ipcMain.handle('profiles', () => { try { return fs.readdirSync(path.join(__dirname, 'assets', 'profiles')).filter(f => /\.(png|jpe?g|webp|svg|gif)$/i.test(f)).sort().map(f => 'assets/profiles/' + encodeURIComponent(f)); } catch (e) { return []; } });
