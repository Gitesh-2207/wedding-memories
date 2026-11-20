/**
 * Cloudflare Worker for Royal Wedding Memories
 * Secure edge gateway for Cloudflare R2 private uploads & Turnstile bot verification
 */

import { handleUploadRequest, handleSessionRequest } from './routes/upload.js';
import { handleCors, corsHeaders } from './middleware/cors.js';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    const url = new URL(request.url);

    try {
      // Health check
      if (url.pathname === '/worker-health') {
        return new Response(JSON.stringify({ status: 'ok', worker: 'Royal Wedding Memories Edge Gateway' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Guest Upload Session (Edge storage quota verification)
      if (url.pathname === '/api/upload/session' && request.method === 'POST') {
        return await handleSessionRequest(request, env);
      }

      // Guest Upload to R2
      if (url.pathname === '/api/upload' && request.method === 'POST') {
        return await handleUploadRequest(request, env);
      }

      // Fallback or forward to main backend
      return new Response(JSON.stringify({ error: 'Route not handled by edge worker' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: err.message || 'Edge Worker Internal Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};
