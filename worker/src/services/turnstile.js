/**
 * Worker Turnstile Verification
 */
export async function verifyTurnstile(token, ip, secretKey) {
  if (!secretKey || secretKey === 'dummy_secret') {
    return { success: true };
  }

  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);
  formData.append('remoteip', ip);

  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const result = await fetch(url, {
    body: formData,
    method: 'POST'
  });

  return await result.json();
}
