import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiFetch } from "@/lib/api";
import type { AuthUser } from "@/lib/types/auth";

type UsersResponse = AuthUser[] | { data: AuthUser[] } | { users: AuthUser[] };

function toArray(res: UsersResponse): AuthUser[] {
  if (Array.isArray(res)) return res;
  if ("data" in res && Array.isArray(res.data)) return res.data;
  if ("users" in res && Array.isArray(res.users)) return res.users;
  return [];
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      avatarFile,
    }: {
      payload: Record<string, unknown>;
      avatarFile?: File;
    }) => {
      const formData = new FormData();
      formData.append("metadata", JSON.stringify(payload));
      if (avatarFile) formData.append("avatarFile", avatarFile);
      return apiFetch<{ message: string }>("/editProfile", { method: "PUT", body: formData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loginData"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<void>(`/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<UsersResponse>("/users"),
    select: toArray,
  });
}

export function useUser(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => api.get<AuthUser>(`/users/${userId}`),
    enabled: !!userId,
  });
}
