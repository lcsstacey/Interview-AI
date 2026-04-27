/* eslint-disable */
const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = !app.isPackaged;
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

let mainWindow = null;
let httpServer = null;

async function bootServer() {
  // Load the ESM server bundle dynamically from CommonJS.
  const { startServer } = await import(path.join(ROOT, 'server', 'start.js'));
  const userDataPath = path.join(app.getPath('userData'), 'interview-studio-ai');
  fs.mkdirSync(userDataPath, { recursive: true });

  httpServer = await startServer({
    port: 0, // ephemeral
    userDataPath,
    distPath: DIST
  });
  return httpServer.address().port;
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#070a18',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Open external links in the user's default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev && process.env.VITE_DEV_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  }
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ]
      : []),
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Interview Studio AI',
          click: () =>
            dialog.showMessageBox({
              type: 'info',
              title: 'Interview Studio AI',
              message: 'Interview Studio AI',
              detail:
                'A premium mock-interview practice studio.\n\nFor practice and preparation only — not for live undisclosed interview assistance.'
            })
        },
        { type: 'separator' },
        {
          label: 'Open Source on GitHub',
          click: () => shell.openExternal('https://github.com/lcsstacey/interview-ai')
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  buildMenu();
  try {
    const port = await bootServer();
    createWindow(port);
  } catch (err) {
    dialog.showErrorBox('Interview Studio AI', `Failed to start server:\n\n${err.message}`);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && httpServer) {
      createWindow(httpServer.address().port);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  try { httpServer?.close(); } catch {}
});
