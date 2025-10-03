const { contextBridge, ipcRenderer } = require("electron");

const desktopApi = {
  getRuntimeInfo: () => ipcRenderer.invoke("app:get-platform"),
  openExternal: (targetUrl) =>
    ipcRenderer.invoke("app:open-external", targetUrl),
  listScreenSources: async (options) => {
    const result = await ipcRenderer.invoke(
      "desktop:list-screen-sources",
      options
    );
    if (!result || !result.success) {
      const message = result?.message ?? "Unable to list screen sources";
      const error = new Error(message);
      if (result?.code) {
        error.code = result.code;
      }
      throw error;
    }
    return Array.isArray(result.sources) ? result.sources : [];
  },
  prepareScreenShare: async (payload) => {
    const result = await ipcRenderer.invoke(
      "desktop:prepare-screen-share",
      payload
    );
    if (!result || !result.success) {
      const message = result?.message ?? "Unable to prepare screen share";
      throw new Error(message);
    }
    return result;
  },
  clearPreparedScreenShare: async (payload) => {
    await ipcRenderer.invoke("desktop:clear-prepared-screen-share", payload);
  },
  openScreenRecordingPreferences: async () => {
    await ipcRenderer.invoke("desktop:open-screen-recording-preferences");
  },
};

try {
  contextBridge.exposeInMainWorld("RatChatDesktop", desktopApi);
} catch (error) {
  // Fallback for testing contexts without context isolation.
  window.RatChatDesktop = desktopApi;
}

typeof window !== "undefined" &&
  Object.defineProperty(window, "__RATCHAT_DESKTOP__", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });
