
import { getBatches, getBatchesStatus } from "@/services/batches.services";
import {  useQuery } from "@tanstack/react-query";



export const useGetBatches = (filters?: {
    search?: string;
    status?: 'expired' | 'expiring' | 'active' | 'inactive';
    branchId?: string;
    page?: number;
    limit?: number;
}) => {
    return useQuery({
        queryKey: ['batches', filters],
        queryFn: () => getBatches(filters),
        placeholderData: (previousData) => previousData
    });
}


export const useGetBatchesStatus = () => {
    return useQuery({
        queryKey: ['batchesStatus'],
        queryFn:  getBatchesStatus,
    });
}
