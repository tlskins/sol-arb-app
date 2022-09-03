import axios, { AxiosError } from 'axios'
import { toast } from 'react-toastify';
import { IServerError } from './types/service'

// api

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_HOST,
  timeout: 150000,
  headers: {
    'Content-type': 'application/json',
  },
})

export const setAccessToken = (newToken: string) => axiosInstance.defaults.headers.common['Authorization'] = newToken

export default axiosInstance

// helpers

export const handleError = (errPrefix: string, err: any): void => {
  if (axios.isAxiosError(err)) {
    const serverErr = err as AxiosError<IServerError>;
    toast.error(`${errPrefix}: ${ serverErr?.response?.data?.message || 'Unknown' }`, {
      theme: 'dark',
      position: toast.POSITION.TOP_CENTER,
    })
  } else {
    console.error(err);
  }
}
