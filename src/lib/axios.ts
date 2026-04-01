import axios from "axios";
import { toast } from "sonner";

const client = axios.create({
  baseURL: 'https://voiceerp.mapleitfirm.com',
  withCredentials: true,
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response.data.message || "Something went wrong!";
    console.log(error.response)
    if (error.response.status === 401) {
      if (typeof window !== "undefined") {
        toast.error(message);
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
    toast.error(message);
    return Promise.reject(error);
  },
);
export default client;