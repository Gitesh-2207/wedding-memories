/**
 * Cloudflare Turnstile Verification Middleware
 * Validates bot verification token server-side via Cloudflare Siteverify API.
 */
export const verifyTurnstileToken = async (req, res, next) => {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  const token = req.body?.turnstileToken || req.headers['cf-turnstile-token'];

  // If Turnstile is not configured or in development/testing, bypass cleanly
  if (!secretKey || secretKey.startsWith('1x0000') || secretKey === 'dummy_secret' || process.env.NODE_ENV !== 'production') {
    return next();
  }

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Turnstile verification token is required to protect against automated spam.'
    });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', req.ip || req.headers['x-forwarded-for'] || '');

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    });

    const result = await response.json();

    if (!result.success) {
      return res.status(403).json({
        success: false,
        error: 'Turnstile verification failed. Please refresh the page and try again.',
        details: result['error-codes']
      });
    }

    next();
  } catch (error) {
    console.error('Error verifying Turnstile token:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Security verification service temporarily unreachable.'
    });
  }
};
