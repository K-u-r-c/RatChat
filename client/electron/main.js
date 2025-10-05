import {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  nativeTheme,
  session,
  shell,
  systemPreferences,
} from "electron";
import path from "node:path";

const isDev = !app.isPackaged;
const PLATFORM = process.platform;

const unsupportedAudioWarnings = new Set();

const warnUnsupportedAudio = (key, message) => {
  if (unsupportedAudioWarnings.has(key)) {
    return;
  }
  unsupportedAudioWarnings.add(key);
  console.warn(message);
};

const buildAudioResponseForSelection = (mode, source) => {
  if (mode === "system") {
    if (PLATFORM === "win32") {
      // Use loopback so system audio capture does not mute the microphone stream.
      return { audio: "loopback", enableLocalEcho: false };
    }
    if (PLATFORM === "linux") {
      return { audio: "loopback", enableLocalEcho: false };
    }
    if (PLATFORM === "darwin") {
      return { audio: "loopback", enableLocalEcho: false };
    }
    return null;
  }

  if (mode === "application") {
    if (PLATFORM === "win32" || PLATFORM === "linux" || PLATFORM === "darwin") {
      return { audio: source, enableLocalEcho: false };
    }
    return null;
  }

  return null;
};


if (PLATFORM === "linux") {
  app.commandLine.appendSwitch("enable-features", "WebRTCPipeWireCapturer");
}
if (isDev) {
  app.commandLine.appendSwitch("ignore-certificate-errors");
  app.on(
    "certificate-error",
    (event, _webContents, _url, _error, _certificate, callback) => {
      event.preventDefault();
      callback(true);
    }
  );
}

let mainWindow = null;

const resolveFromApp = (...segments) => {
  const appPath = app.getAppPath();
  return path.join(appPath, ...segments);
};

const createMainWindow = () => {
  const preloadPath = resolveFromApp("electron", "preload.js");

  mainWindow = new BrowserWindow({
    title: "RatChat Desktop",
    width: 1320,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#050608" : "#ffffff",
    show: false,
    webPreferences: {
      preload: preloadPath, // replaced __dirname usage
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      spellcheck: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: "detach" });
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const devServerUrl =
    process.env.VITE_DEV_SERVER_URL ?? "https://localhost:3000";

  if (isDev) {
    void mainWindow.loadURL(`${devServerUrl}/login`);
  } else {
    // Instead of loading local dist file, point to hosted SPA so origin matches API
    void mainWindow.loadURL("https://ratchat.pl/login");
  }

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith("http:") || targetUrl.startsWith("https:")) {
      shell.openExternal(targetUrl).catch(() => {
        // no-op: external open failures are non-fatal
      });
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsed = new URL(navigationUrl);
    const current = new URL(mainWindow?.webContents.getURL() ?? devServerUrl);
    if (parsed.origin !== current.origin) {
      event.preventDefault();
      if (
        navigationUrl.startsWith("http:") ||
        navigationUrl.startsWith("https:")
      ) {
        shell.openExternal(navigationUrl).catch(() => {
          // ignore
        });
      }
    }
  });
};

const allowedPermissions = new Set([
  "media",
  "display-capture",
  "fullscreen",
  "mediaKeySystem",
]);

const pendingScreenShareSelections = new Map();
let lastPreparedScreenShareSelection = null;

const listScreenSources = async (options = {}) => {
  const {
    types = ["screen", "window"],
    thumbnailSize = { width: 320, height: 180 },
    fetchWindowIcons = true,
  } = options;

  if (!Array.isArray(types) || types.length === 0) {
    return [];
  }

  const loadSources = async (overrides = {}) => {
    return desktopCapturer.getSources({
      types,
      thumbnailSize,
      fetchWindowIcons,
      ...overrides,
    });
  };

  let sources = await loadSources();

  if (sources.length === 0) {
    sources = await loadSources({
      thumbnailSize: { width: 0, height: 0 },
      fetchWindowIcons: false,
    });
  }

  if (sources.length === 0 && process.platform === "darwin") {
    const status = systemPreferences?.getMediaAccessStatus?.("screen");
    if (status !== "granted") {
      const error = new Error(
        "RatChat Desktop is blocked from recording the screen. Enable Screen Recording for the app in System Settings > Privacy & Security > Screen Recording."
      );
      error.code = "SCREEN_PERMISSION_DENIED";
      throw error;
    }
  }
  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    displayId: source.display_id,
    thumbnail: source.thumbnail?.toDataURL?.() ?? null,
    appIcon: source.appIcon?.toDataURL?.() ?? null,
    sourceType: source.id.startsWith("screen:") ? "screen" : "window",
  }));
};

const prepareScreenShareSelection = (webContentsId, payload) => {
  if (!payload || typeof payload !== "object") {
    return { success: false, message: "Invalid selection payload" };
  }

  const { sourceId, audioMode } = payload;
  if (typeof sourceId !== "string" || sourceId.length === 0) {
    return { success: false, message: "Missing sourceId" };
  }

  let normalizedAudio = "none";
  if (audioMode === "system") {
    normalizedAudio = "system";
  } else if (audioMode === "application") {
    normalizedAudio = "application";
  }
  const selection = {
    sourceId,
    audioMode: normalizedAudio,
    ownerId: webContentsId,
  };
  pendingScreenShareSelections.set(webContentsId, selection);
  lastPreparedScreenShareSelection = selection;
  return { success: true };
};

