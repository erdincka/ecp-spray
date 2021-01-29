const path = require('path');
const os = require('os');
const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');

let win;
function createWindow() {
  win = isDev ? new BrowserWindow({
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    }
  })
  :
  new BrowserWindow({
    // width: 960,
    // height: 800+300,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    }
  });
  
  // and load the index.html of the app.
  // win.loadFile('index.html');
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
      );
      if (isDev) {
        // Open the DevTools.
        const devTools = require('electron-devtools-installer');
        installExtension = devTools.default;
        win.webContents.openDevTools({ mode: 'bottom' });
      }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    unsubscribe(); // to remove store update reception
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const debugMsg = (message) => {
  return isDev ? console.dir('DEBUG: ' + message) : null;
}

const Store = require('electron-store');
const store = new Store();

const updateStoreStatus = (newValue, oldValue) => {
  debugMsg('STORED: ' + JSON.stringify(newValue));
}
const unsubscribe = store.onDidAnyChange(updateStoreStatus);

const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const { ipcMain } = require('electron');

const shell = require('shelljs');
shell.config.execPath = String(shell.which('node'));
shell.config.fatal = true;

// update interface with messages
// args[0] => status code (status, error, output)
// args[1] => message itself
ipcMain.handle('app-message', (event, ...args) => {
  debugMsg( 'APPMESSAGE: ' + args[1] + ' as (' + args[0] + ')' );
  switch(args[0]){
    case 'status':
      win.webContents.send('mainprocess-status', args[1]);
      break;
    case 'error':
      win.webContents.send('mainprocess-error', args[1]);
      break;
    case 'output':
      win.webContents.send('mainprocess-output', args[1]);
      break;
    default:
      win.webContents.send('mainprocess-status', 'Unknown: ' + args[1])
  }
})

fs = require('fs');

if (store.has('host')) console.log('defaults loaded')
else {
  fs.readFile('./public/ecp-config.json', 'utf8', (error, data) => {
    if (error) console.dir('error reading defaults')
    else store.store = JSON.parse(data);
  })
}

ipcMain.handle('get-store-value', (event, key) => {
  return JSON.stringify( store.get( key, {} ) );
});

ipcMain.handle('set-store-value', (event, key, value) => {
  debugMsg('store setting ' + key + ' to ' + value);
	store.set(key, JSON.parse(value));
});

const sshcmd = (user, host, opt) => ['ssh -o StrictHostKeyChecking=no -T -l', user, opt || '', host].join(' ');

// operate on store.key('host')
const getTarget = () => {
  let connectTo = {};
  host = store.get('host');
  debugMsg('HOST IS: ' + JSON.stringify(host));
  if (host.isremote) {
    connectTo['readyTimeout'] = 30000; // miliseconds to timeout
    connectTo['exec'] = '';
    if (host.useproxy) {
      connectTo['host'] = host.proxyhostname;
      connectTo['username'] = host.proxyusername;
      if (host.useproxykeyfile) {
        connectTo['privateKey'] = host.proxykeyfile.replace('~', os.homedir());
        connectTo['exec'] = sshcmd(host.username, host.hostname, '-i ' + host.keyfile.replace('~', os.homedir()));
      }
      else {
        connectTo['password'] = host.proxypassword;
        connectTo['tryKeyboard'] = true;
        connectTo['exec'] = sshcmd(host.username, host.hostname);
      }
    }
    else {
      connectTo['host'] = host.hostname;
      connectTo['username'] = host.username;
      if (host.usekeyfile)
        connectTo['privateKey'] = host.keyfile.replace('~', os.homedir());
      else {
        connectTo['tryKeyboard'] = true;
        connectTo['password'] = host.password;
      }
    }
  }
  else {
    connectTo = { host: 'localhost' }; // actually this is not used (called from runAtRemote only)
  }
  debugMsg('TARGET IS: ' + JSON.stringify(connectTo));
  return connectTo;
}

const runAtRemote = async (cmd) => {
  const host = getTarget();
  // const exec = host['exec'] + ' "' + cmd + '"';
  debugMsg('SSH TO: ' + JSON.stringify(host));
  debugMsg('SSH EXEC: ' + host['exec'] + " " + cmd);
  // open a connection if not exist
  if (!(ssh.isConnected() && ssh.connection)) {
    debugMsg('OPEN SSH CONN');
    await ssh.connect(host);
  }
  return ssh.execCommand(host['exec'] + ' ' + cmd, { stream: 'both' });
}

// Various system command processing
ipcMain.handle('get-system', (event, ...args) => {
  // args[0] allowed requests
  // args[1-] extra arguments if any
  switch(args[0]){
    case 'platform':
      debugMsg('PLATFORM: ' + process.platform);
      return process.platform;
      break;
    case 'canRunSsh':
      debugMsg('SSH CMD');
      return shell.which('ssh');
      // no need for break here
    // case 'requirements-ready':
    //   debugMsg('REQUIRED BY: ' + JSON.stringify(store.get('host')));
    //   return JSON.stringify(store.get('host'));
      // no need for break here
    case 'execute-command':
      debugMsg('RUN: ' + JSON.stringify(args[1]));
      return store.get('host.isremote') ? runAtRemote(args[1]) : shell.exec(args[1]);
      // no need for break here
    default:
      return undefined;
  }
})
