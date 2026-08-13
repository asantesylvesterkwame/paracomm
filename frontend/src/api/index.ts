import axios from "axios";

type TokenGetter = () => Promise<string | null>;

let authTokenGetter: TokenGetter | null = null;

export const registerAuthTokenGetter = (getter: TokenGetter | null) => {
  authTokenGetter = getter;
};

export const getAuthToken = async (): Promise<string | null> => {
  if (!authTokenGetter) return null;
  try {
    return await authTokenGetter();
  } catch {
    return null;
  }
};

export const PARACOMM_API = axios.create({
  baseURL: import.meta.env.VITE_PARACOMM_API_URL,
  timeout: 15000,
});

PARACOMM_API.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
