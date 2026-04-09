import client from "@/lib/axios";

export const getBatches = async (params?: {
    search?: string;
    status?: 'expired' | 'expiring' | 'active' | 'inactive';
    branchId?: string;
    page?: number;
    limit?: number;
}) => {
    const query = new URLSearchParams();

    if (params?.search) query.append("search", params.search);
    if (params?.status) query.append("status", params.status);
    if (params?.branchId) query.append("branchId", params.branchId);

    query.append("page", String(params?.page || 1));
    query.append("limit", String(params?.limit || 50));
    const res = await client.get(`/api/batches?${query.toString()}`);
    return res.data;
}


export const getBatchesStatus = async () => {
    const res = await client.get(`/api/batches/status`);
    return res.data;
}