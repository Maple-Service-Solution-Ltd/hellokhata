import { createItem, deleteItem, getItems, getItemsCategories, getItemsStatus, getSingleItem, transferItem, updateItem } from "@/services/item.services"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useCreateItem = () => {
    return useMutation({
        mutationFn: createItem
    })
};

export const useGetItems = (filters?: {
    search?: string;
    categoryId?: string;
    branchId?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
}) => {
    return useQuery({
        queryKey: ['items', filters],
        queryFn: () => getItems(filters),
        placeholderData: (previousData) => previousData,
        // select: (data) => data.data
    });
};

export const useGetSingleItem = (id: string) => {
    return useQuery({
        queryKey: ['item', id],
        queryFn: () => getSingleItem(id),
        enabled: !!id,
    });
}

export const useGetItemsStatus = () => {
    return useQuery({
        queryKey: ['itemsStatus'],
        queryFn: getItemsStatus,
    });
};

export const useGetItemsCategories = () => {
    return useQuery({
        queryKey: ['itemsCategory'],
        queryFn: getItemsCategories
    })
}

export const useUpdateItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateItem,
        onSuccess: ()=>  {
            queryClient.invalidateQueries({queryKey:['items']})
            queryClient.invalidateQueries({queryKey:['itemsStatus']})
        }
    })
}
export const useDeleteItem = () => {
     const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteItem,
        onSuccess: ()=>  {
            queryClient.invalidateQueries({queryKey:['items']})
            queryClient.invalidateQueries({queryKey:['itemsStatus']})
        }
    })
}


export const useTransferItem = () => {
    return useMutation({
        mutationFn: transferItem
    })
}

