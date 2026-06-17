import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/types/auth";

type UsersResponse = AuthUser[] | { data: AuthUser[] } | { users: AuthUser[] };

function toArray(res: UsersResponse): AuthUser[] {
  if (Array.isArray(res)) return res;
  if ("data" in res && Array.isArray(res.data)) return res.data;
  if ("users" in res && Array.isArray(res.users)) return res.users;
  return [];
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<UsersResponse>("/users"),
    select: toArray,
  });
}
