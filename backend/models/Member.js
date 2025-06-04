// models/Member.js
const pool = require('../config/database');

class Member {
    static async findAll() {
        try {
            const [rows] = await pool.query('SELECT * FROM members');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const [rows] = await pool.query('SELECT * FROM members WHERE email = ?', [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async create(memberData) {
        try {
            const [result] = await pool.query(
                'INSERT INTO members (name, phone, email, address, membership_date, membership_status) VALUES (?, ?, ?, ?, ?, ?)',
                [memberData.name, memberData.phone, memberData.email, memberData.address, memberData.membership_date || new Date(), memberData.membership_status || 'Active']
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, memberData) {
        try {
            const [result] = await pool.query(
                'UPDATE members SET name = ?, phone = ?, email = ?, address = ?, membership_status = ? WHERE id = ?',
                [memberData.name, memberData.phone, memberData.email, memberData.address, memberData.membership_status, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.query('DELETE FROM members WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async updateMembershipStatus(id, status) {
        try {
            const [result] = await pool.query(
                'UPDATE members SET membership_status = ? WHERE id = ?',
                [status, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async search(query) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM members WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?',
                [`%${query}%`, `%${query}%`, `%${query}%`]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Member;
