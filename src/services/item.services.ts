import client from "@/lib/axios"

export const createItem = async (item: any) => {
    const res = await client.post('/api/items', item);
    return res.data
}

export const getItems = async (params?: {
    search?: string;
    categoryId?: string;
    branchId?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
}) => {
    const query = new URLSearchParams();

    if (params?.search) query.append("search", params.search);
    if (params?.categoryId) query.append("categoryId", params.categoryId);
    if (params?.branchId) query.append("branchId", params.branchId);
    if (params?.lowStock) query.append("lowStock", "true");

    query.append("page", String(params?.page || 1));
    query.append("limit", String(params?.limit || 50));
    const res = await client.get(`/api/items?${query.toString()}`);
    return res.data;
};


export const getSingleItem = async (id: string) => {
    const res = await client.get(`/api/items/${id}`);
    return res.data
}

export const updateItem = async (item: any) => {
    const res = await client.patch(`/api/items/${item.id}`, item.data);
    return res.data
}
export const deleteItem = async (id: string) => {
    const res = await client.delete(`/api/items/${id}`);
    return res.data
}
export const getItemsCategories = async () => {
    const res = await client.get('/api/items/categories');
    return res.data
}

export const transferItem = async (item: any) => {
    const res = await client.post('/api/items/transfer', item);
    return res.data
}

export type ItemsStatus = {
    totalItems: number;
    totalStock: number;
    stockValue: number;
    lowStock: number;
};

export const getItemsStatus = async (): Promise<{ success: boolean; data: ItemsStatus }> => {
    const res = await client.get('/api/items/status');
    return res.data;
};