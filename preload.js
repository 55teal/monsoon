const {contextBridge, ipcRenderer} = require('electron');
const call = c => (...a) => ipcRenderer.invoke(c, ...a);
contextBridge.exposeInMainWorld('monsoonNative', {launch: call('launch'), power: call('power'), volume: call('volume'), sysinfo: call('sysinfo'), profiles: call('profiles'), storage: call('storage')});
