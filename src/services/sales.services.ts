import client from "@/lib/axios";

export const createSales = async(item:any) => {
    const res = await client.post('/api/sales', item);
    return res.data
}

export const getSales = async(search:string) => {
    const res = await client.get('/api/sales', { params: { search } });
    return res.data
}