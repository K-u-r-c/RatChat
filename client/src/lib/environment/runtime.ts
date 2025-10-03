export const isDesktopRuntime =
  typeof globalThis !== "undefined" && "__RATCHAT_DESKTOP__" in globalThis;

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
    audioMode?: "none" | "system";
  }) => Promise<{ success: boolean }>;
  clearPreparedScreenShare: (payload?: { sourceId?: string }) => Promise<void>;
};

export const getDesktopApi = (): DesktopApi | null => {
  if (!isDesktopRuntime) {
    return null;
  }

  const api = (globalThis as typeof globalThis & { RatChatDesktop?: DesktopApi })
    .RatChatDesktop;

  return api ?? null;
};
