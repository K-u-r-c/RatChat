import {app, BrowserWindow, ipcMain, shell, session, nativeTheme} from 'electron';
import path from 'node:path';
import url from 'node:url';

const isDev = !app.isPackaged;
const PLATFORM = process.platform;

if (PLATFORM === 'linux') {
  app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');
}
if (isDev) {
  app.commandLine.appendSwitch('ignore-certificate-errors');
  app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
    event.preventDefault();
    callback(true);
  });
}

let mainWindow = null;

const resolveFromApp = (...segments) => {
  const appPath = app.getAppPath();
  return path.join(appPath, ...segments);
};

const createMainWindow = () => {
  const preloadPath = resolveFromApp('electron', 'preload.js');

  mainWindow = new BrowserWindow({
    title: 'RatChat Desktop',
    width: 1320,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#050608' : '#ffffff',
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      spellcheck: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools({mode: 'detach'});
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? 'https://localhost:3000';

  if (isDev) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    const indexFile = resolveFromApp('dist', 'index.html');
    const fileUrl = url.pathToFileURL(indexFile).href;
    void mainWindow.loadURL(fileUrl);
  }

  mainWindow.webContents.setWindowOpenHandler(({url: targetUrl}) => {
    if (targetUrl.startsWith('http:') || targetUrl.startsWith('https:')) {
      shell.openExternal(targetUrl).catch(() => {
        // no-op: external open failures are non-fatal
      });
    }
    return {action: 'deny'};
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsed = new URL(navigationUrl);
    const current = new URL(mainWindow?.webContents.getURL() ?? devServerUrl);
    if (parsed.origin !== current.origin) {
      event.preventDefault();
      if (navigationUrl.startsWith('http:') || navigationUrl.startsWith('https:')) {
        shell.openExternal(navigationUrl).catch(() => {
          // ignore
        });
      }
    }
  });
};

const allowedPermissions = new Set(['media', 'display-capture', 'fullscreen', 'mediaKeySystem']);

const configureSessionPermissions = () => {
  const currentSession = session.defaultSession;
  currentSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (allowedPermissions.has(permission)) {
      callback(true);
      return;
    }
    callback(false);
  });

  currentSession.setPermissionCheckHandler((_webContents, permission) => {
    if (allowedPermissions.has(permission)) {
      return true;
    }
    return false;
  });
};

app.setAppUserModelId('com.ratchat.desktop');

app.whenReady().then(() => {
  configureSessionPermissions();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      BrowserWindow.getAllWindows()[0]?.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (PLATFORM !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('app:get-platform', () => ({
  platform: PLATFORM,
  version: app.getVersion(),
  isPackaged: app.isPackaged,
}));

ipcMain.handle('app:open-external', async (_event, targetUrl) => {
  if (typeof targetUrl !== 'string') return {success: false};
  try {
    await shell.openExternal(targetUrl);
    return {success: true};
  } catch (error) {
    return {success: false, message: error instanceof Error ? error.message : String(error)};
  }
});
