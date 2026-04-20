import client from "@/lib/axios";

export const getExpenseSummary = async () => {
    const res = await client.get('/api/expenses/summary');
    return res.data;
};

export const uploadExpenseImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await client.post(`/api/expenses/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

    return res.data;
};

export const getExpenseCategories = async () => {
    const res = await client.get('/api/expenses/categories');
    return res.data;
}

export const createExpense = async(expenseData: any) => {
    const res = await client.post('/api/expenses', expenseData);
    return res.data;
}

export const getExpenses = async ({search,categoryId}: {search?: string, categoryId?: string}) => {
    const res = await client.get('/api/expenses', {
        params: {
            search,
            categoryId
        }
    });
    return res.data;
}

export const deleteExpense = async (expenseId: string) => {
    const res = await client.delete(`/api/expenses/${expenseId}`);
    return res.data;
}

export const updateExpense = async ({expenseId, expenseData}: {expenseId: string, expenseData: any}) => {
    const res = await client.patch(`/api/expenses/${expenseId}`, expenseData);
    return res.data;
}

export const getExpenseById = async (expenseId: string) => {
    const res = await client.get(`/api/expenses/${expenseId}`);
    return res.data;
}

