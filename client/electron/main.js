import {app, BrowserWindow, desktopCapturer, ipcMain, nativeTheme, session, shell, systemPreferences,} from "electron";
import path from "node:path";

const isDev = !app.isPackaged;
const PLATFORM = process.platform;

const DESKTOP_PROTOCOL = "ratchat-desktop";
const DESKTOP_AUTH_HOST = "auth-callback";
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? "https://localhost:3000";
const PROD_APP_URL = "https://ratchat.pl";

const pendingAuthCallbacks = [];

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
      return {audio: "loopback", enableLocalEcho: false};
    }
    if (PLATFORM === "linux") {
      return {audio: "loopback", enableLocalEcho: false};
    }
    if (PLATFORM === "darwin") {
      return {audio: "loopback", enableLocalEcho: false};
    }
    return null;
  }

  if (mode === "application") {
    if (PLATFORM === "win32" || PLATFORM === "linux" || PLATFORM === "darwin") {
      return {audio: source, enableLocalEcho: false};
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

const getAppBaseUrl = () => (isDev ? DEV_SERVER_URL : PROD_APP_URL);

const buildAppUrl = (pathname, params = {}) => {
  try {
    const baseUrl = getAppBaseUrl();
    const url = new URL(pathname, baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value.length > 0) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  } catch {
    return pathname;
  }
};

const parseUrl = (rawUrl) => {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) {
    return null;
  }
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
};

const OAUTH_HOSTS = new Set(["github.com", "accounts.google.com"]);

const focusMainWindow = () => {
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
  mainWindow.focus();
};

const enqueueAuthCallbackNavigation = (url) => {
  pendingAuthCallbacks.push(url);
  if (mainWindow) {
    flushPendingAuthCallbackNavigations();
  }
};

const flushPendingAuthCallbackNavigations = () => {
  if (!mainWindow) {
    return;
  }
  while (pendingAuthCallbacks.length > 0) {
    const targetUrl = pendingAuthCallbacks.shift();
    if (typeof targetUrl === "string" && targetUrl.length > 0) {
      focusMainWindow();
      setImmediate(() => {
        void mainWindow
          ?.loadURL(targetUrl)
          .catch(() => {
            // ignore load errors; renderer can surface issues if needed
          });
      });
    }
  }
};

const handleDeepLink = (rawUrl) => {
  const parsed = parseUrl(rawUrl);
  if (!parsed) {
    return;
  }

  if (parsed.protocol !== `${DESKTOP_PROTOCOL}:`) {
    return;
  }

  if (parsed.hostname !== DESKTOP_AUTH_HOST) {
    return;
  }

  const code = parsed.searchParams.get("code");
  if (!code) {
    return;
  }
  const provider = parsed.searchParams.get("provider") ?? undefined;

  const callbackUrl = buildAppUrl("/auth-callback", {
    code,
    provider,
  });

  enqueueAuthCallbackNavigation(callbackUrl);
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
      mainWindow?.webContents.openDevTools({mode: "detach"});
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const internalOrigins = new Set();
  const registerOrigin = (candidate) => {
    const parsed = parseUrl(candidate);
    if (!parsed) return;
    internalOrigins.add(parsed.origin);
  };

  const appBaseUrl = getAppBaseUrl();

  registerOrigin(appBaseUrl);
  registerOrigin("https://localhost:3000");
  registerOrigin("http://localhost:3000");
  registerOrigin("https://localhost:5173");
  registerOrigin("http://localhost:5173");
  registerOrigin("https://ratchat.pl");

  const isInternalAppUrl = (targetUrl) => {
    const parsed = parseUrl(targetUrl);
    if (!parsed) {
      return false;
    }
    if (parsed.protocol === "about:") {
      return true;
    }
    if (internalOrigins.has(parsed.origin)) {
      return true;
    }
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === "ratchat.pl" || hostname.endsWith(".ratchat.pl")
    );
  };

  const loadInMainWindow = (targetUrl) => {
    if (!mainWindow || !isInternalAppUrl(targetUrl)) {
      return false;
    }
    const toLoad = targetUrl;
    setImmediate(() => {
      void mainWindow?.loadURL(toLoad).catch(() => {
        // Ignore load errors; renderer can recover via manual navigation.
      });
    });
    return true;
  };

  const openInSystemBrowser = (targetUrl) => {
    if (!targetUrl) {
      return false;
    }
    const parsed = parseUrl(targetUrl);
    if (!parsed) {
      return false;
    }
    const protocol = parsed.protocol?.toLowerCase();
    if (protocol === "http:" || protocol === "https:") {
      const hostname = parsed.hostname.toLowerCase();
      if (!isInternalAppUrl(targetUrl) || OAUTH_HOSTS.has(hostname)) {
        shell.openExternal(targetUrl).catch(() => {
          // no-op: external open failures are non-fatal
        });
        return true;
      }
    }
    if (protocol === "mailto:") {
      shell.openExternal(targetUrl).catch(() => {
        // ignore mail failures
      });
      return true;
    }
    return false;
  };

  const loginUrl = buildAppUrl("/login");
  void mainWindow.loadURL(loginUrl);

  mainWindow.webContents.setWindowOpenHandler(({url: targetUrl}) => {
    if (loadInMainWindow(targetUrl)) {
      return {action: "deny"};
    }
    openInSystemBrowser(targetUrl);
    return {action: "deny"};
  });

  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    if (isInternalAppUrl(navigationUrl)) {
      return;
    }
    event.preventDefault();
    openInSystemBrowser(navigationUrl);
  });

  flushPendingAuthCallbackNavigations();
};

