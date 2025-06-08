import { useMutation } from "@tanstack/react-query";
import agent from "../api/agent";
import { toast } from "react-toastify";

export type MediaUploadResult = {
  url: string;
  publicId: string;
  mediaType: string;
  fileSize: number;
  originalFileName: string;
  category: MediaCategory;
  chatRoomId?: string;
  channelId?: string;
};

export const MediaCategory = {
  ProfileImage: "ProfileImage",
  ProfileBackground: "ProfileBackground",
  ChatRoomImage: "ChatRoomImage",
  ChatRoomVideo: "ChatRoomVideo",
  ChatRoomAudio: "ChatRoomAudio",
  ChatRoomDocument: "ChatRoomDocument",
  ChatRoomOther: "ChatRoomOther",
} as const;

export type MediaCategory = (typeof MediaCategory)[keyof typeof MediaCategory];

export const useMedia = () => {
  const uploadMedia = useMutation({
    mutationFn: async ({
      file,
      category = MediaCategory.ProfileImage,
      chatRoomId,
      channelId,
    }: {
      file: File;
      category?: MediaCategory;
      chatRoomId?: string;
      channelId?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      if (chatRoomId) formData.append("chatRoomId", chatRoomId);
      if (channelId) formData.append("channelId", channelId);

      const response = await agent.post<MediaUploadResult>(
        "/media/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onError: () => {
      toast.error("Failed to upload media");
    },
  });

  const deleteMedia = useMutation({
    mutationFn: async ({
      publicId,
      category = MediaCategory.ProfileImage,
      chatRoomId,
      channelId,
    }: {
      publicId: string;
      category?: MediaCategory;
      chatRoomId?: string;
      channelId?: string;
    }) => {
      const params = new URLSearchParams();
      params.append("category", category);
      if (chatRoomId) params.append("chatRoomId", chatRoomId);
      if (channelId) params.append("channelId", channelId);

      await agent.delete(`/media/${publicId}?${params.toString()}`);
    },
    onSuccess: () => {
      toast.success("Media deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete media");
    },
  });

  return {
    uploadMedia,
    deleteMedia,
  };
};
