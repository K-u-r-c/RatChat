import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import agent from "../api/agent";
import type { Profile, User } from "../types";
import { toast } from "react-toastify";

export type UpdateProfileData = {
  displayName: string;
  bio?: string;
};

export type SetMainPhotoData = {
  mediaUrl: string;
  publicId: string;
  userId: string;
};

export const useProfiles = (id?: string) => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profiles", id],
    queryFn: async () => {
      const response = await agent.get<Profile>(`/profiles/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      await agent.put("/profiles", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["profiles"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["user"],
      });
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const setMainPhoto = useMutation({
    mutationFn: async (data: SetMainPhotoData) => {
      await agent.post("/profiles/set-main-photo", data);
    },
    onSuccess: async (_, data) => {
      queryClient.setQueryData(["user"], (user: User) => {
        if (!user) return user;
        return {
          ...user,
          imageUrl: data.mediaUrl,
        };
      });
      if (data.userId) {
        queryClient.setQueryData(
          ["profiles", data.userId],
          (profile: Profile) => {
            if (!profile) return profile;
            return {
              ...profile,
              imageUrl: data.mediaUrl,
            };
          }
        );
        await queryClient.invalidateQueries({
          queryKey: ["profiles", data.userId],
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Profile photo updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile photo");
    },
  });

  return {
    profile,
    isLoadingProfile,
    updateProfile,
    setMainPhoto,
  };
};
