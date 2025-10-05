const detectDesktopRuntime = (): boolean => {
  if (typeof window !== "undefined") {
    if ("__RATCHAT_DESKTOP__" in window || "RatChatDesktop" in window) {
      return true;
    }
  }

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.userAgent === "string" &&
    navigator.userAgent.toLowerCase().includes("electron")
  ) {
    return true;
  }

  if (typeof process !== "undefined" && process.versions?.electron) {
    return true;
  }

  return false;
};

export const isDesktopRuntime = detectDesktopRuntime();

export type DesktopScreenSource = {
  id: string;
  name: string;
  displayId?: string | null;
  thumbnail?: string | null;
  appIcon?: string | null;
  sourceType: "screen" | "window";
};

type DesktopApi = {
  getRuntimeInfo: () => Promise<{
    platform: NodeJS.Platform;
    version: string;
    isPackaged: boolean;
  }>;
  openExternal: (
    targetUrl: string
  ) => Promise<{ success: boolean; message?: string }>;
  listScreenSources: (options?: {
    types?: Array<"screen" | "window">;
    thumbnailSize?: { width: number; height: number };
  }) => Promise<DesktopScreenSource[]>;
  prepareScreenShare: (payload: {
    sourceId: string;
    audioMode?: "none" | "system" | "application";
  }) => Promise<{ success: boolean }>;
  clearPreparedScreenShare: (payload?: { sourceId?: string }) => Promise<void>;
  openScreenRecordingPreferences?: () => Promise<void>;
};

type DesktopRuntimeScope = typeof globalThis & {
  RatChatDesktop?: DesktopApi;
};

const getDesktopRuntimeScope = (): DesktopRuntimeScope | undefined => {
  if (typeof window !== "undefined") {
    return window as DesktopRuntimeScope;
  }
  if (typeof globalThis !== "undefined") {
    return globalThis as DesktopRuntimeScope;
  }
  return undefined;
};

export const getDesktopApi = (): DesktopApi | null => {
  const scope = getDesktopRuntimeScope();
  if (!scope) {
    return null;
  }

  return scope.RatChatDesktop ?? null;
};

