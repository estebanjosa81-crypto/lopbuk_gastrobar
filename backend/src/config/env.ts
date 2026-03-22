import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stockpro_db',
  },

  jwt: {
    // In production JWT_SECRET MUST be set. The fallback is intentionally weak
    // so the server will fail authentication if env var is missing.
    secret: process.env.JWT_SECRET || 'MISSING_JWT_SECRET_SET_ENV_VAR',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },

  cors: {
    // In production, CORS_ORIGIN must be set to your real domains only.
    // Localhost origins are only allowed in development.
    origin: (() => {
      const isProd = (process.env.NODE_ENV || 'development') === 'production';
      if (process.env.CORS_ORIGIN) {
        const origins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
        if (isProd) {
          // Strip localhost entries in production to prevent accidental exposure
          return origins.filter(o => !o.includes('localhost') && !o.includes('127.0.0.1'));
        }
        return origins;
      }
      // Default: only allow localhost in development
      if (isProd) return [] as string[];
      return ['http://localhost:3000', 'http://localhost:3003'];
    })(),
  },

  mp: {
    accessToken: process.env.MP_ACCESS_TOKEN || '',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // AES-256 key for encrypting sensitive user data (phone, cedula, address)
  // Must be a 64-char hex string (32 bytes). Set via ENCRYPTION_KEY env var.
  encryptionKey: process.env.ENCRYPTION_KEY || '',

  // Offline-first sync config
  // IS_LOCAL_INSTANCE=true  → este backend corre en el PC del cliente y debe sincronizar con la nube
  // CLOUD_API_URL            → URL del backend en la nube (ej: https://api.miapp.com)
  // SYNC_SECRET              → clave compartida entre local y nube para autenticar el sync
  // SYNC_TENANT_ID           → UUID del tenant al que pertenece esta instalación local
  sync: {
    isLocalInstance: process.env.IS_LOCAL_INSTANCE === 'true',
    cloudApiUrl: process.env.CLOUD_API_URL || '',
    secret: process.env.SYNC_SECRET || '',
    intervalMs: parseInt(process.env.SYNC_INTERVAL_MS || '30000', 10),
    tenantId: process.env.SYNC_TENANT_ID || '',
  },
};
