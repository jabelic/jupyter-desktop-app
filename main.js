const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);
const path = require('path')
const processes = []
const startLab = (appPath) => {
    // 1. .git, requirements.txt, .ipynb_checkpoints
    // 2. file directory
    const dir = path.dirname(appPath) // jupyterのところまで取れる
    const cp = spawn("jupyter", ["lab"], {
        cwd: dir,
    })
    processes.push(cp)
    cp.stdout.on('data', (data)=>{
        console.log(data)
    })
}

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // win.loadFile('index.html')
  const appPath = '/Users/jabelic/dev/elec/jupyter/Untitled.ipynb'
  startLab(appPath)
//   win.loadURL('http://localhost:8888/?token=72bdeac4a38f9ca2508d495363a8b84bf9840cae3d31ef92')
//   const root = fs.readdirSync('.')
//   console.log(root)

  win.on('closed', ()=>{
      win = null
  })
}

app.whenReady().then(createWindow)
app.on('open-file', (event, filePath) => {
    console.log(filePath)
    // event.preventDefault();
    if (myApp.mainWindow) {
        startLab(appPath)
    //   myApp.mainWindow.webContents.send('dropTextFile', filePath);
    } else {
    //   launchArgs = { filePath: filePath };
    }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
