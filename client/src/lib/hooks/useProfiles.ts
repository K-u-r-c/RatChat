import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import agent from "../api/agent";
import type { Profile, User } from "../types";
import { toast } from "react-toastify";

export type UpdateProfileData = {
  displayName: string;
  bio?: string;
};

export type SetProfileImageData = {
  mediaUrl: string;
  publicId: string;
  imageType: "profile" | "banner";
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

  const setProfileImage = useMutation({
    mutationFn: async (data: SetProfileImageData) => {
      await agent.post("/profiles/set-profile-image", data);
    },
    onSuccess: async (_, data) => {
      queryClient.setQueryData(["user"], (user: User) => {
        if (!user) return user;
        return {
          ...user,
          ...(data.imageType === "profile"
            ? { imageUrl: data.mediaUrl }
            : { bannerUrl: data.mediaUrl }),
        };
      });
      if (data.userId) {
        queryClient.setQueryData(
          ["profiles", data.userId],
          (profile: Profile) => {
            if (!profile) return profile;
            return {
              ...profile,
              ...(data.imageType === "profile"
                ? { imageUrl: data.mediaUrl }
                : { bannerUrl: data.mediaUrl }),
            };
          }
        );
        await queryClient.invalidateQueries({
          queryKey: ["profiles", data.userId],
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
      const message =
        data.imageType === "profile"
          ? "Profile photo updated successfully"
          : "Banner updated successfully";
      toast.success(message);
    },
    onError: () => {
      toast.error("Failed to update image");
    },
  });

  return {
    profile,
    isLoadingProfile,
    updateProfile,
    setProfileImage,
  };
};
