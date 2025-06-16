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
import ChatRoomsDashboard from "../../features/chatRooms/dashboard/ChatRoomsDashboard";
import ChatRoomDetails from "../../features/chatRooms/details/ChatRoomDetails";
import ChatRoomForm from "../../features/chatRooms/forms/ChatRoomForm";
import JoinChatRoomPage from "../../features/chatRooms/join/JoinChatRoomPage";
import ProfilePage from "../../features/profile/ProfilePage";
import FriendsList from "../../features/friends/FriendsList";
import AuthLayout from "../layout/AuthLayout";
import DirectChatsList from "../../features/directChats/DirectChatList";
import DirectChatDetails from "../../features/directChats/DirectChatDetails";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          { path: "", element: <ChatRoomsDashboard /> },
          { path: "chat-rooms", element: <ChatRoomsDashboard /> },
          { path: "chat-rooms/:id", element: <ChatRoomDetails /> },
          { path: "create-chat-room", element: <ChatRoomForm key="create" /> },
          { path: "chat-rooms/:id/:token/join", element: <JoinChatRoomPage /> },
          { path: "manage/:id", element: <ChatRoomForm /> },
          { path: "profiles/:id", element: <ProfilePage /> },
          { path: "friends", element: <FriendsList /> },
          { path: "direct-chats", element: <DirectChatsList /> },
          { path: "direct-chats/:id", element: <DirectChatDetails /> },
        ],
      },
      { path: "not-found", element: <NotFound /> },
      { path: "server-error", element: <ServerError /> },
      { path: "*", element: <Navigate replace to="/not-found" /> },
    ],
  },
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          { path: "change-password", element: <ChangePasswordForm /> },
        ],
      },
      { path: "login", element: <LoginForm /> },
      { path: "register", element: <RegisterForm /> },
      { path: "confirm-email", element: <VerifyEmail /> },
      { path: "forgot-password", element: <ForgotPasswordForm /> },
      { path: "reset-password", element: <ResetPasswordForm /> },
      { path: "auth-callback", element: <AuthCallback /> },
    ],
  },
]);