const clearPreparedScreenShareSelection = (
  webContentsId,
  matchSourceId = null
) => {
  const stored = pendingScreenShareSelections.get(webContentsId);
  if (stored) {
    if (!matchSourceId || stored.sourceId === matchSourceId) {
      pendingScreenShareSelections.delete(webContentsId);
    }
  }

  if (lastPreparedScreenShareSelection) {
    const matchesOwner =
      lastPreparedScreenShareSelection.ownerId === webContentsId;
    const matchesSource =
      !matchSourceId ||
      lastPreparedScreenShareSelection.sourceId === matchSourceId;
    if (matchesOwner && matchesSource) {
      lastPreparedScreenShareSelection = null;
    }
  }
  return { success: true };
};

const consumePreparedScreenShareSelection = (webContentsId) => {
  if (typeof webContentsId === "number") {
    const existing = pendingScreenShareSelections.get(webContentsId);
    if (existing) {
      pendingScreenShareSelections.delete(webContentsId);
      if (lastPreparedScreenShareSelection?.ownerId === webContentsId) {
        lastPreparedScreenShareSelection = null;
      }
      return existing;
    }
  }

  if (lastPreparedScreenShareSelection) {
    const fallback = lastPreparedScreenShareSelection;
    pendingScreenShareSelections.delete(fallback.ownerId);
    lastPreparedScreenShareSelection = null;
    return fallback;
  }

  return null;
};

const configureSessionPermissions = () => {
  const currentSession = session.defaultSession;
  currentSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      if (allowedPermissions.has(permission)) {
        callback(true);
        return;
      }
      callback(false);
    }
  );

  currentSession.setPermissionCheckHandler((_webContents, permission) => {
    if (allowedPermissions.has(permission)) {
      return true;
    }
    return false;
  });
};

const configureDisplayMediaHandling = () => {
  const currentSession = session.defaultSession;

  currentSession.setDisplayMediaRequestHandler((request, callback) => {
    const frame = request.frame;
    const webContents = frame?.webContents ?? null;
    const prepared = consumePreparedScreenShareSelection(
      webContents?.id ?? null
    );
    if (!prepared) {
      callback({ video: frame ?? undefined });
      return;
    }

    void desktopCapturer
      .getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 0, height: 0 },
        fetchWindowIcons: false,
      })
      .then((sources) => {
        const match = sources.find((source) => source.id === prepared.sourceId);
        if (!match) {
          callback({ video: frame ?? undefined });
          return;
        }

        const response = { video: match };
        if (request.audioRequested && prepared.audioMode && prepared.audioMode !== "none") {
          const isScreenSource = typeof match.id === "string" && match.id.startsWith("screen:");
          if (prepared.audioMode === "system" && !isScreenSource) {
            warnUnsupportedAudio(
              `system-${PLATFORM}`,
              "System audio capture requires sharing an entire screen; falling back to window audio."
            );
            const fallbackResponse = buildAudioResponseForSelection("application", match);
            if (fallbackResponse?.audio) {
              response.audio = fallbackResponse.audio;
              if (typeof fallbackResponse.enableLocalEcho === "boolean") {
                response.enableLocalEcho = fallbackResponse.enableLocalEcho;
              }
            }
          } else {
            const audioResponse = buildAudioResponseForSelection(prepared.audioMode, match);
            if (audioResponse?.audio) {
              response.audio = audioResponse.audio;
              if (typeof audioResponse.enableLocalEcho === "boolean") {
                response.enableLocalEcho = audioResponse.enableLocalEcho;
              }
            } else {
              warnUnsupportedAudio(
                `${prepared.audioMode}-${PLATFORM}`,
                `Screen share audio mode "${prepared.audioMode}" is not supported on ${PLATFORM}.`
              );
            }
          }
        }

        callback(response);
      })
      .catch(() => {
        callback({ video: frame ?? undefined });
      });
  });
};

app.setAppUserModelId("com.ratchat.desktop");

app.whenReady().then(() => {
  configureSessionPermissions();
  configureDisplayMediaHandling();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      BrowserWindow.getAllWindows()[0]?.focus();
    }
  });
});

app.on("window-all-closed", () => {
  if (PLATFORM !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("app:get-platform", () => ({
  platform: PLATFORM,
  version: app.getVersion(),
  isPackaged: app.isPackaged,
}));

ipcMain.handle("app:open-external", async (_event, targetUrl) => {
  if (typeof targetUrl !== "string") return { success: false };
  try {
    await shell.openExternal(targetUrl);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("desktop:list-screen-sources", async () => {
  try {
    const sources = await listScreenSources();
    return { success: true, sources };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code =
      error && typeof error === "object" && "code" in error
        ? error.code
        : undefined;
    return {
      success: false,
      message,
      code,
    };
  }
});

ipcMain.handle("desktop:prepare-screen-share", (event, payload) => {
  return prepareScreenShareSelection(event.sender.id, payload);
});

ipcMain.handle("desktop:clear-prepared-screen-share", (event, payload) => {
  const sourceId =
    payload &&
    typeof payload === "object" &&
    typeof payload.sourceId === "string"
      ? payload.sourceId
      : null;
  return clearPreparedScreenShareSelection(event.sender.id, sourceId);
});
ipcMain.handle("desktop:open-screen-recording-preferences", async () => {
  if (process.platform !== "darwin") {
    return { success: false };
  }

  try {
    if (typeof systemPreferences.openSystemPreferences === "function") {
      await systemPreferences.openSystemPreferences(
        "security",
        "Privacy_ScreenRecording"
      );
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
});

app.on("web-contents-created", (_event, contents) => {
  contents.on("destroyed", () => {
    pendingScreenShareSelections.delete(contents.id);
    if (lastPreparedScreenShareSelection?.ownerId === contents.id) {
      lastPreparedScreenShareSelection = null;
    }
  });
});
