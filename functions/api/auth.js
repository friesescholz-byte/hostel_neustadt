/**
 * Cloudflare Pages Function: /api/auth
 * Server-side authentication for Admin Hub
 * Validates password against context.env.ADMIN_PASSWORD
 */

export async function onRequestPost(context) {
  try {
    const { password } = await context.request.json();
    const serverSecret = context.env.ADMIN_PASSWORD || context.env.VITE_ADMIN_PASSWORD || 'Hostel#Neustadt!2026';

    if (password && password === serverSecret) {
      // Secure verification token
      const token = btoa(`hostel_auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      return new Response(JSON.stringify({ success: true, token }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Falsches Passwort. Bitte überprüfen Sie Ihre Eingabe.' 
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Authentifizierungsfehler' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
