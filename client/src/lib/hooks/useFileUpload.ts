import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { useMedia, MediaCategory } from "./useMedia";
import type { MessageType } from "../types";
import type { FileUploadState, SelectedItem, UseFileUploadProps } from "../types/fileUpload";

export function useFileUpload({
  chatRoomId,
  onUpload,
  onReset,
}: UseFileUploadProps) {
  const [state, setState] = useState<FileUploadState>({
    selectedItems: [],
    pendingPaste: { file: null, preview: null },
  });

  const [isBulkUploading, setIsBulkUploading] = useState(false);

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

  const MAX_TOTAL_SIZE = 250 * 1024 * 1024; // 250MB

  const totalSelectedSize = useMemo(
    () => state.selectedItems.reduce((sum, i) => sum + i.file.size, 0),
    [state.selectedItems]
  );

  const kindOf = (file: File): SelectedItem["kind"] => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "other";
  };

  const makeId = (file: File) =>
    `${file.name}:${file.size}:${file.lastModified}`;

  const addFiles = useCallback(
    (files: File[]) => {
      if (!files || files.length === 0) return;
      let addedCount = 0;
      let skippedCount = 0;

      setState((prev) => {
        const currentSize = prev.selectedItems.reduce(
          (s, it) => s + it.file.size,
          0
        );
        const newItems: SelectedItem[] = [];

        for (const file of files) {
          const willBe =
            currentSize +
            newItems.reduce((s, it) => s + it.file.size, 0) +
            file.size;
          if (willBe > MAX_TOTAL_SIZE) {
            skippedCount++;
            continue;
          }
          const id = makeId(file);
          if (
            prev.selectedItems.some((it) => it.id === id) ||
            newItems.some((it) => it.id === id)
          ) {
            continue;
          }
          const kind = kindOf(file);
          const preview =
            kind === "image" || kind === "video"
              ? URL.createObjectURL(file)
              : null;
          newItems.push({ id, file, kind, preview });
          addedCount++;
        }

        if (skippedCount > 0) {
          toast.warn(
            `File size limit reached (250MB). Added ${addedCount}, skipped ${skippedCount}.`
          );
        }

        return { ...prev, selectedItems: [...prev.selectedItems, ...newItems] };
      });
    },
    [MAX_TOTAL_SIZE]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addFiles(acceptedFiles);
    },
    [addFiles]
  );

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
    multiple: true,
    maxFiles: 100,
    maxSize: 250 * 1024 * 1024,
    noClick: true,
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length) {
      addFiles(files);
    }
    if (event.target) event.target.value = "";
  };

  const removeSelectedItem = (id: string) => {
    setState((prev) => {
      const target = prev.selectedItems.find((it) => it.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return {
        ...prev,
        selectedItems: prev.selectedItems.filter((it) => it.id !== id),
      };
    });
  };

  const clearSelectedFiles = () => {
    setState((prev) => {
      prev.selectedItems.forEach(
        (it) => it.preview && URL.revokeObjectURL(it.preview)
      );
      return { ...prev, selectedItems: [] };
    });
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

  const uploadSelectedFiles = async (messageBody: string) => {
    if (state.selectedItems.length === 0) return;

    try {
      setIsBulkUploading(true);
      const trimmedBody = (messageBody || "").trim();

      const images = state.selectedItems.filter((i) => i.kind === "image");
      const videos = state.selectedItems.filter((i) => i.kind === "video");
      const audios = state.selectedItems.filter((i) => i.kind === "audio");
      const others = state.selectedItems.filter((i) => i.kind === "other");

      const sendOne = async (file: File, includeBody: boolean) => {
        const category = getMediaCategory(file);
        const messageType = getMessageType(file);
        const uploadResult = await uploadMedia.mutateAsync({
          file,
          category,
          ...(chatRoomId && { chatRoomId }),
        });

        const body = includeBody && trimmedBody ? trimmedBody : file.name;

        await onUpload(body, messageType, {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          mediaType: uploadResult.mediaType,
          fileSize: uploadResult.fileSize,
          originalFileName: uploadResult.originalFileName,
        });
      };

      for (let idx = 0; idx < images.length; idx++) {
        await sendOne(images[idx].file, idx === 0);
      }

      for (let idx = 0; idx < videos.length; idx++) {
        const includeBody = images.length === 0 && idx === 0;
        await sendOne(videos[idx].file, includeBody);
      }

      const includeBodyForFirstDoc = images.length === 0 && videos.length === 0;
      let bodyUsed = includeBodyForFirstDoc;
      for (let i = 0; i < audios.length; i++) {
        await sendOne(audios[i].file, !bodyUsed && i === 0);
        if (!bodyUsed && i === 0) bodyUsed = true;
      }
      for (let i = 0; i < others.length; i++) {
        await sendOne(others[i].file, !bodyUsed && i === 0);
        if (!bodyUsed && i === 0) bodyUsed = true;
      }

      clearSelectedFiles();
      onReset();
    } catch (error) {
      console.error("Files upload failed:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsBulkUploading(false);
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
    selectedItems: state.selectedItems,
    totalSelectedSize,
    pendingPaste: state.pendingPaste,
    isDragActive,
    isUploading: uploadMedia.isPending || isBulkUploading,
    dropzoneProps: getRootProps(),
    inputProps: getInputProps(),
    fileInputRef,
    handleFileSelect,
    handleFileChange,
    removeSelectedItem,
    clearSelectedFiles,
    clearPendingPaste,
    uploadSelectedFiles,
    uploadPendingPaste,
    MAX_TOTAL_SIZE,
  };
}
