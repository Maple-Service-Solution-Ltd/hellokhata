
import { createQuotation, getQuotations } from "@/services/quotations.services"
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query"



export const useCreateQuotation = () => {
    const queryClient = new QueryClient();
    return useMutation({
        mutationFn: createQuotation,
        onSuccess: () => {
            // Invalidate or refetch queries related to quotations if needed
              queryClient.invalidateQueries({ queryKey: ['quotations'] });
        }
    })
}

export const useGetQuotations = (search:string) => {
    return useQuery({
        queryKey: ['quotations', search],
        queryFn: () => getQuotations(search)
    })
}   