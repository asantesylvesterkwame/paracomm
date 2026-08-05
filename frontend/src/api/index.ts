import axios from "axios";

export const PARACOMM_API = axios.create({
  baseURL: import.meta.env.VITE_PARACOMM_API_URL,
  timeout: 15000,
});
