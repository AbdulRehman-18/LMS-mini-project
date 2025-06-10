// routes/member.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get member profile data
router.get('/profile/:memberId', async (req, res) => {
    try {
        const { memberId } = req.params;
        
        const [memberRows] = await pool.query(
            'SELECT id, name, email, phone, address, membership_type, membership_date, membership_status FROM members WHERE id = ?',
            [memberId]
        );
        
        if (memberRows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        res.json(memberRows[0]);
    } catch (error) {
        console.error('Error fetching member profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get member's borrowed books
router.get('/borrowed-books/:memberId', async (req, res) => {
    try {
        const { memberId } = req.params;
        
        const [rows] = await pool.query(`
            SELECT 
                l.id as loan_id,
                b.id as book_id,
                b.title,
                b.author,
                b.isbn,
                l.borrow_date as loan_date,
                l.due_date,
                l.return_date,
                l.status,
                CASE 
                    WHEN l.due_date < CURDATE() AND l.return_date IS NULL THEN 'Overdue'
                    WHEN l.return_date IS NULL THEN 'Active'
                    ELSE 'Returned'
                END as actual_status
            FROM book_loans l
            JOIN books b ON l.book_id = b.id
            WHERE l.member_id = ? AND l.return_date IS NULL
            ORDER BY l.borrow_date DESC
        `, [memberId]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching borrowed books:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get available books (for browsing)
router.get('/available-books', async (req, res) => {
    try {
        const { search = '', page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                b.id,
                b.title,
                b.author,
                b.isbn,
                b.publication_year,
                b.category,
                b.total_copies,
                b.available_copies
            FROM books b
            WHERE b.available_copies > 0
        `;
        
        const queryParams = [];
        
        if (search) {
            query += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.category LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY b.title LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const [rows] = await pool.query(query, queryParams);
        
        res.json({
            books: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching available books:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get member's loan history
router.get('/loan-history/:memberId', async (req, res) => {
    try {
        const { memberId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const [rows] = await pool.query(`
            SELECT 
                l.id as loan_id,
                b.id as book_id,
                b.title,
                b.author,
                b.isbn,
                l.borrow_date as loan_date,
                l.due_date,
                l.return_date,
                CASE 
                    WHEN l.return_date IS NULL THEN 'Active'
                    ELSE 'Returned'
                END as status,
                DATEDIFF(COALESCE(l.return_date, CURDATE()), l.due_date) as days_overdue
            FROM book_loans l
            JOIN books b ON l.book_id = b.id
            WHERE l.member_id = ?
            ORDER BY l.borrow_date DESC
            LIMIT ? OFFSET ?
        `, [memberId, parseInt(limit), parseInt(offset)]);
        
        // Get total count
        const [countRows] = await pool.query(
            'SELECT COUNT(*) as total FROM book_loans WHERE member_id = ?',
            [memberId]
        );
        const total = countRows[0].total;
        
        res.json({
            loans: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching loan history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
