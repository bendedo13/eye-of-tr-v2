import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator, localhost for iOS simulator
const BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8000/api' 
  : 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    // Auth endpoint expects x-www-form-urlencoded usually, but let's check backend
    // Backend uses OAuth2PasswordRequestForm which is form-data
    return api.post('/auth/token', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const search = {
  uploadFace: (fileUri) => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: 'search.jpg',
      type: 'image/jpeg',
    });
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  searchFace: (filename) => api.post(`/search?filename=${filename}`),
};

export default api;
