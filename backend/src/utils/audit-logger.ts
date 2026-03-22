/**
 * Audit Logger — registra eventos de seguridad de forma estructurada.
 * Todos los eventos quedan en stdout con nivel, timestamp, y contexto.
 * En producción, conecta stdout a Sentry / Datadog / ELK para persistencia.
 */

type AuditEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'register'
  | 'google_login'
  | 'password_change'
  | 'password_reset'
  | 'unauthorized_access'
  | 'token_invalid'
  | 'account_suspended'
  | 'tenant_suspended'
  | 'webhook_invalid_signature'
  | 'rate_limit_exceeded'
  | 'admin_action'
  | 'user_created'
  | 'user_deleted'
  | 'role_changed';

interface AuditEvent {
  event: AuditEventType;
  userId?: string;
  tenantId?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
}

function auditLog(level: 'info' | 'warn' | 'error', payload: AuditEvent) {
  // Never log secrets, tokens or passwords — only identifiers and metadata
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    audit: true,
    ...payload,
  };
  // Use structured JSON so log collectors can parse fields
  console[level](JSON.stringify(entry));
}

export const audit = {
  loginSuccess: (userId: string, tenantId: string | null, ip?: string) =>
    auditLog('info', { event: 'login_success', userId, tenantId: tenantId ?? undefined, ip }),

  loginFailure: (email: string, ip?: string, reason?: string) =>
    auditLog('warn', { event: 'login_failure', meta: { email, reason }, ip }),

  logout: (userId: string, ip?: string) =>
    auditLog('info', { event: 'logout', userId, ip }),

  register: (userId: string, tenantId: string | null, role: string, ip?: string) =>
    auditLog('info', { event: 'register', userId, tenantId: tenantId ?? undefined, meta: { role }, ip }),

  googleLogin: (userId: string, tenantId: string | null, ip?: string) =>
    auditLog('info', { event: 'google_login', userId, tenantId: tenantId ?? undefined, ip }),

  passwordChange: (userId: string, ip?: string) =>
    auditLog('info', { event: 'password_change', userId, ip }),

  unauthorizedAccess: (path: string, ip?: string, userId?: string) =>
    auditLog('warn', { event: 'unauthorized_access', userId, meta: { path }, ip }),

  tokenInvalid: (ip?: string) =>
    auditLog('warn', { event: 'token_invalid', ip }),

  accountSuspended: (userId: string, ip?: string) =>
    auditLog('warn', { event: 'account_suspended', userId, ip }),

  tenantSuspended: (tenantId: string, userId: string, ip?: string) =>
    auditLog('warn', { event: 'tenant_suspended', tenantId, userId, ip }),

  webhookInvalidSignature: (provider: string, ip?: string) =>
    auditLog('warn', { event: 'webhook_invalid_signature', meta: { provider }, ip }),

  adminAction: (userId: string, action: string, targetId?: string, meta?: Record<string, unknown>) =>
    auditLog('info', { event: 'admin_action', userId, meta: { action, targetId, ...meta } }),

  userCreated: (adminId: string, newUserId: string, role: string) =>
    auditLog('info', { event: 'user_created', userId: adminId, meta: { newUserId, role } }),

  userDeleted: (adminId: string, deletedUserId: string) =>
    auditLog('warn', { event: 'user_deleted', userId: adminId, meta: { deletedUserId } }),
};
