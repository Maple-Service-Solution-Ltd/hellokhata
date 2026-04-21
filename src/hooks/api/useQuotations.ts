
import { createQuotation, deleteQuotation, getQuotations, getQuotationSummary } from "@/services/quotations.services"
import {  useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useGetQuotations = (search:string) => {
    return useQuery({
        queryKey: ['quotations', search],
        queryFn: () => getQuotations(search),
    })
}   

export const useGetQoutationSummary = () => {
    return useQuery({
        queryKey: [ 'qoutationSummary'],
        queryFn: getQuotationSummary
    })
}

export const useCreateQuotation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createQuotation,
        onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['quotations'] });
              queryClient.invalidateQueries({ queryKey: ['qoutationSummary'] });
        }
    })
}

export const useDeleteQuotation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteQuotation,
        onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['quotations'] });
                queryClient.invalidateQueries({ queryKey: ['qoutationSummary'] });
        }
    })
}