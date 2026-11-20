export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, CF-Turnstile-Token, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

export const handleCors = (request) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};
