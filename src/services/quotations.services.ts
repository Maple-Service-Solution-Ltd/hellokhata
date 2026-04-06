import client from "@/lib/axios";

export const createQuotation = async (data: any) => {
    const res = await client.post('/api/quotations', data);
    return res.data;
}

export const getQuotations = async (search: string) => {
    const res = await client.get('/api/quotations', { params: { search } });
    return res.data;
}

// export const getQuotation = async (id: string) => {
//     const res = await client.get(`/api/quotations/${id}`);
//     return res.data;
// }

// export const deleteQuotation = async (id: string) => {
//     const res = await client.delete(`/api/quotations/${id}`);
//     return res.data;
// }

// export const updateQuotation = async ({ id, data }: { id: string, data: any }) => {
//     const res = await client.patch(`/api/quotations/${id}`, data);
//     return res.data;
// }   