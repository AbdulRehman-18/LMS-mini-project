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

    static async findByEmailWithPassword(email) {
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

    static async createWithPassword(memberData) {
        try {
            const [result] = await pool.query(
                'INSERT INTO members (name, phone, email, address, membership_type, membership_date, membership_status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    memberData.name, 
                    memberData.phone, 
                    memberData.email, 
                    memberData.address, 
                    memberData.membershipType || 'Standard',
                    memberData.membership_date || new Date(), 
                    memberData.membership_status || 'Active',
                    memberData.password || 'password123'
                ]
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

    static async updatePassword(id, password) {
        try {
            const [result] = await pool.query(
                'UPDATE members SET password = ? WHERE id = ?',
                [password, id]
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
    }    static async search(query) {
        try {
            const [rows] = await pool.query(
                'SELECT id, name, email, phone, membership_type, membership_status FROM members WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?',
                [`%${query}%`, `%${query}%`, `%${query}%`]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async advancedSearch(filters = {}) {
        try {
            let query = 'SELECT id, name, email, phone, membership_type, membership_status, membership_date FROM members WHERE 1=1';
            const params = [];

            // Text search
            if (filters.search) {
                query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            // Membership type filter
            if (filters.membershipType) {
                query += ' AND membership_type = ?';
                params.push(filters.membershipType);
            }

            // Status filter
            if (filters.status) {
                query += ' AND membership_status = ?';
                params.push(filters.status);
            }

            // Date range filter
            if (filters.membershipFrom) {
                query += ' AND membership_date >= ?';
                params.push(filters.membershipFrom);
            }
            if (filters.membershipTo) {
                query += ' AND membership_date <= ?';
                params.push(filters.membershipTo);
            }

            // Sort options
            const validSortFields = ['name', 'email', 'membership_date', 'membership_type'];
            const sortField = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'name';
            const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
            query += ` ORDER BY ${sortField} ${sortOrder}`;

            // Pagination
            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(filters.limit));
                
                if (filters.offset) {
                    query += ' OFFSET ?';
                    params.push(parseInt(filters.offset));
                }
            }

            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Member;
