import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { RegisterRequest } from "@/lib/types/auth";

export function useLogin() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: ({ emailOrMobile, password }: { emailOrMobile: string; password: string }) =>
      login(emailOrMobile, password),
    onError: (error) => {
      console.error("[login] error:", error);
    },
  });
}

export function useRegister() {
  const { register } = useAuth();
  return useMutation({
    mutationFn: ({ data, avatarFile }: { data: RegisterRequest; avatarFile?: File }) =>
      register(data, avatarFile),
    onError: (error) => {
      console.error("[register] error:", error);
    },
  });
}

export function useForgotPassword() {
  const { forgotPassword } = useAuth();
  return useMutation({
    mutationFn: ({ email }: { email: string }) => forgotPassword(email),
    onError: (error) => {
      console.error("[forgotPassword] error:", error);
    },
  });
}

export function useResetPassword() {
  const { resetPassword } = useAuth();
  return useMutation({
    mutationFn: ({ token, newPassword, accessToken }: { token: string; newPassword: string; accessToken?: string }) =>
      resetPassword(token, newPassword, accessToken),
    onError: (error) => {
      console.error("[resetPassword] error:", error);
    },
  });
}
