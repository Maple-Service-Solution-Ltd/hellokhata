import { createPurchases, getPurchaseById, getPurchases, updatePurchase } from "@/services/purchases.services"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useCreatePurchases = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createPurchases,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] })
        }
    })
}

export const useGetPurchases = () => {
    return useQuery({
        queryKey: ['purchases'],
        queryFn: getPurchases,
        select: (data) => data.data
    })
}

export const useGetPurchaseById = (id: string) => {
    return useQuery({
        queryKey: ['purchase', id],
        queryFn: () => getPurchaseById(id),
    })
}

export const useUpdatePurchase = (id: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: any) => updatePurchase({ id, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] })
            queryClient.invalidateQueries({ queryKey: ['purchase', id] })
        }
    })
}