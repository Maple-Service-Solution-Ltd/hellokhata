import { loginUser, registerUser, resendOTP,  verifyOTP } from "@/services/user.services"
import { useMutation } from "@tanstack/react-query"

export const useRegisterUser = () =>{
    return useMutation({
        mutationFn: registerUser 
    })
};


export const useVerifyOTP = () =>{
    return useMutation({
        mutationFn: verifyOTP
    })
};


export const useResendOTP = () =>{
    return useMutation({
        mutationFn: resendOTP 
    })
}

export const useLoginUser = () =>{
    return useMutation({
        mutationFn: loginUser
    })
}