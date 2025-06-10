-- Safe search features migration - handles existing indexes
-- This file adds search functionality support safely

-- Create search history table
CREATE TABLE IF NOT EXISTS search_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    search_query VARCHAR(255) NOT NULL,
    search_type ENUM('general', 'books', 'members', 'loans') DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_search_query (search_query),
    INDEX idx_created_at (created_at)
);

-- Add indexes to books table (ignore errors if they exist)
-- Check if indexes exist before creating
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND INDEX_NAME = 'idx_books_title') = 0,
    'CREATE INDEX idx_books_title ON books(title)',
    'SELECT "Index idx_books_title already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND INDEX_NAME = 'idx_books_author') = 0,
    'CREATE INDEX idx_books_author ON books(author)',
    'SELECT "Index idx_books_author already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND INDEX_NAME = 'idx_books_category') = 0,
    'CREATE INDEX idx_books_category ON books(category)',
    'SELECT "Index idx_books_category already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND INDEX_NAME = 'idx_books_isbn') = 0,
    'CREATE INDEX idx_books_isbn ON books(isbn)',
    'SELECT "Index idx_books_isbn already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes to members table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members' AND INDEX_NAME = 'idx_members_name') = 0,
    'CREATE INDEX idx_members_name ON members(name)',
    'SELECT "Index idx_members_name already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members' AND INDEX_NAME = 'idx_members_email') = 0,
    'CREATE INDEX idx_members_email ON members(email)',
    'SELECT "Index idx_members_email already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
