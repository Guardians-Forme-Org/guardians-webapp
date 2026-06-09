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
    mutationFn: (data: RegisterRequest) => register(data),
    onError: (error) => {
      console.error("[register] error:", error);
    },
  });
}
