const path = require("path");

const { app, BrowserWindow } = require("electron");
const isDev = require("electron-is-dev");

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 400+300,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });
  
  // and load the index.html of the app.
  // win.loadFile("index.html");
  win.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
      );
      
      // Open the DevTools.
      if (isDev) {
        const devTools = require("electron-devtools-installer");
        installExtension = devTools.default;
        win.webContents.openDevTools({ mode: "bottom" });
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
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    unsubscribe(); // to remove store update reception
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const Store = require('electron-store');
const store = new Store();

const updateStoreStatus = (newValue, oldValue) => {
  // win.webContents.send('mainprocess-output', JSON.stringify(newValue));
  // console.dir(newValue)
  // https://stackoverflow.com/a/57899958/7033031
  const c = Object.entries(newValue).reduce((c, [k, v]) => Object.assign(c, oldValue[k] ? {} : { [k]: v }), {});
  console.dir(c);
}

const unsubscribe = store.onDidAnyChange(updateStoreStatus);

var commandExists = require('command-exists');
const { NodeSSH } = require('node-ssh');

const { ipcMain } = require('electron')

// update interface with messages
// args[0] => status code (status, error, output)
// args[1] => message itself
ipcMain.handle('app-message', (event, ...args) => {
  switch(args[0]){
    case "status":
      win.webContents.send('mainprocess-status', args[1]);
      break;
    case "error":
      win.webContents.send('mainprocess-error', args[1]);
      break;
    case "output":
      win.webContents.send('mainprocess-output', args[1]);
      break;
    default:
      win.webContents.send('mainprocess-status', "Unknown: " + args[1])
  }
})

fs = require('fs');

if (store.has("ezmeral")) console.log('defaults loaded')
else {
  fs.readFile('ecp-config.json', 'utf8', (error, data) => {
    if (error) console.dir("error reading defaults")
    else store.store = JSON.parse(data);
  })
}
ipcMain.handle('get-store-value', (event, key) => {
  return store.has(key) ? JSON.stringify(store.get(key)) : '{}'
});

ipcMain.handle('set-store-value', (event, key, value) => {
	store.set(key, JSON.parse(value));
});

const sshcmd = (user, host, opt) => ['ssh -o StrictHostKeyChecking=no -T -l', user, opt, host].join(' ');

// operate on store.key('host')
const getTarget = () => {
  target = store.get('host');
  console.dir(target);
  if (target.useProxy) {
    connectTo = { host: target.proxyhostname, username: target.proxyusername };
    connectTo['execCmd'] = 'timeout 30s ' + sshcmd(target.username, target.hostname, '-i ' + target.keyfile)
    if (target.useProxyKeyFile) 
      connectTo[privateKey] = target.proxykeyfile;
    else 
      connectTo[password] = target.proxypassword;
  }
  else {
    connectTo = { host: target.hostname, username: target.username }
    connectTo['execCmd'] = '';
    if (host.useKeyFile)
      connectTo[privateKey] = target.keyfile;
    else
      connectTo[password] = target.password;
  }
  connectTo[readyTimeout] = 30000; // miliseconds to timeout
  return connectTo;
}

const testSshConnect = () => {
  const ssh = new NodeSSH();
  const host = getTarget();
  const execCmd = host.execCmd + ' false';
  host['execCmd'] = undefined;

  return ssh.connect(host).then( () => ssh.execCommand(execCmd) );
}

// operate on store.key('host') or localhost (based on store.key('protocol'))
const checkRequirements = () => {
  if (store.get('protocol') === 'localhost'){
    host = 'localhost'
  }
  else { // via ssh
    const host = getTarget();
    console.dir(host);    
}

}
// Various system command processing
ipcMain.handle('get-system', (event, ...args) => {
  // args[0] allowed requests
  // args[1-] extra arguments if any
  switch(args[0]){
    case 'platform':
      return process.platform;
      // no need for break here
    case 'canRunSsh':
      return commandExists.sync('ssh');
      // no need for break here
    case 'testSshConnect':
      return testSshConnect(args[1]);
    case 'requirements-ready':
      return checkRequirements();
    default:
      return undefined;
  }
})

// Get configuration on start
// let appConfig;
// fs.readFile('config.json', 'utf8', (error, data) => {
//   if (error) appConfig = {};
//   else appConfig = JSON.parse(data);  
// })

// // Get configuration item
// ipcMain.handle('get-config', (event, item) => {
//   result = appConfig && appConfig[item] ? JSON.stringify(appConfig[item]) : "{}"; // fallback to empty object
//   return result;
// })

// // Save configuration item
// ipcMain.handle('save-config', async (event, item, data) => {
//   appConfig[item] = data;
//   const result = await fs.promises.writeFile('config.json', JSON.stringify(appConfig));
//   return result;
// })

// let appState; // JSON object holding all app settings
// fs.readFile('state.json', 'utf8', (error, data) => {
//   if (error) appState = {};
//   else appState = JSON.parse(data);  
// })

// // Get state
// ipcMain.handle('get-state', (event) => {
//   result = appState ? JSON.stringify(appState) : "{}"; // fallback to empty object
//   return result;
// })

// // Save configuration item
// ipcMain.handle('save-state', async (event, data) => {
//   appState = data;
//   const result = await fs.promises.writeFile('state.json', JSON.stringify(appState));
//   return result;
// })


// Save any file
// TODO: should be disabled
// args = [filename, content]
// ipcMain.handle('save-file', async (event, ...args) => {
//   filename = args[0]
//   data = args[1]
//   return await fs.promises.writeFile(filename, data);
// })

// Read any file
// TODO: should be disabled
// args = [filename, callback]
// ipcMain.handle('read-file', async (event, filename) => {
//   const result = await fs.promises.readFile(filename, "utf8")
//     .then(res => JSON.parse(res))
//     .catch(err => { console.dir(err); return JSON.parse("{}") }) // if error, return empty object
//   // console.dir(result)
//   return result;
// })


// const child_process = require('child_process')

// Run any command -- too dangerous in prod
// TODO: should be disabled
// ipcMain.handle('run-command', (event, ...args) => {
//   const command = args.join(' ')
//   var child = child_process.spawn(command, {
//     encoding: 'utf8',
//     shell: true
//   });

//   child.on('error', (error) => {
//     dialog.showMessageBox({
//       title: 'Error',
//       type: 'warning',
//           message: 'Error occured.\r\n' + error
//       });
//   });

//   child.stdout.setEncoding('utf8');
//   child.stdout.on('data', (data) => {
//       data=data.toString();
//       win.webContents.send('mainprocess-output', data);
//       console.dir(data);
//   });

//   child.stderr.setEncoding('utf8');
//   child.stderr.on('data', (data) => {
//       // Return some data to the renderer process with the mainprocess-response ID
//       win.webContents.send('mainprocess-error', data);
//       //Here is the output from the command
//       console.error(data);
//   });

//   child.on('close', (code) => {
//       //Here you can get the exit code of the script
//       switch (code) {
//           case 0:
//             console.info('Success: ' + command)
//             break;
//       }
//   });
//   if (typeof callback === 'function') 
//     callback();
// })
