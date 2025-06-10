-- Add search history table and indexes for better search performance
-- This file should be run to add search functionality support

-- Create search history table
CREATE TABLE IF NOT EXISTS search_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    search_query VARCHAR(255) NOT NULL,
    search_type ENUM('general', 'books', 'members', 'loans') DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_search_query (search_query),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Add indexes to books table for better search performance (ignore errors if they exist)
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_publisher ON books(publisher);
CREATE INDEX idx_books_publication_year ON books(publication_year);
CREATE INDEX idx_books_availability ON books(copies_available);

-- Add full-text search indexes for better text search
ALTER TABLE books ADD FULLTEXT(title, author, category, publisher);

-- Add indexes to members table for search
CREATE INDEX idx_members_name ON members(name);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_phone ON members(phone);

-- Add indexes to book_loans table for search
CREATE INDEX idx_loans_borrow_date ON book_loans(borrow_date);
CREATE INDEX idx_loans_due_date ON book_loans(due_date);
CREATE INDEX idx_loans_status ON book_loans(status);

-- Create a view for popular books
CREATE OR REPLACE VIEW popular_books AS
SELECT 
    b.id,
    b.title,
    b.author,
    b.category,
    b.copies_available,
    b.total_copies,
    COUNT(bl.id) as loan_count
FROM books b
LEFT JOIN book_loans bl ON b.id = bl.book_id
GROUP BY b.id, b.title, b.author, b.category, b.copies_available, b.total_copies
ORDER BY loan_count DESC;
