import mysql from 'mysql2';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'jiwika@199',
  database: 'pace_hrm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool.promise(); // Use `export default` for ES modules