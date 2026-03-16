import { createItem, deleteItem, getItems, getItemsCategories, getSingleItem, updateItem } from "@/services/item.services"
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
    queryFn: ()=> getSingleItem(id),
  });
}

export const useGetItemsCategories = () =>{
    return useQuery({
        queryKey: ['itemsCategory'],
        queryFn: getItemsCategories
    })
}

export const useUpdateItem = () =>{
    return useMutation({
        mutationFn: updateItem
    })
}
export const useDeleteItem = () =>{
    return useMutation({
        mutationFn: deleteItem
    })
}