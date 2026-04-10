import { createPurchases } from "@/services/purchases.services"
import { useMutation } from "@tanstack/react-query"

export const useCreatePurchases = () =>{
    return useMutation({
        mutationFn: createPurchases,
    })
}