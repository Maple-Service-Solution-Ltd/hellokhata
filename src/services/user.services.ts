import client from "@/lib/axios"

export const registerUser = async (user:any) =>{
    const res = await client.post('api/auth/register', user);
    return res.data
};

export const verifyOTP = async(payload:any) =>{
    const res = await client.post('/api/auth/verify-otp',payload);
    return res.data
}

export const resendOTP = async (resendItem: {userId:string; purpose:string}) =>{
    const res = await client.post('/api/auth/resend-otp',resendItem);
    return res.data
};

export const loginUser = async ({phone}:{phone:string}) =>{
    const res = await client.post('/api/auth/signin',{phone});
    return res.data
}

