import { createExpense, deleteExpense, getExpenseById, getExpenseCategories, getExpenses, getExpenseSummary, updateExpense, uploadExpenseImage } from "@/services/expense.services"
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"


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

export const useCreateExpense = () => {
  const queryClient = useQueryClient()
   return useMutation({
    mutationFn: createExpense,
   onSuccess: () => {      
    queryClient.invalidateQueries({ queryKey: ['expenses']});
    queryClient.invalidateQueries({ queryKey: ['expenseSummary']});
    }
   })
}

export const useUpdateExpense = () =>{
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {      
    queryClient.invalidateQueries({ queryKey: ['expenses']});
    queryClient.invalidateQueries({ queryKey: ['expenseSummary']});
    }
  })
}


export const useDeletExpense = () =>{
   const queryClient =  useQueryClient()
  return useMutation({
  mutationFn: deleteExpense,
   onSuccess: () => {      
    queryClient.invalidateQueries({ queryKey: ['expenses']});
    queryClient.invalidateQueries({ queryKey: ['expenseSummary']});
    }
  })
}