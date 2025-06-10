// utils/searchUtils.js
const pool = require('../config/database');

class SearchUtils {
    // Save search history for a user (if they're logged in)
    static async saveSearchHistory(userId, searchQuery, searchType = 'general') {
        try {
            if (!userId || !searchQuery) return;
            
            await pool.query(
                'INSERT INTO search_history (user_id, search_query, search_type, created_at) VALUES (?, ?, ?, NOW())',
                [userId, searchQuery, searchType]
            );
        } catch (error) {
            console.error('Error saving search history:', error);
            // Don't throw error as this is not critical functionality
        }
    }

    // Get search history for a user
    static async getSearchHistory(userId, limit = 10) {
        try {
            const [rows] = await pool.query(
                'SELECT search_query, search_type, created_at FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
                [userId, limit]
            );
            return rows;
        } catch (error) {
            console.error('Error getting search history:', error);
            return [];
        }
    }

    // Get popular search terms
    static async getPopularSearches(limit = 10) {
        try {
            const [rows] = await pool.query(
                'SELECT search_query, COUNT(*) as search_count FROM search_history WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY search_query ORDER BY search_count DESC LIMIT ?',
                [limit]
            );
            return rows;
        } catch (error) {
            console.error('Error getting popular searches:', error);
            return [];
        }
    }

    // Clean old search history (keep only last 100 searches per user)
    static async cleanSearchHistory() {
        try {
            await pool.query(`
                DELETE sh1 FROM search_history sh1
                INNER JOIN (
                    SELECT user_id, 
                           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
                    FROM search_history
                ) sh2 ON sh1.user_id = sh2.user_id
                WHERE sh2.rn > 100
            `);
        } catch (error) {
            console.error('Error cleaning search history:', error);
        }
    }

    // Format search results with highlights
    static highlightSearchTerms(text, searchTerms) {
        if (!text || !searchTerms) return text;
        
        const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
        let highlightedText = text;
        
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }

    // Parse and validate search filters
    static validateSearchFilters(filters) {
        const validatedFilters = {};
        
        // Text search
        if (filters.search && typeof filters.search === 'string') {
            validatedFilters.search = filters.search.trim();
        }
        
        // Category
        if (filters.category && typeof filters.category === 'string') {
            validatedFilters.category = filters.category.trim();
        }
        
        // Author
        if (filters.author && typeof filters.author === 'string') {
            validatedFilters.author = filters.author.trim();
        }
        
        // Publisher
        if (filters.publisher && typeof filters.publisher === 'string') {
            validatedFilters.publisher = filters.publisher.trim();
        }
        
        // Year range
        if (filters.yearFrom && !isNaN(filters.yearFrom)) {
            validatedFilters.yearFrom = parseInt(filters.yearFrom);
        }
        if (filters.yearTo && !isNaN(filters.yearTo)) {
            validatedFilters.yearTo = parseInt(filters.yearTo);
        }
        
        // Availability
        if (filters.availability && ['available', 'borrowed', 'all'].includes(filters.availability)) {
            validatedFilters.availability = filters.availability;
        }
        
        // Sort options
        const validSortFields = ['title', 'author', 'publication_year', 'category', 'copies_available'];
        if (filters.sortBy && validSortFields.includes(filters.sortBy)) {
            validatedFilters.sortBy = filters.sortBy;
        }
        
        if (filters.sortOrder && ['asc', 'desc'].includes(filters.sortOrder.toLowerCase())) {
            validatedFilters.sortOrder = filters.sortOrder.toLowerCase();
        }
        
        // Pagination
        if (filters.limit && !isNaN(filters.limit)) {
            validatedFilters.limit = Math.min(parseInt(filters.limit), 100); // Max 100 results
        }
        if (filters.offset && !isNaN(filters.offset)) {
            validatedFilters.offset = parseInt(filters.offset);
        }
        
        return validatedFilters;
    }

    // Create search analytics
    static async getSearchAnalytics(days = 30) {
        try {
            const [topSearches] = await pool.query(`
                SELECT search_query, COUNT(*) as count
                FROM search_history 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY search_query 
                ORDER BY count DESC 
                LIMIT 10
            `, [days]);

            const [searchTrends] = await pool.query(`
                SELECT DATE(created_at) as date, COUNT(*) as searches
                FROM search_history 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at) 
                ORDER BY date DESC
            `, [days]);

            const [noResultsSearches] = await pool.query(`
                SELECT search_query, COUNT(*) as count
                FROM search_history sh
                LEFT JOIN books b ON (
                    b.title LIKE CONCAT('%', sh.search_query, '%') OR
                    b.author LIKE CONCAT('%', sh.search_query, '%') OR
                    b.category LIKE CONCAT('%', sh.search_query, '%')
                )
                WHERE sh.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                AND b.id IS NULL
                GROUP BY sh.search_query 
                ORDER BY count DESC 
                LIMIT 5
            `, [days]);

            return {
                topSearches,
                searchTrends,
                noResultsSearches
            };
        } catch (error) {
            console.error('Error getting search analytics:', error);
            return {
                topSearches: [],
                searchTrends: [],
                noResultsSearches: []
            };
        }
    }
}

module.exports = SearchUtils;
