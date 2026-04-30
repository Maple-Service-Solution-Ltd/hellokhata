
import { createPaymentPlans, paymentSummary } from "@/services/payments.services"
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