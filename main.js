/* Copyright 2019 pluswing Inc. */

const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const { spawn } = require('child_process');
const path = require('path')
let win = null // main window
let ready = false
let openUrlFilePath= ""

let windows = {}

const findWindow = (filePath) => {
    const rootLocation = findRootLocation(filePath)
    return windows[rootLocation]
}
const findRootLocation = (filePath) => {
    return _findRootLocation(filePath) || path.dirname(filePath)
}
const _findRootLocation = (filePath) => {
    if (filePath == '/'){
        return null
    }
    const dir = path.dirname(filePath)
    const files = fs.readdirSync(dir) // ファイル一覧が取れる
    const matches = files.filter((f) => {
        return ["Pipfile", "requirements.txt"].includes(f)
    })
    if (matches.length){
        return dir
    }
    return _findRootLocation(dir) // 上のディレクトリを調べる.
}

const startLab = (appPath) => {
    const w = findWindow(appPath)
    let loaded = false
    if(w){
        openFile(w, appPath)
    }
    const rootLocation = findRootLocation(appPath)// jupyterのところまで取れる
    
    const window = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
        }
    })

    // const command = pyenv ? path.join(process.env.HOME, ".pyenv", ".shims", "pipenv") : "pipenv"
    const command = path.join("/usr/local/bin/", "pipenv")
    const pipfile = spawn(command, ["install", "JupyterLab"], {
        cwd: rootLocation,
    })
    const cp = spawn(command, ["run", "jupyter", "lab", "--no-browser"], {
        cwd: rootLocation,
    })

    const newWindow = {
        root: rootLocation,
        window,
        process: cp,
    }
    windows[rootLocation] = newWindow
    window.on('closed', () => {
        cp.kill()
        windows[rootLocation] = null
    })

    let outData = ""
    const dataListerner = (data)=>{
        outData += data.toString()
        const match = outData.match(/http:\/\/.*/)
        if(match && loaded == false){
            loaded = true
            console.log(match[0])
            window.loadURL(match[0])
            cp.stderr.off("data", dataListerner)
            const fp = appPath.substring(rootLocation.length) // 
            let url = `${match[0].split("?")[0]}/tree${fp}` // for jupyter lab.
            console.debug(url)
            // setTimeout(()=>{
            //     window.loadURL(url)
            // }, 3000) // Token認証を待つ
        }
    } 
    cp.stderr.on('data', dataListerner)
}

const openFile = (window, filePath) => {
    const url = createUrl(window.url, window.root, filePath)
    window.window.loadURL(url)
    window.window.focus()
}
const createUrl = (url, root, filePath) => {
    return `${url}/tree${filePath.substring(root.length)}`
}

function createWindow () {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
        }
    })

    win.loadFile('index.html')
    
    startLab(appPath)
    
    // win.loadURL('http://localhost:8888/?token=72bdeac4a38f9ca2508d495363a8b84bf9840cae3d31ef92')
    // const root = fs.readdir Sync('.')
    // console.log(root)

    win.on('closed', ()=>{
        win = null
    })
}

app.whenReady().then(()=>{
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
