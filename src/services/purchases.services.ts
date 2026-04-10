import client from "@/lib/axios";

export const createPurchases = async (data: any) => {
    const res = await client.post('/api/purchases', data);
    return res.data;
}