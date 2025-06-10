// models/Book.js
const pool = require('../config/database');

class Book {
    static async findAll() {
        try {
            const [rows] = await pool.query('SELECT * FROM books');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByIsbn(isbn) {
        try {
            const [rows] = await pool.query('SELECT * FROM books WHERE isbn = ?', [isbn]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async create(bookData) {
        try {
            const [result] = await pool.query(
                'INSERT INTO books (isbn, title, author, publisher, category, publication_year, copies_available, total_copies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [bookData.isbn, bookData.title, bookData.author, bookData.publisher, bookData.category, bookData.publication_year, bookData.copies_available, bookData.total_copies]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, bookData) {
        try {
            const [result] = await pool.query(
                'UPDATE books SET isbn = ?, title = ?, author = ?, publisher = ?, category = ?, publication_year = ?, copies_available = ?, total_copies = ? WHERE id = ?',
                [bookData.isbn, bookData.title, bookData.author, bookData.publisher, bookData.category, bookData.publication_year, bookData.copies_available, bookData.total_copies, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.query('DELETE FROM books WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async updateCopiesAvailable(id, increment) {
        try {
            const [result] = await pool.query(
                'UPDATE books SET copies_available = copies_available + ? WHERE id = ?',
                [increment, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }    static async search(query) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? OR category LIKE ?',
                [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async advancedSearch(filters = {}) {
        try {
            let query = 'SELECT * FROM books WHERE 1=1';
            const params = [];

            // Text search
            if (filters.search) {
                query += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR category LIKE ? OR publisher LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
            }

            // Category filter
            if (filters.category) {
                query += ' AND category = ?';
                params.push(filters.category);
            }

            // Author filter
            if (filters.author) {
                query += ' AND author LIKE ?';
                params.push(`%${filters.author}%`);
            }

            // Publication year range
            if (filters.yearFrom) {
                query += ' AND publication_year >= ?';
                params.push(filters.yearFrom);
            }
            if (filters.yearTo) {
                query += ' AND publication_year <= ?';
                params.push(filters.yearTo);
            }

            // Availability filter
            if (filters.availability) {
                if (filters.availability === 'available') {
                    query += ' AND copies_available > 0';
                } else if (filters.availability === 'borrowed') {
                    query += ' AND copies_available = 0';
                }
            }

            // Publisher filter
            if (filters.publisher) {
                query += ' AND publisher LIKE ?';
                params.push(`%${filters.publisher}%`);
            }

            // Sort options
            const validSortFields = ['title', 'author', 'publication_year', 'category', 'copies_available'];
            const sortField = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'title';
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

    static async getSearchSuggestions(query) {
        try {
            const [titles] = await pool.query(
                'SELECT DISTINCT title FROM books WHERE title LIKE ? LIMIT 5',
                [`%${query}%`]
            );
            const [authors] = await pool.query(
                'SELECT DISTINCT author FROM books WHERE author LIKE ? LIMIT 5',
                [`%${query}%`]
            );
            const [categories] = await pool.query(
                'SELECT DISTINCT category FROM books WHERE category LIKE ? LIMIT 5',
                [`%${query}%`]
            );

            return {
                titles: titles.map(row => row.title),
                authors: authors.map(row => row.author),
                categories: categories.map(row => row.category)
            };
        } catch (error) {
            throw error;
        }
    }

    static async getCategories() {
        try {
            const [rows] = await pool.query('SELECT DISTINCT category FROM books WHERE category IS NOT NULL ORDER BY category');
            return rows.map(row => row.category);
        } catch (error) {
            throw error;
        }
    }

    static async getAuthors() {
        try {
            const [rows] = await pool.query('SELECT DISTINCT author FROM books WHERE author IS NOT NULL ORDER BY author');
            return rows.map(row => row.author);
        } catch (error) {
            throw error;
        }
    }

    static async getPublishers() {
        try {
            const [rows] = await pool.query('SELECT DISTINCT publisher FROM books WHERE publisher IS NOT NULL ORDER BY publisher');
            return rows.map(row => row.publisher);
        } catch (error) {
            throw error;
        }
    }

    static async getPublicationYearRange() {
        try {
            const [rows] = await pool.query('SELECT MIN(publication_year) as min_year, MAX(publication_year) as max_year FROM books WHERE publication_year IS NOT NULL');
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Book;
