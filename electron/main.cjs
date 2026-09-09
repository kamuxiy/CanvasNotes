const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron')
const path = require('path')

const isDev = !app.isPackaged
const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:45231'

/** @type {BrowserWindow | null} */
let mainWindow = null

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#09101c',
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    title: '画布笔记',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  })

  Menu.setApplicationMenu(null)

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (isDev) {
    mainWindow.loadURL(DEV_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Packaged client: stay on local pages only
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isDev) return
    const allowed = url.startsWith('file://')
    if (!allowed) event.preventDefault()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  if (!gotLock) return
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('window:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})

ipcMain.handle('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  if (win.isMaximized()) win.unmaximize()
  else win.maximize()
})

ipcMain.handle('window:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})

ipcMain.handle('window:isMaximized', (event) => {
  return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
})
