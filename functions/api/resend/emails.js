/**
 * Cloudflare Pages Function: /api/resend/emails
 * Proxies email sending via Resend API
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const apiKey = env.RESEND_API_KEY || (typeof process !== 'undefined' ? process.env.RESEND_API_KEY : '');

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'HostelNeustadt/1.0'
      },
      body: JSON.stringify(body)
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
