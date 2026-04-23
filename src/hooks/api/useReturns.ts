import { getPurchaseReturns, getSalesReturns, returnSale, returnPurchase } from "@/services/returns.services"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useReturnPurchase = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: returnPurchase,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
        }
    })
}

export const useReturnSale = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: returnSale,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] })
            queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
        }
    })
}

export const useGetSalesReturns = () => {
    return useQuery({
        queryKey: ['sales-returns'],
        queryFn: getSalesReturns
    })
}

export const useGetPurchaseReturns = () => {
    return useQuery({
        queryKey: ['purchase-returns'],
        queryFn: getPurchaseReturns
    })
}