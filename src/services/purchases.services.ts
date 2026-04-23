import client from "@/lib/axios";

export const createPurchases = async (data: any) => {
    const res = await client.post('/api/purchases', data);
    return res.data;
}

export const getPurchases = async () => {
    const res = await client.get('/api/purchases');
    return res.data;
}

export const getPurchaseById = async (id: string) => {
    const res = await client.get(`/api/purchases/${id}`);
    return res.data;
}

export const updatePurchase = async ({ id, data }: { id: string; data: any }) => {
    const res = await client.patch(`/api/purchases/${id}`, data);
    return res.data;
}