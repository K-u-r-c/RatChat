import type { MediaUploadResult, MessageType } from "./index";

export type SelectedItem = {
  id: string;
  file: File;
  kind: "image" | "video" | "audio" | "other";
  preview?: string | null;
};

export interface FileUploadState {
  selectedItems: SelectedItem[];
  pendingPaste: {
    file: File | null;
    preview: string | null;
  };
}

export interface UseFileUploadProps {
  chatRoomId?: string;
  channelId?: string;
  onUpload: (
    body: string,
    type: MessageType,
    mediaData?: Partial<MediaUploadResult>
  ) => Promise<void>;
  onReset: () => void;
}
