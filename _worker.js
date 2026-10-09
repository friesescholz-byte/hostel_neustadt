/**
 * Universal Cloudflare Worker & Pages entrypoint: _worker.js
 * Handles API routes:
 *  - /api/auth
 *  - /api/store (KV persistence)
 *  - /api/mollie/create-payment (Mollie REST API)
 *  - /api/mollie/verify (Mollie REST API)
 *  - /api/mollie/refund (Mollie REST API)
 *  - /api/resend/emails (Resend REST API)
 * And delegates static files to env.ASSETS
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Common CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Enable CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
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
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Falsches Passwort. Bitte überprüfen Sie Ihre Eingabe.' 
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || 'Authentifizierungsfehler' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
                ...corsHeaders
              }
            });
          }
        }
        return new Response(JSON.stringify(null), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
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
              ...corsHeaders
            }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
      }
    }

    // Helper for Mollie API Key
    const getMollieApiKey = () => {
      return env?.MOLLIE_API_KEY || env?.VITE_MOLLIE_API_KEY || 'test_Bf8wMeDwtf9jmmqSBEdqPDMADEd5eh';
    };

    // 3. Route: /api/mollie/create-payment
    if (url.pathname === '/api/mollie/create-payment' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { amount, description, redirectUrl, metadata, method } = body;
        const apiKey = getMollieApiKey();

        const numAmount = Number(amount || 0).toFixed(2);
        const molliePayload = {
          amount: {
            currency: 'EUR',
            value: numAmount
          },
          description: description || 'Hostel Neustadt Zimmerbuchung',
          redirectUrl: redirectUrl || `${url.origin}/buchen?payment_status=check`,
          metadata: metadata || {}
        };

        if (method && method.startsWith('mollie_')) {
          const cleanMethod = method.replace('mollie_', '');
          if (['card', 'creditcard', 'paypal', 'klarna', 'giropay', 'applepay'].includes(cleanMethod)) {
            molliePayload.method = (cleanMethod === 'card' || cleanMethod === 'creditcard') ? 'creditcard' : cleanMethod;
          }
        }

        const mollieRes = await fetch('https://api.mollie.com/v2/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'HostelNeustadt/1.0'
          },
          body: JSON.stringify(molliePayload)
        });

        const data = await mollieRes.json();

        if (!mollieRes.ok) {
          return new Response(JSON.stringify({
            success: false,
            error: data.detail || data.title || 'Mollie API Fehler',
            mollieData: data
          }), {
            status: mollieRes.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          paymentId: data.id,
          status: data.status,
          checkoutUrl: data._links?.checkout?.href || null,
          mode: data.mode
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          error: err.message || 'Fehler bei Mollie-Zahlungserstellung'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 4. Route: /api/mollie/verify
    if (url.pathname === '/api/mollie/verify' && request.method === 'GET') {
      try {
        const paymentId = url.searchParams.get('id');
        if (!paymentId) {
          return new Response(JSON.stringify({ success: false, error: 'Payment ID fehlt' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const apiKey = getMollieApiKey();
        const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'HostelNeustadt/1.0'
          }
        });

        const data = await mollieRes.json();
        if (!mollieRes.ok) {
          return new Response(JSON.stringify({
            success: false,
            error: data.detail || 'Fehler beim Abrufen der Zahlung von Mollie',
            mollieData: data
          }), {
            status: mollieRes.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const isPaid = data.status === 'paid';
        return new Response(JSON.stringify({
          success: true,
          paymentId: data.id,
          status: data.status,
          isPaid,
          amount: data.amount?.value,
          paidAt: data.paidAt || null,
          method: data.method,
          description: data.description,
          metadata: data.metadata || {}
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          error: err.message || 'Fehler bei Mollie-Zahlungsüberprüfung'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 5. Route: /api/mollie/refund
    if (url.pathname === '/api/mollie/refund' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { paymentId, amount, description } = body;

        if (!paymentId) {
          return new Response(JSON.stringify({ success: false, error: 'Payment ID fehlt' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        if (!paymentId.startsWith('tr_')) {
          return new Response(JSON.stringify({
            success: true,
            refundId: `re_sim_${Date.now().toString(36)}`,
            status: 'refunded',
            amount: { currency: 'EUR', value: Number(amount || 0).toFixed(2) },
            simulated: true
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const apiKey = getMollieApiKey();
        const refundPayload = {
          description: description || 'Hostel Neustadt Buchungsstornierung'
        };
        if (amount !== undefined && amount !== null && Number(amount) > 0) {
          refundPayload.amount = { currency: 'EUR', value: Number(amount).toFixed(2) };
        }

        const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}/refunds`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'HostelNeustadt/1.0'
          },
          body: JSON.stringify(refundPayload)
        });

        const data = await mollieRes.json();
        if (!mollieRes.ok) {
          return new Response(JSON.stringify({
            success: false,
            error: data.detail || 'Mollie Rückerstattungsfehler',
            mollieData: data
          }), {
            status: mollieRes.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          refundId: data.id,
          status: data.status,
          amount: data.amount,
          createdAt: data.createdAt
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          error: err.message || 'Fehler bei Mollie-Rückerstattung'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 6. Route: /api/resend/emails
    if (url.pathname === '/api/resend/emails' && request.method === 'POST') {
      try {
        const body = await request.json();
        const resendKey = env?.RESEND_API_KEY;

        if (!resendKey) {
          return new Response(JSON.stringify({ error: 'RESEND_API_KEY ist in Cloudflare nicht konfiguriert' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'HostelNeustadt/1.0'
          },
          body: JSON.stringify(body)
        });

        const data = await res.text();
        return new Response(data, {
          status: res.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 7. Fallback: Serve static assets (Cloudflare Workers / Pages)
    if (env?.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return fetch(request);
  }
};
