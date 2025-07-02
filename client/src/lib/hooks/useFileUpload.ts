import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { useMedia, MediaCategory } from "./useMedia";
import type { MediaUploadResult, MessageType } from "../types";

interface FileUploadState {
  selectedFile: File | null;
  mediaPreview: string | null;
  pendingPaste: {
    file: File | null;
    preview: string | null;
  };
}

interface UseFileUploadProps {
  chatRoomId?: string;
  onUpload: (
    body: string,
    type: MessageType,
    mediaData?: Partial<MediaUploadResult>
  ) => Promise<void>;
  onReset: () => void;
}

export function useFileUpload({
  chatRoomId,
  onUpload,
  onReset,
}: UseFileUploadProps) {
  const [state, setState] = useState<FileUploadState>({
    selectedFile: null,
    mediaPreview: null,
    pendingPaste: { file: null, preview: null },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMedia } = useMedia();

  const getMediaCategory = (file: File): MediaCategory => {
    if (file.type.startsWith("image/")) return MediaCategory.ChatRoomImage;
    if (file.type.startsWith("video/")) return MediaCategory.ChatRoomVideo;
    if (file.type.startsWith("audio/")) return MediaCategory.ChatRoomAudio;

    const extension = file.name.toLowerCase().split(".").pop() || "";
    const codeExtensions = [
      "js",
      "ts",
      "tsx",
      "jsx",
      "py",
      "java",
      "cs",
      "cpp",
      "c",
      "h",
      "hpp",
      "php",
      "rb",
      "go",
      "rs",
      "swift",
      "kt",
      "scala",
      "yml",
      "yaml",
      "json",
      "xml",
      "html",
      "css",
      "md",
      "txt",
      "sql",
      "sh",
      "bat",
      "ps1",
      "dockerfile",
    ];

    const archiveExtensions = ["zip", "rar", "7z", "gz", "tar", "bz2"];

    if (
      file.type.includes("pdf") ||
      file.type.includes("document") ||
      file.type.includes("text") ||
      codeExtensions.includes(extension)
    ) {
      return MediaCategory.ChatRoomDocument;
    }

    if (archiveExtensions.includes(extension)) {
      return MediaCategory.ChatRoomOther;
    }

    return MediaCategory.ChatRoomDocument;
  };

  const getMessageType = (file: File): MessageType => {
    if (file.type.startsWith("image/")) return "Image";
    if (file.type.startsWith("video/")) return "Video";
    if (file.type.startsWith("audio/")) return "Audio";
    return "Document";
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setState((prev) => ({
        ...prev,
        selectedFile: file,
        mediaPreview: URL.createObjectURL(file),
      }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [
        ".jpeg",
        ".jpg",
        ".png",
        ".gif",
        ".webp",
        ".bmp",
        ".tiff",
        ".svg",
      ],
      "video/*": [".mp4", ".avi", ".mov", ".wmv", ".webm", ".ogv", ".mkv"],
      "audio/*": [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".weba"],
      "application/*": [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".zip",
        ".rar",
        ".7z",
        ".gz",
        ".tar",
        ".json",
        ".xml",
      ],
      "text/*": [
        ".txt",
        ".csv",
        ".rtf",
        ".md",
        ".html",
        ".css",
        ".js",
        ".ts",
        ".py",
        ".java",
        ".cs",
        ".cpp",
        ".c",
        ".h",
        ".php",
        ".rb",
        ".go",
        ".rs",
        ".swift",
        ".kt",
        ".scala",
        ".yml",
        ".yaml",
        ".sql",
        ".sh",
        ".bat",
        ".ps1",
      ],
    },
    maxFiles: 1,
    maxSize: 200 * 1024 * 1024,
    noClick: true,
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setState((prev) => ({
        ...prev,
        selectedFile: file,
        mediaPreview: URL.createObjectURL(file),
      }));
    }
  };

  const clearSelectedFile = () => {
    if (state.mediaPreview) {
      URL.revokeObjectURL(state.mediaPreview);
    }
    setState((prev) => ({
      ...prev,
      selectedFile: null,
      mediaPreview: null,
    }));
  };

  const clearPendingPaste = () => {
    if (state.pendingPaste.preview) {
      URL.revokeObjectURL(state.pendingPaste.preview);
    }
    setState((prev) => ({
      ...prev,
      pendingPaste: { file: null, preview: null },
    }));
  };

  const uploadSelectedFile = async (messageBody: string) => {
    const { selectedFile } = state;
    if (!selectedFile) return;

    try {
      const category = getMediaCategory(selectedFile);
      const messageType = getMessageType(selectedFile);

      const uploadResult = await uploadMedia.mutateAsync({
        file: selectedFile,
        category,
        ...(chatRoomId && { chatRoomId }),
      });

      const body = messageBody.trim() || selectedFile.name;

      await onUpload(body, messageType, {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        mediaType: uploadResult.mediaType,
        fileSize: uploadResult.fileSize,
        originalFileName: uploadResult.originalFileName,
      });

      clearSelectedFile();
      onReset();
    } catch (error) {
      console.error("File upload failed:", error);
      toast.error("Failed to upload file");
    }
  };

  const uploadPendingPaste = async (messageBody: string) => {
    const { file } = state.pendingPaste;
    if (!file) return;

    try {
      const category = getMediaCategory(file);
      const messageType = getMessageType(file);

      const uploadResult = await uploadMedia.mutateAsync({
        file,
        category,
        ...(chatRoomId && { chatRoomId }),
      });

      const body = messageBody.trim() || file.name || "Pasted file";

      await onUpload(body, messageType, {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        mediaType: uploadResult.mediaType,
        fileSize: uploadResult.fileSize,
        originalFileName: uploadResult.originalFileName,
      });

      clearPendingPaste();
      onReset();
    } catch (error) {
      console.error("Paste upload failed:", error);
      toast.error("Failed to upload pasted file");
      clearPendingPaste();
    }
  };

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.indexOf("image") !== -1) {
          event.preventDefault();
          const file = item.getAsFile();

          if (file) {
            const previewUrl = URL.createObjectURL(file);
            setState((prev) => ({
              ...prev,
              pendingPaste: { file, preview: previewUrl },
            }));
          }
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  return {
    selectedFile: state.selectedFile,
    mediaPreview: state.mediaPreview,
    pendingPaste: state.pendingPaste,
    isDragActive,
    isUploading: uploadMedia.isPending,
    dropzoneProps: getRootProps(),
    inputProps: getInputProps(),
    fileInputRef,
    handleFileSelect,
    handleFileChange,
    clearSelectedFile,
    clearPendingPaste,
    uploadSelectedFile,
    uploadPendingPaste,
  };
}
