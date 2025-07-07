// models/User.js
const db = require('../config/db');

class User {
    static async create({ name, email, password }) {
      const [result] = await db.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, password]
      );
      return result.insertId; // Return the ID of the newly created user
    }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }
}

module.exports = User;