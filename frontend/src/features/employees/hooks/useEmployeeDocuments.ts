import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEmployeeDocument, deleteEmployeeDocument, getEmployeeDocuments } from "@/features/employees/api/documents";

export const useEmployeeDocumentsQuery = (employeeId?: string) =>
  useQuery({
    queryKey: ["employee-documents", employeeId],
    queryFn: () => getEmployeeDocuments(employeeId ? { employee: employeeId } : {}),
    enabled: Boolean(employeeId),
  });

export const useCreateEmployeeDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployeeDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-documents"] }),
  });
};

export const useDeleteEmployeeDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployeeDocument(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-documents"] }),
  });
};
