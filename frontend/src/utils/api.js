import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截：附加 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('vault_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截：token 过期自动登出
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vault_token');
      localStorage.removeItem('vault_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
