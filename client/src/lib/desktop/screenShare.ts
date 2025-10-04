import type { ScreenShareAudioMode } from "../types/voiceChannel";
import { getDesktopApi } from "../environment/runtime";
import type { DesktopScreenSource } from "../environment/runtime";

const DEFAULT_THUMBNAIL_SIZE = { width: 320, height: 180 } as const;

export const fetchDesktopScreenSources = async (): Promise<DesktopScreenSource[]> => {
  const api = getDesktopApi();
  if (!api?.listScreenSources) {
    return [];
  }

  try {
    return await api.listScreenSources({
      types: ["screen", "window"],
      thumbnailSize: { ...DEFAULT_THUMBNAIL_SIZE },
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to load desktop screen sources", error);
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
};

export const prepareDesktopScreenShare = async (
  sourceId: string | null,
  audioMode: ScreenShareAudioMode | undefined
): Promise<boolean> => {
  const api = getDesktopApi();
  if (!api) {
    return true;
  }

  if (!api.prepareScreenShare) {
    return false;
  }

  if (!sourceId) {
    return true;
  }

  try {
    const normalizedAudio = audioMode === "system" ? "system" : "none";
    await api.prepareScreenShare({ sourceId, audioMode: normalizedAudio });
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to prepare desktop screen share", error);
    }
    return false;
  }
};

export const clearDesktopScreenSharePreparation = async (
  sourceId?: string | null
): Promise<void> => {
  const api = getDesktopApi();
  if (!api || !api.clearPreparedScreenShare) {
    return;
  }

  try {
    await api.clearPreparedScreenShare(sourceId ? { sourceId } : undefined);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to clear desktop screen share preparation", error);
    }
  }
};
