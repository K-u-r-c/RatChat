import { createBrowserRouter, Navigate } from "react-router";
import App from "../layout/App";
import RequireAuth from "./RequireAuth";
import NotFound from "../../features/errors/NotFound";
import ServerError from "../../features/errors/ServerError";
import LoginForm from "../../features/account/LoginForm";
import RegisterForm from "../../features/account/RegisterForm";
import VerifyEmail from "../../features/account/VerifyEmail";
import ForgotPasswordForm from "../../features/account/ForgotPasswordForm";
import ResetPasswordForm from "../../features/account/ResetPasswordForm";
import ChangePasswordForm from "../../features/account/ChangePasswordForm";
import AuthCallback from "../../features/account/AuthCallback";
import ChatRoomDetails from "../../features/chatRooms/details/ChatRoomDetails";
import JoinChatRoomPage from "../../features/chatRooms/join/JoinChatRoomPage";
import ProfilePage from "../../features/profile/ProfilePage";
import Friends from "../../features/friends/Friends";
import AuthLayout from "../layout/AuthLayout";
import EmptyPage from "../layout/EmptyPage";
import DirectChatDetails from "../../features/directChats/DirectChatDetails";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <EmptyPage /> },
          { path: "chat-rooms/:slug", element: <ChatRoomDetails /> },
          { path: "chat-rooms/:slug/:token/join", element: <JoinChatRoomPage /> },
          { path: "profiles/:id", element: <ProfilePage /> },
          { path: "friends", element: <Friends /> },
          { path: "direct-chats/:id", element: <DirectChatDetails /> },
          { path: "change-password", element: <ChangePasswordForm /> },
        ],
      },
    ],
  },

  {
    path: "/",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginForm /> },
      { path: "register", element: <RegisterForm /> },
      { path: "confirm-email", element: <VerifyEmail /> },
      { path: "forgot-password", element: <ForgotPasswordForm /> },
      { path: "auth-callback", element: <AuthCallback /> },
      { path: "reset-password", element: <ResetPasswordForm /> },
    ],
  },

  { path: "/not-found", element: <NotFound /> },
  { path: "/server-error", element: <ServerError /> },

  { path: "*", element: <Navigate to="/not-found" replace /> },
]);

