import { createItem, deleteItem, getItems, getItemsCategories, getItemsStatus, getSingleItem, transferItem, updateItem } from "@/services/item.services"
import { useMutation, useQuery } from "@tanstack/react-query"

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

export const useGetItemsCategories = () => {
    return useQuery({
        queryKey: ['itemsCategory'],
        queryFn: getItemsCategories
    })
}

export const useUpdateItem = () => {
    return useMutation({
        mutationFn: updateItem
    })
}
export const useDeleteItem = () => {
    return useMutation({
        mutationFn: deleteItem
    })
}


export const useTransferItem = () => {
    return useMutation({
        mutationFn: transferItem
    })
}

export const useGetItemsStatus = () => {
    return useQuery({
        queryKey: ['itemsStatus'],
        queryFn: getItemsStatus,
    });
};