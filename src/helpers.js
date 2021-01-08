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

export const commandToCheck = (needed) => {
  const cmd = needed.check || needed.command;
  return (cmd.split(' ').length > 1 ? cmd : 'which ' + cmd);
}

export const runCommand = async command => await ipcRenderer.invoke('get-system', 'execute-command', command);

export const runMultiCommand = commands => runCommand(commands.join('; '));

export const getCommandOutput = (result) => {
  // nodessh returns object with { stderr,stdout, ... }, shelljs returns string
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
  const platform = await ipcRenderer.invoke('get-system', 'platform');
  const os = platform === 'linux' ? await ipcRenderer.invoke('get-system', 'execute-command', 'lsb_release -i')
    .then( res => res.stdout.split(':')[1].trim().toLowerCase() ) // extract os release name
    .catch(error => sendError(error.message.replace('Error invoking remote method \'get-system\':', '')))
    :
    platform;

  const installed = await ipcRenderer.invoke('get-system', 'execute-command', need.installCommand[os])
    .then( async (res) => {
      let [ out, err ] = getCommandOutput(res);
      sendOutput(out);
      // skip warning on Ubuntu (apt), report anything else
      if (err && ! (os === 'Ubuntu' && err === 'WARNING: apt does not have a stable CLI interface. Use with caution in scripts.' )) sendError(err)
      else return out;
    })
    .catch( error => sendError(error.message) );

    if (installed) {
      const verified = await ipcRenderer.invoke('get-system', 'execute-command', commandToCheck(need) )
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
