import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  type ChangePasswordSchema,
} from "../../lib/schemas/changePasswordSchema";
import { useAccount } from "../../lib/hooks/useAccount";
import PasswordInput from "../../app/shared/components/PasswordInput";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { Password } from "@mui/icons-material";

type Props = {
  highlight?: boolean;
};

export default function ChangePasswordCard({ highlight = false }: Props) {
  const { changePassword } = useAccount();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isSubmitting, isDirty },
  } = useForm<ChangePasswordSchema>({
    mode: "onTouched",
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordSchema) => {
    try {
      await changePassword.mutateAsync(data, {
        onSuccess: () => {
          toast.success("Your password has been changed");
          reset();
        },
      });
    } catch (error) {
      if (import.meta.env.DEV) console.log(error);
    }
  };

  return (
    <Card
      id="password"
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        position: "relative",
        borderRadius: 3,
        background: "rgba(19,19,22,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: highlight
          ? "0 0 0 2px rgba(99,102,241,0.4), 0 18px 40px rgba(0,0,0,0.45)"
          : "0 18px 40px rgba(0,0,0,0.35)",
        transition: "box-shadow 200ms ease, border-color 200ms ease",
      }}
    >
      <CardContent sx={{ pb: 0 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2.5}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.4))",
              color: "#D9E1FF",
            }}
          >
            <Password sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Change Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use a strong unique password to keep your account secure.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 3 }} />

        <Stack spacing={2.5}>
          <PasswordInput
            control={control}
            name="currentPassword"
            label="Current Password"
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
          <PasswordInput
            control={control}
            name="newPassword"
            label="New Password"
            placeholder="Enter your new password"
            autoComplete="new-password"
          />
          <PasswordInput
            control={control}
            name="confirmPassword"
            label="Confirm New Password"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
          />
        </Stack>
      </CardContent>

      <CardActions sx={{ px: 3, pb: 3, pt: 3, justifyContent: "flex-end" }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!isValid || isSubmitting || !isDirty}
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </Button>
      </CardActions>
    </Card>
  );
}
