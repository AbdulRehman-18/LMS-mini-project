// routes/loans.js
const express = require('express');
const router = express.Router();
const BookLoan = require('../models/BookLoan');
const Book = require('../models/Book');
const Member = require('../models/Member');

// Get all loans
router.get('/', async (req, res) => {
    try {
        const loans = await BookLoan.findAll();
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get overdue loans
router.get('/overdue', async (req, res) => {
    try {
        const overdueLoans = await BookLoan.findOverdueLoans();
        res.json(overdueLoans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get loans by member
router.get('/member/:memberId', async (req, res) => {
    try {
        const loans = await BookLoan.findByMemberId(req.params.memberId);
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single loan
router.get('/:id', async (req, res) => {
    try {
        const loan = await BookLoan.findById(req.params.id);
        if (loan) {
            res.json(loan);
        } else {
            res.status(404).json({ message: 'Loan not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new loan
router.post('/', async (req, res) => {
    try {
        const { book_id, member_id, borrow_date, due_date } = req.body;
        
        // Validate required fields
        if (!book_id || !member_id || !borrow_date || !due_date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate member exists and is active
        const member = await Member.findById(member_id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        if (member.membership_status !== 'Active') {
            return res.status(400).json({ message: 'Member is not active' });
        }

        // Create the loan
        const loanId = await BookLoan.create({
            book_id,
            member_id,
            borrow_date,
            due_date
        });

        res.status(201).json({ id: loanId, message: 'Loan created successfully' });
    } catch (error) {
        if (error.message === 'Book is not available for loan') {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
});

// Return a book
router.post('/:id/return', async (req, res) => {
    try {
        const success = await BookLoan.returnBook(req.params.id);
        if (success) {
            res.json({ message: 'Book returned successfully' });
        } else {
            res.status(404).json({ message: 'Loan not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update fine amount
router.patch('/:id/fine', async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (amount === undefined || amount < 0) {
            return res.status(400).json({ message: 'Invalid fine amount' });
        }

        const success = await BookLoan.updateFineAmount(req.params.id, amount);
        if (success) {
            res.json({ message: 'Fine amount updated successfully' });
        } else {
            res.status(404).json({ message: 'Loan not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
