import { Party } from "@/app/(dashboard)/parties/new/page";
import client from "@/lib/axios";


export const createParty = async (data: Party) => {
    const res = await client.post('/api/parties', data);
    return res.data;
}

export const getParties = async () => {
    const res = await client.get('/api/parties');
    return res.data;
}

export const getParty = async (id: string) => {
    const res = await client.get(`/api/parties/${id}`);
    return res.data;
}

export const deleteParty = async (id: string) => {
    const res = await client.delete(`/api/parties/${id}`);
    console.log(res.data)
    return res.data;
}

export const updateParty = async ({ id, data }: { id: string, data: any }) => {
    const res = await client.patch(`/api/parties/${id}`, data);
    return res.data;
}