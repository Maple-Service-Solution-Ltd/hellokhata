import client from "@/lib/axios"

export const paymentSummary = () => {
    return client.get('/api/payments/summary')
}

export const createPaymentPlans = (data: any) => {
    return client.post('/api/payments/plans', data)
}