const registerProtocolHandler = () => {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(
        DESKTOP_PROTOCOL,
        process.execPath,
        [path.resolve(process.argv[1])]
      );
    }
  } else {
    app.setAsDefaultProtocolClient(DESKTOP_PROTOCOL);
  }
};

const deepLinkArgumentFrom = (argv = []) => {
  return argv.find((arg) =>
    typeof arg === "string" && arg.startsWith(`${DESKTOP_PROTOCOL}://`)
  );
};

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

app.on("second-instance", (_event, commandLine) => {
  const deepLinkArg = deepLinkArgumentFrom(commandLine);
  if (deepLinkArg) {
    handleDeepLink(deepLinkArg);
  }
  focusMainWindow();
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

const initialDeepLink = deepLinkArgumentFrom(process.argv);
if (initialDeepLink) {
  setImmediate(() => {
    handleDeepLink(initialDeepLink);
  });
}

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
    thumbnailSize = {width: 320, height: 180},
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
      thumbnailSize: {width: 0, height: 0},
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
    return {success: false, message: "Invalid selection payload"};
  }

  const {sourceId, audioMode} = payload;
  if (typeof sourceId !== "string" || sourceId.length === 0) {
    return {success: false, message: "Missing sourceId"};
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
  return {success: true};
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
  return {success: true};
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
      callback({video: frame ?? undefined});
      return;
    }

    void desktopCapturer
      .getSources({
        types: ["screen", "window"],
        thumbnailSize: {width: 0, height: 0},
        fetchWindowIcons: false,
      })
      .then((sources) => {
        const match = sources.find((source) => source.id === prepared.sourceId);
        if (!match) {
          callback({video: frame ?? undefined});
          return;
        }

        const response = {video: match};
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
        callback({video: frame ?? undefined});
      });
  });
};

app.setAppUserModelId("com.ratchat.desktop");

app.whenReady().then(() => {
  registerProtocolHandler();
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
  if (typeof targetUrl !== "string") return {success: false};
  try {
    await shell.openExternal(targetUrl);
    return {success: true};
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
    return {success: true, sources};
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
    return {success: false};
  }

  try {
    if (typeof systemPreferences.openSystemPreferences === "function") {
      await systemPreferences.openSystemPreferences(
        "security",
        "Privacy_ScreenRecording"
      );
    }
    return {success: true};
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
