// API Configuration
const getApiBaseUrl = () => {
  const protocol = window.location.protocol; // 'http:' or 'https:'
  const hostname = window.location.hostname;
  
  // Nếu đang chạy trên localhost, sử dụng localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//localhost:5000`;
  }
  
  // Nếu truy cập từ IP khác, sử dụng cùng IP và protocol đó cho backend
  return `${protocol}//${hostname}:5000`;
};

export const API_BASE_URL = getApiBaseUrl();

// Axios instance với cấu hình mặc định
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động thêm token vào header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;