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

// Advanced search with filters
router.get('/advanced-search', async (req, res) => {
    try {
        const filters = {
            search: req.query.search,
            category: req.query.category,
            author: req.query.author,
            publisher: req.query.publisher,
            yearFrom: req.query.yearFrom,
            yearTo: req.query.yearTo,
            availability: req.query.availability,
            sortBy: req.query.sortBy || 'title',
            sortOrder: req.query.sortOrder || 'asc',
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const books = await Book.advancedSearch(filters);
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get search suggestions
router.get('/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ titles: [], authors: [], categories: [] });
        }
        const suggestions = await Book.getSearchSuggestions(q);
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get filter options
router.get('/filter-options', async (req, res) => {
    try {
        const [categories, authors, publishers, yearRange] = await Promise.all([
            Book.getCategories(),
            Book.getAuthors(),
            Book.getPublishers(),
            Book.getPublicationYearRange()
        ]);

        res.json({
            categories,
            authors,
            publishers,
            yearRange
        });
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
        console.log("book added to database!");
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
