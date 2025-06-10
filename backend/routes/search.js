// routes/search.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Member = require('../models/Member');
const SearchUtils = require('../utils/searchUtils');

// Global search endpoint
router.get('/global', async (req, res) => {
    try {
        const { q, userId } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({
                books: [],
                members: [],
                suggestions: []
            });
        }

        // Save search history if user is logged in
        if (userId) {
            await SearchUtils.saveSearchHistory(userId, q, 'global');
        }

        // Search books
        const books = await Book.search(q);
        
        // Search members (limit results for privacy)
        const members = await Member.search(q);
        
        // Get suggestions
        const suggestions = await Book.getSearchSuggestions(q);

        res.json({
            books: books.slice(0, 10), // Limit to 10 results
            members: members.slice(0, 5), // Limit to 5 results
            suggestions,
            query: q
        });
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
});

// Advanced book search
router.get('/books/advanced', async (req, res) => {
    try {
        const { userId } = req.query;
        const filters = SearchUtils.validateSearchFilters(req.query);
        
        // Save search history if user is logged in and there's a search term
        if (userId && filters.search) {
            await SearchUtils.saveSearchHistory(userId, filters.search, 'books');
        }

        const books = await Book.advancedSearch(filters);
        
        res.json({
            books,
            filters: filters,
            total: books.length
        });
    } catch (error) {
        console.error('Advanced book search error:', error);
        res.status(500).json({ message: 'Advanced search failed' });
    }
});

// Get search history for a user
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;
        
        const history = await SearchUtils.getSearchHistory(userId, limit);
        res.json(history);
    } catch (error) {
        console.error('Search history error:', error);
        res.status(500).json({ message: 'Failed to get search history' });
    }
});

// Get popular searches
router.get('/popular', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const popular = await SearchUtils.getPopularSearches(limit);
        res.json(popular);
    } catch (error) {
        console.error('Popular searches error:', error);
        res.status(500).json({ message: 'Failed to get popular searches' });
    }
});

// Get search analytics (admin only)
router.get('/analytics', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const analytics = await SearchUtils.getSearchAnalytics(days);
        res.json(analytics);
    } catch (error) {
        console.error('Search analytics error:', error);
        res.status(500).json({ message: 'Failed to get search analytics' });
    }
});

// Autocomplete endpoint
router.get('/autocomplete', async (req, res) => {
    try {
        const { q, type = 'all' } = req.query;
        
        if (!q || q.length < 2) {
            return res.json([]);
        }

        let suggestions = [];
        
        if (type === 'all' || type === 'books') {
            const bookSuggestions = await Book.getSearchSuggestions(q);
            suggestions.push(
                ...bookSuggestions.titles.map(title => ({ text: title, type: 'title' })),
                ...bookSuggestions.authors.map(author => ({ text: author, type: 'author' })),
                ...bookSuggestions.categories.map(category => ({ text: category, type: 'category' }))
            );
        }

        // Remove duplicates and limit results
        const uniqueSuggestions = suggestions
            .filter((item, index, self) => 
                index === self.findIndex(t => t.text === item.text && t.type === item.type)
            )
            .slice(0, 10);

        res.json(uniqueSuggestions);
    } catch (error) {
        console.error('Autocomplete error:', error);
        res.status(500).json({ message: 'Autocomplete failed' });
    }
});

module.exports = router;
