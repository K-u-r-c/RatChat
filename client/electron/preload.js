import {contextBridge, ipcRenderer} from 'electron';

const desktopApi = {
  getRuntimeInfo: () => ipcRenderer.invoke('app:get-platform'),
  openExternal: (targetUrl) => ipcRenderer.invoke('app:open-external', targetUrl),
};

try {
  contextBridge.exposeInMainWorld('RatChatDesktop', desktopApi);
} catch (error) {
  // Fallback for testing contexts without context isolation.
  window.RatChatDesktop = desktopApi;
}

typeof window !== 'undefined' && Object.defineProperty(window, '__RATCHAT_DESKTOP__', {
  value: true,
  configurable: false,
  enumerable: false,
  writable: false,
});
