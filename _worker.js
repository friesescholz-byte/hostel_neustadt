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

    const TWO_FACTOR_EMAIL = 'vermietung@bh-am-ruebenberge.de';

    const send2FACodeEmail = async (code) => {
      const emailPayload = {
        from: 'Hostel Neustadt Sicherheit <noreply@scholz-friese-webdesign.de>',
        to: [TWO_FACTOR_EMAIL],
        subject: `Sicherheitscode für Admin-Login: ${code}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin: 0; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    <div style="background: #0f2b5c; padding: 24px 28px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 19px; font-weight: 700; letter-spacing: -0.01em;">Hostel Neustadt</h1>
      <p style="margin: 4px 0 0 0; color: #cbd5e1; font-size: 13px;">Sicherheits-Authentifizierung</p>
    </div>
    <div style="padding: 28px;">
      <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #334155;">
        Es wurde eine Anmeldung am <strong>Admin-Dashboard</strong> angefordert. Verwenden Sie den folgenden 6-stelligen Sicherheitscode zur Bestätigung:
      </p>
      
      <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f2b5c; display: inline-block;">
          ${code}
        </span>
      </div>

      <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
        ⏱️ <strong>Gültigkeit:</strong> Dieser Code ist für die nächsten <strong>10 Minuten</strong> gültig.
      </p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.4;">
        Falls Sie diesen Anmeldeversuch nicht selbst ausgelöst haben, ignorieren Sie diese E-Mail. Ohne diesen Code ist kein Zugriff auf das Dashboard möglich.
      </p>
    </div>
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 28px; text-align: center; font-size: 11px; color: #94a3b8;">
      Hostel Neustadt · Bertha-Sicius-Str. 6 a und b · 31535 Neustadt am Rübenberge
    </div>
  </div>
</body>
</html>`
      };

      // 1. Direct Resend API via configured Secret (visible in user's Resend dashboard)
      const resendKey = env?.RESEND_API_KEY;
      if (resendKey) {
        try {
          const directRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'HostelNeustadt/1.0'
            },
            body: JSON.stringify(emailPayload)
          });
          if (directRes.ok) {
            return true;
          }
          console.error('[2FA] Resend direct failed:', await directRes.text());
        } catch (dirErr) {
          console.error('[2FA] Resend direct error:', dirErr);
        }
      }

      // 2. Fallback via centralized mailer worker
      try {
        await fetch('https://resend-mailer.friese-scholz.workers.dev', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });
        return true;
      } catch (err) {
        console.error('[2FA] Mail fallback error:', err);
        return false;
      }
    };

    // 1. Route: /api/auth
    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const { password, deviceToken, turnstileToken } = await request.json();

        // Verify Turnstile bot protection if secret key is present
        if (env?.TURNSTILE_SECRET_KEY && turnstileToken && turnstileToken !== 'turnstile-fallback-ok') {
          try {
            const formData = new FormData();
            formData.append('secret', env.TURNSTILE_SECRET_KEY);
            formData.append('response', turnstileToken);
            const clientIp = request.headers.get('CF-Connecting-IP');
            if (clientIp) formData.append('remoteip', clientIp);

            const cfVerifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
              method: 'POST',
              body: formData
            });
            const cfVerifyData = await cfVerifyRes.json();
            if (!cfVerifyData.success) {
              return new Response(JSON.stringify({ 
                success: false, 
                error: 'Sicherheitsüberprüfung (Turnstile) fehlgeschlagen. Bitte laden Sie die Seite neu.' 
              }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            }
          } catch (tErr) {
            console.warn('[Turnstile] Bot verification exception:', tErr);
          }
        }

        const serverSecret = env?.Passwort || env?.ADMIN_PASSWORD;

        if (!password || password !== serverSecret) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Falsches Passwort. Bitte überprüfen Sie Ihre Eingabe.' 
          }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // If device was previously verified
        if (deviceToken && env?.HOSTEL_KV) {
          const isTrusted = await env.HOSTEL_KV.get('trusted_device_' + deviceToken);
          if (isTrusted) {
            const token = btoa(`hostel_auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
            return new Response(JSON.stringify({ success: true, token, trusted: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }

        // Generate 6-digit code for 2FA
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const challengeId = 'ch_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);

        if (env?.HOSTEL_KV) {
          await env.HOSTEL_KV.put('2fa_challenge_' + challengeId, code, { expirationTtl: 600 });
        }

        await send2FACodeEmail(code);

        return new Response(JSON.stringify({
          success: true,
          require2FA: true,
          challengeId,
          email: TWO_FACTOR_EMAIL
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || 'Authentifizierungsfehler' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 1b. Route: /api/auth/verify-2fa
    if (url.pathname === '/api/auth/verify-2fa' && request.method === 'POST') {
      try {
        const { challengeId, code, rememberDevice } = await request.json();

        if (!challengeId || !code) {
          return new Response(JSON.stringify({ success: false, error: 'Challenge ID und Code erforderlich.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        let isValid = false;
        if (env?.HOSTEL_KV) {
          const expectedCode = await env.HOSTEL_KV.get('2fa_challenge_' + challengeId);
          if (expectedCode && expectedCode.trim() === code.trim()) {
            isValid = true;
            await env.HOSTEL_KV.delete('2fa_challenge_' + challengeId);
          }
        }

        if (!isValid) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Ungültiger oder abgelaufener 6-stelliger Sicherheitscode. Bitte prüfen Sie Ihre E-Mails.' 
          }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const token = btoa(`hostel_auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
        let newDeviceToken = null;

        if (rememberDevice && env?.HOSTEL_KV) {
          newDeviceToken = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
          await env.HOSTEL_KV.put('trusted_device_' + newDeviceToken, '1', { expirationTtl: 60 * 60 * 24 * 30 });
        }

        return new Response(JSON.stringify({
          success: true,
          token,
          deviceToken: newDeviceToken
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || 'Verifizierungsfehler' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 1c. Route: /api/auth/resend-2fa
    if (url.pathname === '/api/auth/resend-2fa' && request.method === 'POST') {
      try {
        const { password } = await request.json();
        const serverSecret = env?.Passwort || env?.ADMIN_PASSWORD;

        if (!password || password !== serverSecret) {
          return new Response(JSON.stringify({ success: false, error: 'Nicht autorisiert.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const challengeId = 'ch_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);

        if (env?.HOSTEL_KV) {
          await env.HOSTEL_KV.put('2fa_challenge_' + challengeId, code, { expirationTtl: 600 });
        }

        await send2FACodeEmail(code);

        return new Response(JSON.stringify({
          success: true,
          challengeId,
          email: TWO_FACTOR_EMAIL
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || 'Fehler beim erneuten Senden.' }), {
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
      return env?.MOLLIE_API_KEY || '';
    };

    // 3. Route: /api/mollie/create-payment
    if (url.pathname === '/api/mollie/create-payment' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { amount, description, redirectUrl, metadata, method } = body;
        const apiKey = getMollieApiKey();

        if (!apiKey) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Mollie API-Schlüssel ist nicht in den Cloudflare Umgebungsvariablen hinterlegt (MOLLIE_API_KEY).'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

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
        if (!apiKey) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Mollie API-Schlüssel ist nicht in den Cloudflare Umgebungsvariablen hinterlegt (MOLLIE_API_KEY).'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

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
        if (!apiKey) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Mollie API-Schlüssel ist nicht in den Cloudflare Umgebungsvariablen hinterlegt (MOLLIE_API_KEY).'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

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
