import api from './api';

export const adminService = {
  async login(email, password) {
    const res = await api.post('/admin/login', { email, password });
    if (res.token) {
      localStorage.setItem('royal_admin_token', res.token);
      localStorage.setItem('royal_admin_user', JSON.stringify(res.admin));
      localStorage.setItem('royal_admin_wedding', JSON.stringify(res.wedding));
    }
    return res;
  },

  async logout() {
    try {
      await api.post('/admin/logout');
    } finally {
      localStorage.removeItem('royal_admin_token');
      localStorage.removeItem('royal_admin_user');
      localStorage.removeItem('royal_admin_wedding');
    }
  },

  async getMe() {
    return api.get('/admin/me');
  },

  async getDashboard() {
    return api.get('/admin/dashboard');
  },

  async getMemories(params = {}) {
    return api.get('/admin/memories', { params });
  },

  async getMemoryById(id) {
    return api.get(`/admin/memories/${id}`);
  },

  async deleteMemory(id) {
    return api.delete(`/admin/memories/${id}`);
  },

  async updateSettings(settings) {
    return api.patch('/admin/wedding/settings', settings);
  },

  async changePassword(currentPassword, newPassword) {
    return api.patch('/admin/change-password', { currentPassword, newPassword });
  },

  async getStorage() {
    return api.get('/admin/storage');
  },

  async getQrCode() {
    return api.get('/admin/qr-code');
  },

  getStreamUrl(id) {
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const token = localStorage.getItem('royal_admin_token');
    return `${baseURL}/admin/memories/${id}/stream?token=${token || ''}`;
  },

  getDownloadUrl(id) {
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    return `${baseURL}/admin/memories/${id}/download`;
  }
};
