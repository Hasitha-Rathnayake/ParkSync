import axios from 'axios';

// Production (Vercel): VITE_API_URL from environment
// Local: falls back to localhost
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach logged-in user identity for backend gate (X-User-Id / X-User-Role)
apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('parksync_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id != null) config.headers['X-User-Id'] = String(u.id);
      if (u?.role) config.headers['X-User-Role'] = String(u.role);
    }
  } catch (_) {}
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      try {
        localStorage.removeItem('parksync_user');
      } catch (_) {}
    }
    return Promise.reject(err);
  }
);

export default apiClient;
