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
      userId,
      payload,
      avatarFile,
    }: {
      userId: string;
      payload: Record<string, unknown>;
      avatarFile?: File;
    }) => {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("metadata", JSON.stringify(payload));
        formData.append("avatarFile", avatarFile);
        return apiFetch<AuthUser>(`/users/${userId}`, { method: "PUT", body: formData });
      }
      return apiFetch<AuthUser>(`/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
