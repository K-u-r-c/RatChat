import { Password } from "@mui/icons-material";
import {
  changePasswordSchema,
  type ChangePasswordSchema,
} from "../../lib/schemas/changePasswordSchema";
import AccountFormWrapper from "./AccountFormWrapper";
import { zodResolver } from "@hookform/resolvers/zod";
import TextInput from "../../app/shared/components/TextInput";
import { useAccount } from "../../lib/hooks/useAccount";
import { toast } from "react-toastify";
import { Box, Button, Paper, Typography } from "@mui/material";
import { Link } from "react-router";

export default function ChangePasswordForm() {
  const { changePassword, currentUser } = useAccount();

  if (currentUser && !currentUser.hasPassword) {
    return (
      <Paper
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 3,
          gap: 3,
          maxWidth: "md",
          mx: "auto",
          borderRadius: 3,
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={3}
          color="secondary.main"
        >
          <Password fontSize="large" />
          <Typography variant="h4">Change Password</Typography>
        </Box>

        <Box textAlign="center">
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Password Not Available
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            You are signed in through an external authentication provider.
            <br />
            Password changes must be managed through your authentication
            provider.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please visit your authentication provider's website to manage your
            account security.
          </Typography>
        </Box>

        <Box textAlign="center">
          <Button
            component={Link}
            to="/chat-rooms"
            variant="contained"
            color="primary"
            sx={{ textDecoration: "none" }}
          >
            Return to Chat Rooms
          </Button>
        </Box>
      </Paper>
    );
  }

  const onSubmit = async (data: ChangePasswordSchema) => {
    try {
      await changePassword.mutateAsync(data, {
        onSuccess: () => toast.success("Your password has been changed"),
      });
    } catch (error) {
      if (import.meta.env.DEV) console.log(error);
    }
  };

  return (
    <AccountFormWrapper<ChangePasswordSchema>
      title="Change password"
      icon={<Password fontSize="large" />}
      onSubmit={onSubmit}
      submitButtonText="Update password"
      resolver={zodResolver(changePasswordSchema)}
      reset={true}
    >
      <TextInput
        type="password"
        label="Current password"
        name="currentPassword"
      />
      <TextInput type="password" label="New password" name="newPassword" />
      <TextInput
        type="password"
        label="Confirm password"
        name="confirmPassword"
      />
    </AccountFormWrapper>
  );
}
