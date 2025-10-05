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
      listScreenSources: (
        options?: {
          types?: Array<'screen' | 'window'>;
          thumbnailSize?: { width: number; height: number };
        }
      ) => Promise<
        Array<{
          id: string;
          name: string;
          displayId?: string | null;
          thumbnail?: string | null;
          appIcon?: string | null;
          sourceType: 'screen' | 'window';
        }>
      >;
      prepareScreenShare: (payload: {
        sourceId: string;
        audioMode?: 'none' | 'system' | 'application';
      }) => Promise<{ success: boolean }>;
      clearPreparedScreenShare: (
        payload?: { sourceId?: string }
      ) => Promise<void>;
      openScreenRecordingPreferences?: () => Promise<void>;

    };
    __RATCHAT_DESKTOP__?: true;
  }
}
