import { createPurchases, getPurchases } from "@/services/purchases.services"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useCreatePurchases = () =>{
    return useMutation({
        mutationFn: createPurchases,
    })
}

export const useGetPurchases = () => {
    return useQuery({
        queryKey: ['purchases'],
        queryFn: getPurchases,
        select: (data) => data.data
    })
}