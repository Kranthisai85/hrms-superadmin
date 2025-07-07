import db from '../config/db.js';

const RoleModel = {
    findAll: async () => {
        try {
            const [rows] = await db.query('SELECT * FROM roles');
            return rows;
        } catch (err) {
            throw err;
        }
    },
     findById: async (id) => {
         try {
             const [rows] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
            return rows[0];
        } catch (err) {
            throw err;
        }
    },
    create: async (role) => {
        try {
            const [result] = await db.query('INSERT INTO roles SET ?', role);
            return result.insertId;
        } catch (err) {
            throw err;
        }
    },
    update: async (id, role) => {
        try {
            const [result] = await db.query('UPDATE roles SET ? WHERE id = ?', [role, id]);
            return result.affectedRows;
        } catch (err) {
            throw err;
        }
    },
    delete: async (id) => {
        try {
            const [result] = await db.query('DELETE FROM roles WHERE id = ?', [id]);
            return result.affectedRows;
        } catch (err) {
            throw err;
        }
    },
};

export default RoleModel;