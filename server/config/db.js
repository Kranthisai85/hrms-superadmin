import mysql from 'mysql2';

const pool = mysql.createPool({
  host: '82.112.236.201',
  user: 'root',
  password: 'jiwika@199',
  database: 'hrm_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool.promise(); // Use `export default` for ES modules
