import { createItem, deleteItem, getItems, getItemsCategories, getSingleItem } from "@/services/item.services"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useCreateItem = () =>{
    return useMutation({
        mutationFn: createItem
    })
};

export const useGetItems = () =>{
    return useQuery({
        queryKey: ['items'],
        queryFn: getItems
    })
}
export function useGetSingleItem(id: string) {
  return useQuery({
    queryKey: ['item'],
    queryFn: () => getSingleItem,
    // select: (data) => data.data,
    // enabled: !!id,
  });
}

export const useGetItemsCategories = () =>{
    return useQuery({
        queryKey: ['itemsCategory'],
        queryFn: getItemsCategories
    })
}

export const useDeleteItem = () =>{
    return useMutation({
        mutationFn: deleteItem
    })
}