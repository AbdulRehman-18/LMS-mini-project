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
    membership_date DATE NOT NULL,
    membership_status ENUM('Active', 'Expired', 'Suspended') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_name (name),
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
    publication_year INT,
    copies_available INT NOT NULL DEFAULT 1,
    total_copies INT NOT NULL DEFAULT 1,
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
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    
    INDEX idx_borrow_date (borrow_date),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
);

-- Insert sample members
INSERT INTO members (name, phone, email, address, membership_date) VALUES
('John Doe', '(555) 123-4567', 'john.doe@email.com', '123 Main Street, Springfield, IL 62701', CURDATE()),
('Jane Smith', '(555) 234-5678', 'jane.smith@email.com', '456 Oak Avenue, Springfield, IL 62702', CURDATE()),
('Robert Johnson', '(555) 345-6789', 'robert.johnson@email.com', '789 Pine Road, Springfield, IL 62703', CURDATE()),
('Emily Davis', '(555) 456-7890', 'emily.davis@email.com', '321 Elm Street, Springfield, IL 62704', CURDATE()),
('Michael Wilson', '(555) 567-8901', 'michael.wilson@email.com', '654 Maple Drive, Springfield, IL 62705', CURDATE());

-- Insert sample books
INSERT INTO books (isbn, title, author, publisher, category, publication_year, copies_available, total_copies) VALUES
('9780141439518', 'Pride and Prejudice', 'Jane Austen', 'Penguin Classics', 'Fiction', 1813, 3, 3),
('9780451524935', '1984', 'George Orwell', 'Signet Classic', 'Fiction', 1949, 2, 2),
('9780547928227', 'The Hobbit', 'J.R.R. Tolkien', 'Houghton Mifflin', 'Fantasy', 1937, 4, 4),
('9780743273565', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Scribner', 'Fiction', 1925, 2, 2),
('9780061120084', 'To Kill a Mockingbird', 'Harper Lee', 'Harper Perennial', 'Fiction', 1960, 3, 3),
('9780307474278', 'The Da Vinci Code', 'Dan Brown', 'Anchor', 'Mystery', 2003, 2, 2),
('9780590353427', 'Harry Potter and the Sorcerers Stone', 'J.K. Rowling', 'Scholastic', 'Fantasy', 1997, 5, 5),
('9781451673319', 'Fahrenheit 451', 'Ray Bradbury', 'Simon & Schuster', 'Science Fiction', 1953, 2, 2),
('9780062315007', 'The Alchemist', 'Paulo Coelho', 'HarperOne', 'Fiction', 1988, 3, 3),
('9780141187761', 'Brave New World', 'Aldous Huxley', 'Penguin Books', 'Science Fiction', 1932, 2, 2);

-- Insert sample book loans (LIBRARY loans, not medical appointments)
INSERT INTO book_loans (book_id, member_id, borrow_date, due_date, return_date, status) VALUES
(1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, 'Borrowed'),
(2, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, 'Borrowed'),
(3, 3, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, 'Borrowed'),
(4, 4, '2023-05-01', '2023-05-15', '2023-05-14', 'Returned'),
(7, 5, '2023-06-01', '2023-06-15', NULL, 'Overdue');

-- Create library views
CREATE OR REPLACE VIEW active_loans AS
SELECT 
    bl.id,
    m.name AS member_name,
    b.title AS book_title,
    bl.borrow_date,
    bl.due_date,
    DATEDIFF(CURDATE(), bl.due_date) AS days_overdue
FROM book_loans bl
JOIN members m ON bl.member_id = m.id
JOIN books b ON bl.book_id = b.id
WHERE bl.status IN ('Borrowed', 'Overdue');

CREATE OR REPLACE VIEW book_availability AS
SELECT 
    id,
    title,
    author,
    copies_available,
    (total_copies - copies_available) AS checked_out
FROM books;

-- Show initialization summary
SELECT 'Library database initialized successfully!' AS status;
SELECT COUNT(*) AS total_members FROM members;
SELECT COUNT(*) AS total_books FROM books;
SELECT COUNT(*) AS total_loans FROM book_loans;