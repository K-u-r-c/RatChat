import { Box, Button, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import {
  useProfiles,
  type UpdateProfileData,
} from "../../lib/hooks/useProfiles";
import type { Profile } from "../../lib/types";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema } from "../../lib/schemas/profileSchema";

type Props = {
  profile: Profile;
  onCancel: () => void;
  onSuccess: () => void;
};

export default function ProfileEditForm({
  profile,
  onCancel,
  onSuccess,
}: Props) {
  const { updateProfile } = useProfiles();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty, errors },
  } = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: profile.displayName,
      bio: profile.bio || "",
    },
  });

  useEffect(() => {
    reset({
      displayName: profile.displayName,
      bio: profile.bio || "",
    });
  }, [profile, reset]);

  const onSubmit = async (data: UpdateProfileData) => {
    await updateProfile.mutateAsync(data, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        {...register("displayName")}
        label="Display Name"
        fullWidth
        margin="normal"
        variant="outlined"
        error={!!errors.displayName}
        helperText={errors.displayName?.message}
      />

      <TextField
        {...register("bio")}
        label="Bio"
        fullWidth
        multiline
        rows={4}
        margin="normal"
        variant="outlined"
        placeholder="Tell us about yourself..."
        error={!!errors.bio}
        helperText={errors.bio?.message}
      />

      <Box display="flex" justifyContent="end" gap={2} mt={3}>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || !isDirty}
        >
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}
