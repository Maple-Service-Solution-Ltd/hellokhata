import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createParty, deleteParty, getParties, getParty, updateParty } from "@/services/parties.services";
// import { Party } from "@/app/(dashboard)/parties/new/page";

export const useCreateParty = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createParty,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parties'] });
        }
    });
};

export const useParties = (type?: 'customer' | 'supplier' | 'both') => {
    return useQuery({
        queryKey: ['parties'],
        queryFn: () => getParties(type)
    })
}

export const useParty = (id: string) => {
    return useQuery({
        queryKey: ['party', id],
        queryFn: () => getParty(id)
    })
}

export const useDeleteParty = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteParty,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parties'] });
        }
    })
}

export const useUpdateParty = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateParty,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parties'] });
        }
    })
}