// routes/books.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Get all books
router.get('/', async (req, res) => {
    try {
        const books = await Book.findAll();
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search books
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        const books = await Book.search(q);
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single book
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (book) {
            res.json(book);
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new book
router.post('/', async (req, res) => {
    try {
        const { isbn, title, author, publisher, category, publication_year, copies_available, total_copies } = req.body;
        
        // Validate required fields
        if (!isbn || !title || !author || !category) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const bookId = await Book.create({
            isbn,
            title,
            author,
            publisher,
            category,
            publication_year,
            copies_available: copies_available || 1,
            total_copies: total_copies || 1
        });

        res.status(201).json({ id: bookId, message: 'Book created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a book
router.put('/:id', async (req, res) => {
    try {
        const { isbn, title, author, publisher, category, publication_year, copies_available, total_copies } = req.body;
        
        // Validate required fields
        if (!isbn || !title || !author || !category) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const success = await Book.update(req.params.id, {
            isbn,
            title,
            author,
            publisher,
            category,
            publication_year,
            copies_available,
            total_copies
        });

        if (success) {
            res.json({ message: 'Book updated successfully' });
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a book
router.delete('/:id', async (req, res) => {
    try {
        const success = await Book.delete(req.params.id);
        if (success) {
            res.json({ message: 'Book deleted successfully' });
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
