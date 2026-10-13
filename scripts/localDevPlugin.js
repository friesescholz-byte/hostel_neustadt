import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const STORE_FILE = path.join(rootDir, 'data', 'store.json');

// Local store synchronization plugin for cross-device updates (PC, mobile, tablet)
export function localStorePlugin() {
  return {
    name: 'local-store-api',
    configureServer(server) {
      server.middlewares.use('/api/store', (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          try {
            if (fs.existsSync(STORE_FILE)) {
              const data = fs.readFileSync(STORE_FILE, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({}));
            }
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              const dataDir = path.dirname(STORE_FILE);
              if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
              }
              fs.writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON or write error' }));
            }
          });
          return;
        }

        next();
      });

      // Local Resend email mock/proxy
      server.middlewares.use('/api/resend/emails', (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              console.log('[Resend Local] E-Mail dispatched:', parsed.subject, 'To:', parsed.to);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ id: 'msg_' + Date.now(), success: true }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });

      // Local Admin Authentication API endpoint
      server.middlewares.use('/api/auth', (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const getValidPassword = () => {
          let envPass = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;
          if (!envPass) {
            const envPath = path.join(rootDir, '.env');
            if (fs.existsSync(envPath)) {
              const content = fs.readFileSync(envPath, 'utf-8');
              const match = content.match(/ADMIN_PASSWORD\s*=\s*(.*)/);
              if (match) envPass = match[1].trim();
            }
          }
          return envPass || 'Hostel#Neustadt!2026';
        };

        const TWO_FACTOR_EMAIL = 'vermietung@bh-am-ruebenberge.de';

        const sendLocal2FAMail = async (code) => {
          try {
            await fetch('https://resend-mailer.friese-scholz.workers.dev', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
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
      Hostel Neustadt · Bertha-Sicius-Str. 6 · 31535 Neustadt am Rübenberge
    </div>
  </div>
</body>
</html>`
              })
            });
            console.log(`[2FA] Sicherheitscode ${code} erfolgreich an ${TWO_FACTOR_EMAIL} gesendet.`);
          } catch (e) {
            console.error('[2FA] Mail send error:', e.message);
          }
        };

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const url = req.url || '';
              const validPassword = getValidPassword();

              if (!server._devChallenges) server._devChallenges = new Map();
              if (!server._devTrustedDevices) server._devTrustedDevices = new Set();

              // Verify 2FA
              if (url.includes('/verify-2fa')) {
                const { challengeId, code, rememberDevice } = JSON.parse(body);
                const challenge = server._devChallenges.get(challengeId);
                
                if (challenge && challenge.code === String(code).trim() && challenge.expiresAt > Date.now()) {
                  server._devChallenges.delete(challengeId);
                  const token = Buffer.from(`hostel_auth_${Date.now()}`).toString('base64');
                  let deviceToken = null;
                  if (rememberDevice) {
                    deviceToken = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
                    server._devTrustedDevices.add(deviceToken);
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, token, deviceToken }));
                } else {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: 'Ungültiger oder abgelaufener 6-stelliger Sicherheitscode.' }));
                }
                return;
              }

              // Resend 2FA
              if (url.includes('/resend-2fa')) {
                const { password } = JSON.parse(body);
                if (password !== validPassword) {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: 'Nicht autorisiert.' }));
                  return;
                }
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                const challengeId = 'ch_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
                server._devChallenges.set(challengeId, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
                await sendLocal2FAMail(code);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, challengeId, email: TWO_FACTOR_EMAIL }));
                return;
              }

              // Initial Login
              const { password, deviceToken } = JSON.parse(body);
              if (password !== validPassword) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Falsches Passwort. Bitte überprüfen Sie Ihre Eingabe.' }));
                return;
              }

              if (deviceToken && server._devTrustedDevices.has(deviceToken)) {
                const token = Buffer.from(`hostel_auth_${Date.now()}`).toString('base64');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, token, trusted: true }));
                return;
              }

              // First login on this device -> 2FA
              const code = Math.floor(100000 + Math.random() * 900000).toString();
              const challengeId = 'ch_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
              server._devChallenges.set(challengeId, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
              await sendLocal2FAMail(code);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, require2FA: true, challengeId, email: TWO_FACTOR_EMAIL }));

            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });

      // Local Mollie API proxy endpoints
      const getMollieKey = () => {
        let key = process.env.MOLLIE_API_KEY;
        if (!key) {
          const envPath = path.join(rootDir, '.env');
          if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            const match = content.match(/^MOLLIE_API_KEY\s*=\s*(.+)$/m);
            if (match) key = match[1].trim();
          }
        }
        return key || '';
      };

      // 1. /api/mollie/create-payment
      server.middlewares.use('/api/mollie/create-payment', async (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { amount, description, redirectUrl, metadata, method } = JSON.parse(body);
              const apiKey = getMollieKey();
              if (!apiKey) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Mollie API-Schlüssel fehlt in der lokalen .env Datei (MOLLIE_API_KEY).' }));
                return;
              }

              const molliePayload = {
                amount: { currency: 'EUR', value: Number(amount || 0).toFixed(2) },
                description: description || 'Hostel Neustadt Zimmerbuchung',
                redirectUrl: redirectUrl || 'http://localhost:5173/buchen?payment_status=check',
                metadata: metadata || {}
              };

              if (method && method.startsWith('mollie_')) {
                const clean = method.replace('mollie_', '');
                if (clean === 'card' || clean === 'creditcard') molliePayload.method = 'creditcard';
                else if (['paypal', 'klarna', 'giropay', 'applepay'].includes(clean)) molliePayload.method = clean;
              }

              const mollieRes = await fetch('https://api.mollie.com/v2/payments', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(molliePayload)
              });

              const data = await mollieRes.json();
              res.statusCode = mollieRes.status;
              res.setHeader('Content-Type', 'application/json');

              if (!mollieRes.ok) {
                res.end(JSON.stringify({ success: false, error: data.detail || 'Mollie Fehler', mollieData: data }));
              } else {
                res.end(JSON.stringify({
                  success: true,
                  paymentId: data.id,
                  status: data.status,
                  checkoutUrl: data._links?.checkout?.href || null,
                  mode: data.mode
                }));
              }
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        next();
      });

      // 2. /api/mollie/verify
      server.middlewares.use('/api/mollie/verify', async (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          try {
            const url = new URL(req.url, 'http://localhost:5173');
            const paymentId = url.searchParams.get('id');

            if (!paymentId) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Payment ID fehlt' }));
              return;
            }

            const apiKey = getMollieKey();
            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Mollie API-Schlüssel fehlt in der lokalen .env Datei (MOLLIE_API_KEY).' }));
              return;
            }

            const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            });

            const data = await mollieRes.json();
            res.statusCode = mollieRes.status;
            res.setHeader('Content-Type', 'application/json');

            if (!mollieRes.ok) {
              res.end(JSON.stringify({ success: false, error: data.detail || 'Fehler beim Abruf von Mollie', mollieData: data }));
            } else {
              res.end(JSON.stringify({
                success: true,
                paymentId: data.id,
                status: data.status,
                isPaid: data.status === 'paid',
                paidAt: data.paidAt || null,
                amount: data.amount?.value,
                method: data.method,
                description: data.description,
                metadata: data.metadata || {}
              }));
            }
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }
        next();
      });

      // 3. /api/mollie/refund
      server.middlewares.use('/api/mollie/refund', async (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { paymentId, amount, description } = JSON.parse(body);
              if (!paymentId) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Payment ID fehlt' }));
                return;
              }

              // Handle simulated or non-tr_ IDs cleanly
              if (!paymentId.startsWith('tr_')) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  refundId: `re_sim_${Date.now().toString(36)}`,
                  status: 'refunded',
                  amount: { currency: 'EUR', value: Number(amount || 0).toFixed(2) },
                  simulated: true
                }));
                return;
              }

              const apiKey = getMollieKey();
              if (!apiKey) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Mollie API-Schlüssel fehlt in der lokalen .env Datei (MOLLIE_API_KEY).' }));
                return;
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
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(refundPayload)
              });

              const data = await mollieRes.json();
              res.statusCode = mollieRes.status;
              res.setHeader('Content-Type', 'application/json');

              if (!mollieRes.ok) {
                res.end(JSON.stringify({ success: false, error: data.detail || 'Mollie Rückerstattungsfehler', mollieData: data }));
              } else {
                res.end(JSON.stringify({
                  success: true,
                  refundId: data.id,
                  status: data.status,
                  amount: data.amount,
                  createdAt: data.createdAt
                }));
              }
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}
