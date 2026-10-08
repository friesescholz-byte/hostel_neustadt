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

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { password } = JSON.parse(body);
              let envPass = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;
              if (!envPass) {
                const envPath = path.join(rootDir, '.env');
                if (fs.existsSync(envPath)) {
                  const content = fs.readFileSync(envPath, 'utf-8');
                  const match = content.match(/ADMIN_PASSWORD\s*=\s*(.*)/);
                  if (match) envPass = match[1].trim();
                }
              }
              const validPassword = envPass || 'Hostel#Neustadt!2026';

              if (password && password === validPassword) {
                const token = Buffer.from(`hostel_auth_${Date.now()}`).toString('base64');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, token }));
              } else {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Falsches Passwort. Bitte überprüfen Sie Ihre Eingabe.' }));
              }
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
        let key = process.env.MOLLIE_API_KEY || process.env.VITE_MOLLIE_API_KEY;
        if (!key) {
          const envPath = path.join(rootDir, '.env');
          if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            const match = content.match(/MOLLIE_API_KEY\s*=\s*(.*)/);
            if (match) key = match[1].trim();
          }
        }
        return key || 'test_Bf8wMeDwtf9jmmqSBEdqPDMADEd5eh';
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
