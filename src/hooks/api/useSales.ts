import { createSales, getSaleById, getSales, getSalesSummary, updateSale } from "@/services/sales.services"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useCreateSales = () => {
    return useMutation({
        mutationFn: createSales
    })
}

export const useGetSales = (search: string) => {
    return useQuery({
        queryKey: ['sales', search],
        queryFn: () => getSales(search)
    })
}

export const useGetSalesSummary = () => {
    return useQuery({
        queryKey: ['sales', 'summary'],
        queryFn: getSalesSummary
    })
}

export const useGetSaleById = (id: string) => {
    return useQuery({
        queryKey: ['sales', id],
        queryFn: () => getSaleById(id),
        enabled: !!id,
    })
}

export const useUpdateSale = (id: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: any) => updateSale({ id, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] })
        }
    })
}

