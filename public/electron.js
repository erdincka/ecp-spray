const path = require("path");

const { app, BrowserWindow } = require("electron");
const isDev = require("electron-is-dev");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 650,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
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

const { ipcMain, dialog } = require('electron')
const child_process = require('child_process')

ipcMain.handle('run-command', (event, ...args) => {
  const command = args.join(' ')
  var child = child_process.spawn(command, {
    encoding: 'utf8',
    shell: true
  });

  child.on('error', (error) => {
    dialog.showMessageBox({
      title: 'Error',
      type: 'warning',
          message: 'Error occured.\r\n' + error
      });
  });

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (data) => {
      data=data.toString();
      win.webContents.send('mainprocess-output', data);
      console.dir(data);
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (data) => {
      // Return some data to the renderer process with the mainprocess-response ID
      win.webContents.send('mainprocess-error', data);
      //Here is the output from the command
      console.error(data);
  });

  child.on('close', (code) => {
      //Here you can get the exit code of the script
      switch (code) {
          case 0:
            console.info('Success: ' + command)
            break;
      }
  });
  if (typeof callback === 'function') 
    callback();
})
