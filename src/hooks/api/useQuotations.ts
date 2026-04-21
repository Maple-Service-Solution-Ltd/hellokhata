
import { createQuotation, deleteQuotation, getQuotations, getQuotationSummary } from "@/services/quotations.services"
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"



export const useCreateQuotation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createQuotation,
        onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['quotations','summary'] });
        }
    })
}

export const useGetQuotations = (search:string) => {
    return useQuery({
        queryKey: ['quotations', search],
        queryFn: () => getQuotations(search),
    })
}   


export const useGetQoutationSummary = () => {
    return useQuery({
        queryKey: ['quotations', 'summary'],
        queryFn: getQuotationSummary
    })
}


export const useDeleteQuotation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteQuotation,
        onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['quotations', 'summary'] });
        }
    })
}