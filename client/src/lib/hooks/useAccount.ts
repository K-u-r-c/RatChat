import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router";
import {toast} from "react-toastify";
import agent from "../api/agent";
import {isDesktopRuntime} from "../environment/runtime";
import {getOAuthRedirectUrl} from "../oauth/getOAuthRedirectUrl";
import type {ChangePasswordSchema} from "../schemas/changePasswordSchema";
import type {LoginSchema} from "../schemas/loginSchema";
import type {RegisterSchema} from "../schemas/registerSchema";
import type {ResetPassword, User} from "../types";

export const useAccount = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {data: currentUser, isLoading: loadingUserInfo} = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await agent.get<User>("/account/user-info");
      return response.data;
    },
  });

  const loginUser = useMutation({
    mutationFn: async (creds: LoginSchema) => {
      await agent.post("/login?useCookies=true", creds);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
  });

  const registerUser = useMutation({
    mutationFn: async (creds: RegisterSchema) => {
      await agent.post("/account/register", creds);
    },
  });

  const logoutUser = useMutation({
    mutationFn: async () => {
      await agent.post("/account/logout");
    },
    onSuccess: () => {
      queryClient.removeQueries({queryKey: ["user"]});
      queryClient.removeQueries({queryKey: ["activities"]});
      navigate("/");
    },
  });

  const verifyEmail = useMutation({
    mutationFn: async ({userId, code}: { userId: string; code: string }) => {
      await agent.get(`/confirmEmail?userId=${userId}&code=${code}`);
    },
  });

  const resendConfirmationEmail = useMutation({
    mutationFn: async ({
                         email,
                         userId,
                       }: {
      email?: string;
      userId?: string | null;
    }) => {
      await agent.get(`/account/resendConfirmEmail`, {
        params: {
          email,
          userId,
        },
      });
    },
    onSuccess: () => {
      toast.success("Email sent - please check your email");
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: ChangePasswordSchema) => {
      await agent.post("/account/change-password", data);
    },
  });

  const forgotPassword = useMutation({
    mutationFn: async (email: string) => {
      await agent.post("/forgotPassword", {email});
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (data: ResetPassword) => {
      await agent.post("/resetPassword", data);
    },
  });

  const fetchGithubToken = useMutation({
    mutationFn: async (code: string) => {
      const params: Record<string, string> = {code};
      if (isDesktopRuntime) {
        params.redirectUri = getOAuthRedirectUrl("github");
      }

      const response = await agent.post(`/account/github-login`, undefined, {
        params,
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
  });

  const fetchGoogleToken = useMutation({
    mutationFn: async (code: string) => {
      const params: Record<string, string> = {code};
      if (isDesktopRuntime) {
        params.redirectUri = getOAuthRedirectUrl("google");
      }

      const response = await agent.post(`/account/google-login`, undefined, {
        params,
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
  });

  return {
    loginUser,
    logoutUser,
    currentUser,
    loadingUserInfo,
    registerUser,
    verifyEmail,
    resendConfirmationEmail,
    changePassword,
    forgotPassword,
    resetPassword,
    fetchGithubToken,
    fetchGoogleToken,
  };
};
