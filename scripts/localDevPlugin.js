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
    }
  };
}
