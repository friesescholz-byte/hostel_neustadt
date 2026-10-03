/**
 * Universal Cloudflare Worker & Pages entrypoint: _worker.js
 * Handles API routes (/api/auth, /api/store) and delegates static files to env.ASSETS
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Enable CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // 1. Route: /api/auth
    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const { password } = await request.json();
        const serverSecret = env?.ADMIN_PASSWORD || env?.VITE_ADMIN_PASSWORD || 'Hostel#Neustadt!2026';

        if (password && password === serverSecret) {
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

    // 2. Route: /api/store
    if (url.pathname === '/api/store') {
      if (request.method === 'GET') {
        if (env?.HOSTEL_KV) {
          const data = await env.HOSTEL_KV.get('hostel_store_v1', 'json');
          if (data) {
            return new Response(JSON.stringify(data), {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
        }
        return new Response(JSON.stringify(null), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      if (request.method === 'POST') {
        try {
          const payload = await request.json();
          if (env?.HOSTEL_KV) {
            await env.HOSTEL_KV.put('hostel_store_v1', JSON.stringify(payload));
          }
          return new Response(JSON.stringify({ success: true }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    }

    // 3. Fallback: Serve static assets (Cloudflare Workers / Pages)
    if (env?.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return fetch(request);
  }
};
