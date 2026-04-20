import { createExpense, getExpenseById, getExpenseCategories, getExpenses, getExpenseSummary, updateExpense, uploadExpenseImage } from "@/services/expense.services"
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query"
import { create } from "zustand";

export const useExpenseSummary = () => {
   return useQuery({
    queryKey: ['expenseSummary'],
    queryFn: getExpenseSummary,
    select: (data) => data.data
});
};

export const useUploadExpenseImage = () => {
  return useMutation({
    mutationFn: uploadExpenseImage
  })
}

export const useGetExpenseCategories = () => {
  return useQuery({
    queryKey: ['expenseCategories'],
    queryFn: getExpenseCategories,
    select: (data) => data.data
  })
}


export const useCreateExpense = () => {
   return useMutation({
    mutationFn: createExpense,
   
   })
}

export const useGetExpenses = (filter: {search?: string, categoryId?: string}) => {
  return useQuery({
    queryKey: ['expenses', filter],
    queryFn: () => getExpenses(filter),
    select: (data) => data.data
  })
}

export const useGetExpenseById = (expenseId: string) => {
  return useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => getExpenseById(expenseId),
    select: (data) => data.data
  })
}


export const useUpdateExpense = () =>{
  const queryClient =  new QueryClient()
  return useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {      
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
    }
  })
}
