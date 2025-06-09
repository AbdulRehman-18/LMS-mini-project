// routes/stats.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/stats - Fetch dashboard statistics
router.get('/', async (req, res) => {
    try {
        const [results] = await pool.query(`
            SELECT
                COALESCE((SELECT COUNT(*) FROM members WHERE membership_status = 'Active'), 0) AS total_members,
                COALESCE((SELECT COUNT(*) FROM members WHERE membership_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)), 0) AS new_members_this_week,
                COALESCE((SELECT COUNT(*) FROM books), 0) AS total_books,
                COALESCE((SELECT COUNT(DISTINCT category) FROM books), 0) AS categories_count,
                COALESCE((SELECT COUNT(*) FROM book_loans WHERE status IN ('Borrowed', 'Overdue')), 0) AS active_loans,
                COALESCE((SELECT COUNT(*) FROM book_loans WHERE status = 'Overdue'), 0) AS overdue_loans,
                COALESCE((SELECT SUM(copies_available) FROM books), 0) AS available_books,
                COALESCE((SELECT COUNT(*) FROM book_loans WHERE status = 'Returned'), 0) AS returned_count,
                COALESCE((SELECT COUNT(*) FROM book_loans WHERE status = 'Borrowed'), 0) AS borrowed_count,
                COALESCE((SELECT COUNT(*) FROM book_loans WHERE status = 'Overdue'), 0) AS overdue_count
        `);

        const stats = results[0];

        res.json({
            totalMembers: stats.total_members,
            newMembersThisWeek: stats.new_members_this_week,
            totalBooks: stats.total_books,
            categoriesCount: stats.categories_count,
            activeLoans: stats.active_loans,
            overdueLoans: stats.overdue_loans,
            availableBooks: stats.available_books,
            returnedCount: stats.returned_count,
            borrowedCount: stats.borrowed_count,
            overdueCount: stats.overdue_count
        });
    } catch (error) {
        console.error('Stats query error:', error);
        res.status(500).json({ message: 'Error fetching library statistics' });
    }
});

module.exports = router;
