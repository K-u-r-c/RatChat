export const isDesktopRuntime =
  typeof globalThis !== "undefined" && "__RATCHAT_DESKTOP__" in globalThis;

type DesktopApi = {
  getRuntimeInfo: () => Promise<{
    platform: NodeJS.Platform;
    version: string;
    isPackaged: boolean;
  }>;
  openExternal: (targetUrl: string) => Promise<{ success: boolean; message?: string }>;
};

export const getDesktopApi = (): DesktopApi | null => {
  if (!isDesktopRuntime) {
    return null;
  }

  const api = (globalThis as typeof globalThis & { RatChatDesktop?: DesktopApi })
    .RatChatDesktop;

  return api ?? null;
};
