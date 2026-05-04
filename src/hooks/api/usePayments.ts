
import { createPaymentPlans, getPaymentList, paymentSummary } from "@/services/payments.services"
import { useMutation, useQuery } from "@tanstack/react-query"

export const usePaymentSummary = () => {
    return useQuery({
        queryKey: ["payment-summary"],
        queryFn: () => paymentSummary(),
        select: data => data.data
    })
}

export const useCreatePaymentPlans = () => {
    return useMutation({
        mutationFn: createPaymentPlans,
    })
}

export const useGetPaymentList = (partyId?: string) => {
    return useQuery({
        queryKey: ['payment-plans', partyId],
        queryFn: () => getPaymentList(partyId),
        select: data => data.data
    })
}