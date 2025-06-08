import { createBrowserRouter, Navigate } from "react-router";
import App from "../layout/App";
import HomePage from "../../features/home/HomePage";
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
import ChatRoomsDashboard from "../../features/chatRooms/dashboard/ChatRoomsDashboard";
import ChatRoomDetails from "../../features/chatRooms/details/ChatRoomDetails";
import ChatRoomForm from "../../features/chatRooms/forms/ChatRoomForm";
import JoinChatRoomPage from "../../features/chatRooms/join/JoinChatRoomPage";
import ProfilePage from "../../features/profile/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          { path: "chat-rooms", element: <ChatRoomsDashboard /> },
          { path: "chat-rooms/:id", element: <ChatRoomDetails /> },
          { path: "create-chat-room", element: <ChatRoomForm key="create" /> },
          { path: "chat-rooms/:id/:token/join", element: <JoinChatRoomPage /> },
          { path: "manage/:id", element: <ChatRoomForm /> },
          { path: "change-password", element: <ChangePasswordForm /> },
          { path: "profiles/:id", element: <ProfilePage /> },
        ],
      },
      { path: "", element: <HomePage /> },
      { path: "not-found", element: <NotFound /> },
      { path: "server-error", element: <ServerError /> },
      { path: "login", element: <LoginForm /> },
      { path: "register", element: <RegisterForm /> },
      { path: "confirm-email", element: <VerifyEmail /> },
      { path: "forgot-password", element: <ForgotPasswordForm /> },
      { path: "reset-password", element: <ResetPasswordForm /> },
      { path: "auth-callback", element: <AuthCallback /> },
      { path: "*", element: <Navigate replace to="/not-found" /> },
    ],
  },
]);
