-- Database Schema for Library Management System
-- Create database
CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

-- Drop existing tables in proper order (child first)
DROP TABLE IF EXISTS book_loans;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS members;

-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    membership_type ENUM('Standard', 'Premium', 'Scholar') NOT NULL DEFAULT 'Standard',
    membership_date DATE NOT NULL,
    membership_status ENUM('Active', 'Expired', 'Suspended') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_name (name),
    INDEX idx_membership_type (membership_type),
    INDEX idx_membership_status (membership_status)
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    isbn VARCHAR(13) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL,
    publisher VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    publication_year INT CHECK (publication_year > 0),
    copies_available INT NOT NULL DEFAULT 1 CHECK (copies_available >= 0),
    total_copies INT NOT NULL DEFAULT 1 CHECK (total_copies >= copies_available),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_isbn (isbn),
    INDEX idx_title (title),
    INDEX idx_author (author),
    INDEX idx_category (category)
);

-- Create book_loans table
CREATE TABLE IF NOT EXISTS book_loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status ENUM('Borrowed', 'Returned', 'Overdue') DEFAULT 'Borrowed',
    fine_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (fine_amount >= 0.00),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    
    INDEX idx_borrow_date (borrow_date),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
);

-- Trigger to update book copies when a loan is created
DELIMITER //
CREATE TRIGGER after_loan_insert
AFTER INSERT ON book_loans
FOR EACH ROW
BEGIN
    UPDATE books
    SET copies_available = copies_available - 1
    WHERE id = NEW.book_id AND copies_available > 0;
END //
DELIMITER ;

-- Trigger to update book copies when a loan is returned
DELIMITER //
CREATE TRIGGER after_loan_return
AFTER UPDATE ON book_loans
FOR EACH ROW
BEGIN
    IF NEW.status = 'Returned' AND OLD.status != 'Returned' THEN
        UPDATE books
        SET copies_available = copies_available + 1
        WHERE id = NEW.book_id;
    END IF;
END //
DELIMITER ;

-- Trigger to calculate fines for overdue loans
DELIMITER //
CREATE TRIGGER before_loan_update
BEFORE UPDATE ON book_loans
FOR EACH ROW
BEGIN
    IF NEW.status = 'Overdue' AND CURDATE() > NEW.due_date THEN
        SET NEW.fine_amount = DATEDIFF(CURDATE(), NEW.due_date) * 1.00; -- $1 per day overdue
    END IF;
END //
DELIMITER ;

-- Insert sample members
INSERT INTO members (name, phone, email, address, membership_type, membership_date) VALUES
('John Doe', '(555) 123-4567', 'john.doe@email.com', '123 Main Street, Springfield, IL 62701', 'Standard', CURDATE()),
('Jane Smith', '(555) 234-5678', 'jane.smith@email.com', '456 Oak Avenue, Springfield, IL 62702', 'Premium', CURDATE()),
('Robert Johnson', '(555) 345-6789', 'robert.johnson@email.com', '789 Pine Road, Springfield, IL 62703', 'Scholar', CURDATE()),
('Emily Davis', '(555) 456-7890', 'emily.davis@email.com', '321 Elm Street, Springfield, IL 62704', 'Standard', CURDATE()),
('Michael Wilson', '(555) 567-8901', 'michael.wilson@email.com', '654 Maple Drive, Springfield, IL 62705', 'Premium', CURDATE());

-- Insert sample books
INSERT INTO books (isbn, title, author, publisher, category, publication_year, copies_available, total_copies) VALUES
('9780141439518', 'Pride and Prejudice', 'Jane Austen', 'Penguin Classics', 'Fiction', 1813, 3, 3),
('9780451524935', '1984', 'George Orwell', 'Signet Classic', 'Fiction', 1949, 2, 2),
('9780547928227', 'The Hobbit', 'J.R.R. Tolkien', 'Houghton Mifflin', 'Fantasy', 1937, 4, 4),
('9780743273565', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Scribner', 'Fiction', 1925, 2, 2),
('9780061120084', 'To Kill a Mockingbird', 'Harper Lee', 'Harper Perennial', 'Fiction', 1960, 3, 3),
('9780307474278', 'The Da Vinci Code', 'Dan Brown', 'Anchor', 'Mystery', 2003, 2, 2),
('9780590353427', 'Harry Potter and the Sorcerer''s Stone', 'J.K. Rowling', 'Scholastic', 'Fantasy', 1997, 5, 5),
('9781451673319', 'Fahrenheit 451', 'Ray Bradbury', 'Simon & Schuster', 'Science Fiction', 1953, 2, 2),
('9780062315007', 'The Alchemist', 'Paulo Coelho', 'HarperOne', 'Fiction', 1988, 3, 3),
('9780141187761', 'Brave New World', 'Aldous Huxley', 'Penguin Books', 'Science Fiction', 1932, 2, 2);

-- Insert sample book loans
INSERT INTO book_loans (book_id, member_id, borrow_date, due_date, return_date, status, fine_amount) VALUES
(1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, 'Borrowed', 0.00),
(2, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, 'Borrowed', 0.00),
(3, 3, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, 'Borrowed', 0.00),
(4, 4, '2025-05-01', '2025-05-15', '2025-05-14', 'Returned', 0.00),
(7, 5, '2025-05-01', '2025-05-15', NULL, 'Overdue', DATEDIFF(CURDATE(), '2025-05-15') * 1.00);

-- Create library views
CREATE OR REPLACE VIEW active_loans AS
SELECT 
    bl.id,
    m.name AS member_name,
    b.title AS book_title,
    bl.borrow_date,
    bl.due_date,
    bl.status,
    DATEDIFF(CURDATE(), bl.due_date) AS days_overdue,
    bl.fine_amount
FROM book_loans bl
JOIN members m ON bl.member_id = m.id
JOIN books b ON bl.book_id = b.id
WHERE bl.status IN ('Borrowed', 'Overdue');

CREATE OR REPLACE VIEW book_availability AS
SELECT 
    id,
    title,
    author,
    category,
    copies_available,
    (total_copies - copies_available) AS checked_out,
    total_copies
FROM books;

CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM members WHERE membership_status = 'Active') AS total_members,
    (SELECT COUNT(*) FROM members WHERE membership_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) AS new_members_this_week,
    (SELECT COUNT(*) FROM books) AS total_books,
    (SELECT COUNT(DISTINCT category) FROM books) AS categories_count,
    (SELECT COUNT(*) FROM book_loans WHERE status IN ('Borrowed', 'Overdue')) AS active_loans,
    (SELECT COUNT(*) FROM book_loans WHERE status = 'Overdue') AS overdue_loans,
    (SELECT SUM(copies_available) FROM books) AS available_books,
    (SELECT COUNT(*) FROM book_loans WHERE status = 'Returned') AS returned_count,
    (SELECT COUNT(*) FROM book_loans WHERE status = 'Borrowed') AS borrowed_count,
    (SELECT COUNT(*) FROM book_loans WHERE status = 'Overdue') AS overdue_count;

-- Show initialization summary
SELECT 'Library database initialized successfully!' AS status;
SELECT COUNT(*) AS total_members FROM members;
SELECT COUNT(*) AS total_books FROM books;
SELECT COUNT(*) AS total_loans FROM book_loans;
SELECT * FROM dashboard_stats;