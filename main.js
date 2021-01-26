const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);
const path = require('path')
let win = null
// let processes = []
let ready = false
let openUrlFilePath= ""

let windows = {}

const findWindow = (filePath) => {
    const rootLacation = findRootLocation(filePath)
    return windows[rootLacation]
}
const findRootLocation = (filePath) => {
    if (filePath == '/'){
        return null
    }
    const dir = path.dirname(filePath)
    const files = fs.readdirSync(dir) // ファイル一覧が取れる
    const matches = files.filter((f) => {
        return [".git", "requirements.txt", ".ipynb_checkpoints"].includes(f)
    })
    if (matches.length){
        return dir
    }
    return findRootLocation(dir) //上のディレクトリを調べる. 再帰.
}

const startLab = (appPath) => {
    const w = findWindow(appPath)
    if(w){
        openFile(w, appPath)
        return
    }
    const rootLacation = findRootLocation(appPath) ||  path.dirname(appPath) // jupyterのところまで取れる
    
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
        // nodeIntegration: true
        }
    })

    // const pyenv = fs.existsSync(path.join(process.env.HOME, ".pyenv"))
    // console.log(":::",process.env.HOME)
    // const command = pyenv ? path.join(process.env.HOME, ".pyenv", ".shims", "pipenv") : "pipenv"
    const command = path.join("/usr/local/bin/", "pipenv")
    // const command = path.join("/usr/local/Cellar/pipenv/2020.11.15/libexec/bin/", "pipenv")
    const pipfile = spawn(command, ["pipenv", "install", "JupyterLab"])
    const cp = spawn(command, ["run", "jupyter", "lab", "--no-browser"], {
        cwd: rootLacation,
    })

    const newWindow = {
        root: rootLacation,
        window,
        process: cp,
    }
    windows[rootLacation] = newWindow
    window.on('closed', () => {
        cp.kill()
        windows[rootLocation] = null
    })

    let outData = ""
    let loaded = false
    const dataListerner = (data)=>{
        if (loaded) return 
        outData += data.toString()
        const match = outData.match(/http:\/\/.*/)
        if(match){
            loaded = true
            console.log(match[0])
            window.loadURL(match[0])
            cp.stderr.off("data", dataListerner)
            const fp = appPath.substring(rootLacation.length) // 
            let url = `${match[0].split("?")[0]}/tree${fp}` // for jupyter lab.
            console.debug(url)
            setTimeout(()=>{
                window.loadURL(url)
            }, 1000) // Token認証を待つ
        }
        console.log("*****************************")
        // console.log(data.toString())
    } 
    cp.stderr.on('data', dataListerner)
}
const openFile = (window, filePath) => {
    const url = createUrl(window.url, window.root, filePath)
    window.window.loadURL(url)
    window.window.focus()
}

function createWindow () {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
        // nodeIntegration: true
        }
    })

    win.loadFile('index.html')
    
    // const appPath = '/Users/jabelic/dev/elec/jupyter/Untitled.ipynb'
    // startLab(appPath)
    
    // win.loadURL('http://localhost:8888/?token=72bdeac4a38f9ca2508d495363a8b84bf9840cae3d31ef92')
    // const root = fs.readdir Sync('.')
    // console.log(root)

    win.on('closed', ()=>{
        win = null
    })
}

// app.whenReady().then(()=>{
//     ready = true
//     if (openUrlFilePath){
//         startLab(openUrlFilePath)
//         openUrlFilePath = ""
//     }else{
//         createWindow()
//     }
// })
app.on('ready', ()=>{
    ready = true
    if (openUrlFilePath){
        startLab(openUrlFilePath)
        openUrlFilePath = ""
    }else{
        createWindow()
    }
})


app.on('open-file', (_, filePath) => {
    if (!ready) {
        openUrlFilePath = filePath
    } else {
        startLab(filePath)
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
