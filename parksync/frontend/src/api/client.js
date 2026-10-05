import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach logged-in user identity for backend gate (demo auth)
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
      // session missing / rejected
      try {
        localStorage.removeItem('parksync_user');
      } catch (_) {}
    }
    return Promise.reject(err);
  }
);

export default apiClient;
