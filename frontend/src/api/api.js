import axios from 'axios';
  import { store } from '../store/store';
  import { setCredentials } from '../store/authSlice';

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
  });

  api.interceptors.request.use(
    (config) => {
      const token = store.getState().auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = store.getState().auth.refreshToken;
          const res = await axios.post('http://localhost:5000/api/auth/refresh', {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken, user } = res.data;
          store.dispatch(
            setCredentials({
              accessToken,
              refreshToken: newRefreshToken,
              user,
            })
          );
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          store.dispatch(setCredentials({ accessToken: null, refreshToken: null, user: null }));
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  export default api;