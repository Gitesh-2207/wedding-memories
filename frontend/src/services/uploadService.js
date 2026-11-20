import api from './api';
import axios from 'axios';

export const uploadService = {
  /**
   * Fetch public wedding info by slug
   */
  async getWedding(slug) {
    return api.get(`/upload/wedding/${slug}`);
  },

  /**
   * Create an upload session and reserve atomic quota
   */
  async createSession({ slug, files, turnstileToken }) {
    return api.post('/upload/session', {
      slug,
      turnstileToken,
      files: files.map((f) => ({
        originalName: f.name,
        mimeType: f.type || 'application/octet-stream',
        size: f.size
      }))
    });
  },

  /**
   * Upload single file with progress tracking
   */
  async uploadFile({ reservationId, guestName, caption, file, onProgress }) {
    const formData = new FormData();
    formData.append('reservationId', reservationId);
    if (guestName) formData.append('guestName', guestName);
    if (caption) formData.append('caption', caption);
    formData.append('file', file);

    const baseURL = import.meta.env.VITE_API_URL || '/api';

    const response = await axios.post(`${baseURL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });

    return response.data;
  },

  /**
   * Query status
   */
  async getStatus(id) {
    return api.get(`/upload/status/${id}`);
  }
};
