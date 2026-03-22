/**
 * Migración de cifrado AES-256.
 * Cifra los campos sensibles de todos los usuarios que aún tienen datos en texto plano.
 * Es idempotente: detecta valores ya cifrados (patrón iv:hex) y los omite.
 * Se ejecuta automáticamente al iniciar el servidor.
 */
import { encrypt, isEncrypted } from './crypto';
import { RowDataPacket } from 'mysql2';

interface UserSensitiveRow extends RowDataPacket {
  id: string;
  phone: string | null;
  cedula: string | null;
  department: string | null;
  municipality: string | null;
  address: string | null;
  neighborhood: string | null;
  data_encrypted: number;
}

export async function runEncryptionMigration(pool: any): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT id, phone, cedula, department, municipality, address, neighborhood, data_encrypted
       FROM users
       WHERE data_encrypted = 0
         AND (phone IS NOT NULL OR cedula IS NOT NULL OR address IS NOT NULL)`
    ) as [UserSensitiveRow[], any];

    if (!rows || rows.length === 0) return;

    console.log(`[Migration] Cifrando datos sensibles de ${rows.length} usuario(s)...`);

    for (const user of rows) {
      const updates: string[] = [];
      const values: (string | null)[] = [];

      const fields: Array<{ key: keyof UserSensitiveRow; col: string }> = [
        { key: 'phone', col: 'phone' },
        { key: 'cedula', col: 'cedula' },
        { key: 'department', col: 'department' },
        { key: 'municipality', col: 'municipality' },
        { key: 'address', col: 'address' },
        { key: 'neighborhood', col: 'neighborhood' },
      ];

      for (const { key, col } of fields) {
        const val = user[key] as string | null;
        if (val && !isEncrypted(val)) {
          updates.push(`${col} = ?`);
          values.push(encrypt(val));
        }
      }

      updates.push('data_encrypted = 1');
      values.push(user.id);

      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    console.log(`[Migration] Cifrado completado para ${rows.length} usuario(s).`);
  } catch (err) {
    // Log but don't crash the server — plaintext fields still decrypt correctly
    console.error('[Migration] Error en migración de cifrado:', err);
  }
}
