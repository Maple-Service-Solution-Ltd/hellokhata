import { createSales, getSales, getSalesSummary } from "@/services/sales.services"
import { useMutation, useQuery } from "@tanstack/react-query"
import { get } from "react-hook-form"

export const useCreateSales = () => {
    return useMutation({
        mutationFn: createSales
    })
}

export const useGetSales = (search:string) => {
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


// export const useDeleteSels = () => {
//     return useMutation({
//         mutationFn: deleteSels
//     })
// }

// export const useUpdateSels = () => {
//     return useMutation({
//         mutationFn: updateSels
//     })
// }