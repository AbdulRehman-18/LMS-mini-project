// models/BookLoan.js
const pool = require('../config/database');

class BookLoan {
    static async findAll() {
        try {
            const [rows] = await pool.query(`
                SELECT bl.*, b.title as book_title, b.isbn, m.name as member_name
                FROM book_loans bl
                JOIN books b ON bl.book_id = b.id
                JOIN members m ON bl.member_id = m.id
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query(`
                SELECT bl.*, b.title as book_title, b.isbn, m.name as member_name
                FROM book_loans bl
                JOIN books b ON bl.book_id = b.id
                JOIN members m ON bl.member_id = m.id
                WHERE bl.id = ?
            `, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByMemberId(memberId) {
        try {
            const [rows] = await pool.query(`
                SELECT bl.*, b.title as book_title, b.isbn
                FROM book_loans bl
                JOIN books b ON bl.book_id = b.id
                WHERE bl.member_id = ?
            `, [memberId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async create(loanData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Check if book is available
            const [bookRows] = await connection.query(
                'SELECT copies_available FROM books WHERE id = ? FOR UPDATE',
                [loanData.book_id]
            );

            if (!bookRows[0] || bookRows[0].copies_available <= 0) {
                throw new Error('Book is not available for loan');
            }

            // Create the loan record
            const [result] = await connection.query(
                'INSERT INTO book_loans (book_id, member_id, borrow_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
                [loanData.book_id, loanData.member_id, loanData.borrow_date, loanData.due_date, 'Borrowed']
            );

            // Update book availability
            await connection.query(
                'UPDATE books SET copies_available = copies_available - 1 WHERE id = ?',
                [loanData.book_id]
            );

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async returnBook(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Update loan status
            const [result] = await connection.query(
                'UPDATE book_loans SET status = ?, return_date = CURDATE() WHERE id = ?',
                ['Returned', id]
            );

            if (result.affectedRows === 0) {
                throw new Error('Loan record not found');
            }

            // Get book_id from loan
            const [loanRows] = await connection.query(
                'SELECT book_id FROM book_loans WHERE id = ?',
                [id]
            );

            // Update book availability
            await connection.query(
                'UPDATE books SET copies_available = copies_available + 1 WHERE id = ?',
                [loanRows[0].book_id]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async updateFineAmount(id, amount) {
        try {
            const [result] = await pool.query(
                'UPDATE book_loans SET fine_amount = ? WHERE id = ?',
                [amount, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async findOverdueLoans() {
        try {
            const [rows] = await pool.query(`
                SELECT bl.*, b.title as book_title, m.name as member_name
                FROM book_loans bl
                JOIN books b ON bl.book_id = b.id
                JOIN members m ON bl.member_id = m.id
                WHERE bl.due_date < CURDATE() AND bl.status = 'Borrowed'
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = BookLoan;
