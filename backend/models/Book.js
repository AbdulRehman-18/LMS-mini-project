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
    }

    static async search(query) {
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
}

module.exports = Book;
