const { ipcRenderer } = window.require('electron');
// const os = require("os");
// export const shellCmd = {
//   win32: "C:\\Windows\\System32\\cmd.exe",
//   darwin: "/bin/bash",
//   linux: "/bin/bash",
//   sunos: "/bin/bash",
//   openbsd: "/bin/bash",
//   android: "/bin/bash",
//   aix: "/bin/bash"
// }

export const sendStatus = (message) => ipcRenderer.invoke('app-message', 'status', message);
export const sendError = (message) => ipcRenderer.invoke('app-message', 'error', message);
export const sendOutput = (message) => ipcRenderer.invoke('app-message', 'output', message);