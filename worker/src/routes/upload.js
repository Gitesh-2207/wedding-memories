import { corsHeaders } from '../middleware/cors.js';
import { verifyTurnstile } from '../services/turnstile.js';

export async function handleSessionRequest(request, env) {
  try {
    const body = await request.json();
    const { slug, files, turnstileToken } = body;

    // Verify Turnstile
    if (turnstileToken && env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
      const clientIp = request.headers.get('CF-Connecting-IP') || '';
      const turnstileRes = await verifyTurnstile(turnstileToken, clientIp, env.CLOUDFLARE_TURNSTILE_SECRET_KEY);
      if (!turnstileRes.success) {
        return new Response(JSON.stringify({ success: false, error: 'Turnstile verification failed' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Individual size checks
    for (const f of files) {
      const isVideo = f.mimeType?.startsWith('video/');
      const limit = isVideo ? (env.MAX_VIDEO_BYTES || 31457280) : (env.MAX_PHOTO_BYTES || 15728640);
      if (f.size > limit) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `File ${f.originalName} exceeds ${isVideo ? '30 MiB video' : '15 MiB photo'} limit.`
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    // Forward to backend or generate R2 direct reservations
    const reservations = files.map((f) => {
      const isVideo = f.mimeType?.startsWith('video/');
      const randomId = crypto.randomUUID();
      const ext = f.originalName?.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const objectKey = `wedding-${slug}/${isVideo ? 'videos' : 'photos'}/${randomId}.${ext}`;
      return {
        reservationId: randomId,
        objectKey,
        reservedBytes: f.size,
        fileType: isVideo ? 'video' : 'photo',
        originalName: f.originalName
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        reservations,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleUploadRequest(request, env) {
  try {
    const formData = await request.formData();
    const reservationId = formData.get('reservationId');
    const objectKey = formData.get('objectKey') || `uploads/${crypto.randomUUID()}`;
    const guestName = formData.get('guestName') || 'Royal Guest';
    const caption = formData.get('caption') || '';
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ success: false, error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Stream directly into Cloudflare R2 bucket binding
    if (env.MEMORIES_BUCKET) {
      await env.MEMORIES_BUCKET.put(objectKey, file.stream(), {
        httpMetadata: {
          contentType: file.type
        },
        customMetadata: {
          guestName: encodeURIComponent(guestName),
          caption: encodeURIComponent(caption),
          fileName: encodeURIComponent(file.name)
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Uploaded to Cloudflare R2 successfully',
        memory: {
          reservationId,
          objectKey,
          guestName,
          fileName: file.name,
          fileSize: file.size
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
