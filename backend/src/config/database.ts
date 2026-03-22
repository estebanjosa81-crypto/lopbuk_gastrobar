import mysql from 'mysql2/promise';
import { config } from './env';

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexion a MySQL establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error conectando a MySQL:', error);
    return false;
  }
};

export default pool;
