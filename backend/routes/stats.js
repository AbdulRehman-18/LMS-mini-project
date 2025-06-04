// routes/stats.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get system stats for dashboard
router.get('/', async (req, res) => {
    try {
        const [results] = await pool.query(`
            SELECT
                COALESCE((SELECT COUNT(*) FROM members), 0) AS totalMembers,
                COALESCE((SELECT COUNT(*) FROM members WHERE membership_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)), 0) AS newMembers,
                COALESCE((SELECT COUNT(*) FROM books), 0) AS totalBooks,
                COALESCE((SELECT COUNT(DISTINCT category) FROM books), 0) AS categories,
                COALESCE((SELECT COUNT(*) FROM book_loans WHERE return_date IS NULL), 0) AS activeLoans,
                COALESCE((SELECT COUNT(*) FROM book_loans WHERE return_date IS NULL AND due_date < CURDATE()), 0) AS overdueLoans,
                COALESCE((SELECT SUM(copies_available) FROM books), 0) AS availableBooks,
                COALESCE((SELECT COUNT(*) FROM book_loans WHERE DATE(return_date) = CURDATE()), 0) AS returnedToday,
                COALESCE((SELECT COUNT(*) FROM book_loans WHERE DATE(borrow_date) = CURDATE()), 0) AS borrowedToday,
                COALESCE((SELECT COUNT(*) FROM book_loans WHERE return_date IS NULL AND due_date < CURDATE()), 0) AS overdueTotal
        `);

        const stats = results[0]; // results is an array with one row

        res.json({
            totalMembers: stats.totalMembers,
            newMembersThisWeek: stats.newMembers,
            totalBooks: stats.totalBooks,
            categories: stats.categories,
            activeLoans: stats.activeLoans,
            overdueLoans: stats.overdueLoans,
            availableBooks: stats.availableBooks,
            returnedCount: stats.returnedToday,
            borrowedCount: stats.borrowedToday,
            overdueCount: stats.overdueTotal
        });
    } catch (error) {
        console.error('Stats query error:', error);
        res.status(500).json({ message: 'Error fetching library statistics' });
    }
});

module.exports = router;
