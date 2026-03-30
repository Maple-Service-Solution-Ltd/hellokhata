import client from "@/lib/axios"

export const createItem = async(item:any) =>{
    const res = await client.post('/api/items',item);
    return res.data
}

export const getItems = async() =>{
    const res = await client.get('/api/items');
    return res.data
}

export const getSingleItem = async(id:string) =>{
    const res = await client.get(`/api/items/${id}`);
    return res.data
}

export const updateItem = async (item:any) =>{
    const res = await client.patch(`/api/items/${item.id}`,item.data);
    return res.data
}
export const deleteItem = async(id:string) =>{
    const res = await client.delete(`/api/items/${id}`);
    return res.data
}
export const getItemsCategories = async() =>{
    const res = await client.get('/api/items/categories');
    return res.data
}

export const transferItem = async(item:any) =>{
    const res = await client.post('/api/items/transfer',item);
    return res.data
}