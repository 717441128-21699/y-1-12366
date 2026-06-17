import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code !== 0 && res.code !== 200) {
        message.error(res.message || '请求失败')
        return Promise.reject(new Error(res.message || '请求失败'))
      }
      return res
    }
    return { code: 0, message: 'success', data: res } as ApiResponse
  },
  (error) => {
    if (error.response?.status === 401) {
      message.error('登录已过期，请重新登录')
      localStorage.removeItem('token')
    } else {
      message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.get(url, config) as unknown as Promise<ApiResponse<T>>
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.post(url, data, config) as unknown as Promise<ApiResponse<T>>
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.put(url, data, config) as unknown as Promise<ApiResponse<T>>
  },
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.patch(url, data, config) as unknown as Promise<ApiResponse<T>>
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.delete(url, config) as unknown as Promise<ApiResponse<T>>
  },
}

export default request
