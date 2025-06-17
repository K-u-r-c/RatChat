import { useForm } from "react-hook-form";
import { Password } from "@mui/icons-material";
import {
  changePasswordSchema,
  type ChangePasswordSchema,
} from "../../lib/schemas/changePasswordSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import PasswordInput from "../../app/shared/components/PasswordInput";
import { useAccount } from "../../lib/hooks/useAccount";
import { toast } from "react-toastify";
import { Box, Button, Paper, Typography } from "@mui/material";
import { Link } from "react-router";

export default function ChangePasswordForm() {
  const { changePassword } = useAccount();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isSubmitting },
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
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        px: { xs: 0, sm: 0, md: 4 },
        pt: { xs: 2, sm: 3 },
        width: "100%",
        minHeight: "90vh",
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "rgba(19, 19, 22, 0.8)",
          boxShadow: {
            xs: "20px 20px 40px rgba(30, 31, 33, 0.8)",
            sm: "40px 40px 60px rgba(30, 31, 33, 1)",
          },
          justifyContent: "center",
          width: {
            xs: "100%",
            sm: "400px",
            md: "480px",
            lg: "540px",
          },
          maxWidth: "540px",
          minHeight: {
            xs: "100%",
            sm: "600px",
            md: "690px",
          },
          gap: { xs: "16px", sm: "20px", md: "24px" },
          px: { xs: "24px", sm: "48px", md: "72px" },
          py: { xs: "32px", sm: "40px", md: "48px" },
          borderRadius: { xs: "16px 16px 0 0", sm: 3 },
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={{ xs: 1.5, sm: 2 }}
          sx={{ mb: { xs: 1, sm: 0 } }}
        >
          <Password
            sx={{
              color: "#A0A0AB",
              fontSize: { xs: "28px", sm: "32px", md: "36px" },
            }}
          />
          <Typography
            sx={{
              color: "white",
              fontSize: { xs: "24px", sm: "26px", md: "28px" },
              fontWeight: "550",
              textAlign: "center",
            }}
          >
            Change Password
          </Typography>
        </Box>

        <Box>
          <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Typography
              sx={{
                color: "#D1D1D6",
                mb: 0.5,
                ml: 0.5,
                fontSize: { xs: 14, sm: 15 },
              }}
            >
              Current Password
            </Typography>
            <PasswordInput
              placeholder="Enter your current password"
              control={control}
              name="currentPassword"
              tabIndex={1}
            />
          </Box>

          <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Typography
              sx={{
                color: "#D1D1D6",
                mb: 0.5,
                ml: 0.5,
                fontSize: { xs: 14, sm: 15 },
              }}
            >
              New Password
            </Typography>
            <PasswordInput
              placeholder="Enter your new password"
              control={control}
              name="newPassword"
              tabIndex={2}
            />
          </Box>

          <Box sx={{ mb: { xs: 1, sm: 0 } }}>
            <Typography
              sx={{
                color: "#D1D1D6",
                mb: 0.5,
                ml: 0.5,
                fontSize: { xs: 14, sm: 15 },
              }}
            >
              Confirm Password
            </Typography>
            <PasswordInput
              placeholder="Confirm your new password"
              control={control}
              name="confirmPassword"
              tabIndex={3}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 2.5 },
            mt: { xs: 1, sm: 2 },
          }}
        >
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            variant="contained"
            size="large"
            fullWidth
            sx={{
              py: { xs: 1.2, sm: 1.5 },
              textTransform: "none",
              fontWeight: "bold",
              fontSize: { xs: "14px", sm: "16px" },
              backgroundColor: !isValid || isSubmitting ? "#333" : "primary",
              color: !isValid || isSubmitting ? "#888" : "white",
              borderRadius: "8px",
              "&.Mui-disabled": {
                backgroundColor: "#333",
                color: "#888",
                opacity: 1,
              },
            }}
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={{ xs: 1, sm: 3 }}
          sx={{
            mt: { xs: 1, sm: 0 },
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Typography
            sx={{
              textAlign: "center",
              color: "#70707B",
              fontSize: { xs: "14px", sm: "16px" },
            }}
          >
            Want to go back?
          </Typography>
          <Typography
            sx={{
              color: "#A0A0AB",
              textDecoration: "none",
              fontSize: { xs: "14px", sm: "16px" },
            }}
            component={Link}
            to="/chat-rooms"
          >
            Return to Chat Rooms
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
