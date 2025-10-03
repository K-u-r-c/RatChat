export {};

declare global {
  interface Window {
    RatChatDesktop?: {
      getRuntimeInfo: () => Promise<{
        platform: NodeJS.Platform;
        version: string;
        isPackaged: boolean;
      }>;
      openExternal: (targetUrl: string) => Promise<{
        success: boolean;
        message?: string;
      }>;
    };
    __RATCHAT_DESKTOP__?: true;
  }
}
