import client from "@/lib/axios";

export const createSales = async (item: any) => {
    const res = await client.post('/api/sales', item);
    return res.data
}

export const getSales = async (filter: { search?: string, partyId?: string } = {}) => {
    const res = await client.get('/api/sales', { params: filter });
    return res.data
}

export const getSalesSummary = async () => {
    const res = await client.get('/api/sales/summary');
    return res.data
}

export const getSaleById = async (id: string) => {
    const res = await client.get(`/api/sales/${id}`);
    return res.data
}

export const updateSale = async ({ id, data }: { id: string; data: any }) => {
    console.log('Sale ID', id)
    console.log('edited data', data)
    const res = await client.patch(`/api/sales/${id}`, data);
    return res.data
}

