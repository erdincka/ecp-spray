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

export const boolToString = (config) => {
  Object.keys(config).forEach( key => { 
    if (config[key] === true) config[key]='True';
    if (config[key] === false) config[key]='False';
  } );
  return config;
}

export const commandToCheck = (needed) => {
  const cmd = needed.check || needed.command;
  return (cmd.split(' ').length > 1 ? cmd : 'which ' + cmd);
}

export const readFromStore = async (key) => ipcRenderer.invoke('get-store-value', key);
export const saveToStore = async (key, val) => ipcRenderer.invoke('set-store-value', key, val);
export const getPlatform = async () => ipcRenderer.invoke('get-system', 'platform');
export const canSsh = async () => ipcRenderer.invoke('get-system', 'canRunSsh');

export const runCommand = async command => ipcRenderer.invoke('get-system', 'execute-command', command);

export const runMultiCommand = async (commands) => runCommand(commands.join('; '));

export const getCommandOutput = (result) => {
  // nodessh returns object with { stderr,stdout, ... }, shelljs returns string (it should return ShellString but didn't work on my tests)
  // TODO: verify shelljs return object/string, we can't get stderr
  let out, err = '';
  if (result.stdout === undefined) {
    out = result;
    err = null;
  }
  else {
    out = result.stdout;
    err = result.stderr;
  }
  return([out,err]);
}

export const installNeeded = async (need) => {
  const isremote = await readFromStore('host')['isremote'];
  const command = isremote ? need.install['linux'] : need.install[await getPlatform()];
  const installed = await runCommand(command)
    .then( (res) => {
      let [ out, err ] = getCommandOutput(res);
      sendOutput(out);
      // skip warning on Ubuntu (apt), report anything else
      if (err && err !== 'WARNING: apt does not have a stable CLI interface. Use with caution in scripts.' ) sendError(err)
      else return out;
    })
    .catch( error => sendError(error.message) );

    if (installed) {
      const verified = await runCommand( commandToCheck(need) )
        .then( res => {
          let [ out, err ] = getCommandOutput(res);
          if (err) sendError(err);
          return err ? null : out;
        })
        .catch( error => sendError(error.message) );
      return verified;
    }
    else return null;
}
