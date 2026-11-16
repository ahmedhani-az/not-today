'use strict';
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const INDEX = path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname, '..'), 'dist', 'index.html');
const INDEX_URL = pathToFileURL(INDEX).href;
const external = (url) => /^(https?:|tel:)/i.test(url);
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 420, height: 860, minWidth: 360, minHeight: 640, resizable: true,
    autoHideMenuBar: true, icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.removeMenu();
  const wc = win.webContents;
  wc.setWindowOpenHandler(({ url }) => { if (external(url)) shell.openExternal(url); return { action: 'deny' }; });
  wc.on('will-navigate', (e, url) => { if (url !== INDEX_URL) { e.preventDefault(); if (external(url)) shell.openExternal(url); } });
  win.loadFile(INDEX);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
