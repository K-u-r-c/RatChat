import { Navigate, Outlet, useLocation } from "react-router";
import { useAccount } from "../../lib/hooks/useAccount";
import { Typography } from "@mui/material";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function RequireAuth() {
  const { currentUser, loadingUserInfo } = useAccount();
  const location = useLocation();

  useEffect(() => {
    if (
      currentUser &&
      !currentUser.hasPassword &&
      location.pathname === "/change-password"
    ) {
      toast.info(
        "Password management is handled by your external authentication provider"
      );
    }
  }, [currentUser, location.pathname]);

  if (loadingUserInfo) return <Typography>Loading...</Typography>;
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} />;

  if (
    currentUser &&
    !currentUser.hasPassword &&
    location.pathname === "/change-password"
  ) {
    return <Navigate to="/chat-rooms" replace />;
  }

  return <Outlet />;
}
