import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UsersQuery } from "@/features/users/api/users";
import { createUser, deleteUser, getUsers, inviteUsers, updateUser } from "@/features/users/api/users";

export function useUsersQuery(params: UsersQuery) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => getUsers(params),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useInviteUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteUsers,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
