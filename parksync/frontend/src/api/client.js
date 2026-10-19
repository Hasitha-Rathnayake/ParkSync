import axios from 'axios';

// Vercel / production: uses VITE_API_URL from environment
// Local PC: falls back to localhost:8080
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
