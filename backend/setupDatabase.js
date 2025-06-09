
// setupDatabase.js - Library Database Setup
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  try {
    // Database configuration from environment variables
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    };
    
    // Connect to MySQL server
    console.log('🔄 Connecting to MySQL server...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL server');

    // Drop and recreate the database
    const dbName = process.env.DB_NAME || 'library_db';
    await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
    await connection.query(`CREATE DATABASE ${dbName}`);
    await connection.query(`USE ${dbName}`);
    console.log(`✅ Created ${dbName} database`);

    // Create members table
    await connection.query(`
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
    `);
    console.log('✅ Created members table');

    // Create books table
    await connection.query(`
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
    `);
    console.log('✅ Created books table');

    // Create book_loans table
    await connection.query(`
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
        INDEX idx_status (status),
        INDEX idx_member_id (member_id),
        INDEX idx_book_id (book_id)
      );
    `);
    console.log('✅ Created book_loans table');

    // Create triggers individually
    console.log('🔄 Creating triggers...');
    
    // Trigger: after_loan_insert
    await connection.query(`
      CREATE TRIGGER after_loan_insert
      AFTER INSERT ON book_loans
      FOR EACH ROW
      BEGIN
        UPDATE books
        SET copies_available = copies_available - 1
        WHERE id = NEW.book_id AND copies_available > 0;
      END;
    `);
    
    // Trigger: after_loan_return
    await connection.query(`
      CREATE TRIGGER after_loan_return
      AFTER UPDATE ON book_loans
      FOR EACH ROW
      BEGIN
        IF NEW.status = 'Returned' AND OLD.status != 'Returned' THEN
          UPDATE books
          SET copies_available = copies_available + 1
          WHERE id = NEW.book_id;
        END IF;
      END;
    `);
    
    // Trigger: before_loan_update
    await connection.query(`
      CREATE TRIGGER before_loan_update
      BEFORE UPDATE ON book_loans
      FOR EACH ROW
      BEGIN
        IF NEW.status = 'Overdue' AND CURDATE() > NEW.due_date THEN
          SET NEW.fine_amount = DATEDIFF(CURDATE(), NEW.due_date) * 1.00;
        END IF;
      END;
    `);
    console.log('✅ Created triggers');

    // Create views
    await connection.query(`
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
    `);
    console.log('✅ Created views');

    // Insert sample members
    await connection.query(`
      INSERT INTO members (name, phone, email, address, membership_type, membership_date) VALUES
      ('John Doe', '(555) 123-4567', 'john.doe@email.com', '123 Main Street, Springfield, IL 62701', 'Standard', CURDATE()),
      ('Jane Smith', '(555) 234-5678', 'jane.smith@email.com', '456 Oak Avenue, Springfield, IL 62702', 'Premium', CURDATE()),
      ('Robert Johnson', '(555) 345-6789', 'robert.johnson@email.com', '789 Pine Road, Springfield, IL 62703', 'Scholar', CURDATE()),
      ('Emily Davis', '(555) 456-7890', 'emily.davis@email.com', '321 Elm Street, Springfield, IL 62704', 'Standard', CURDATE()),
      ('Michael Wilson', '(555) 567-8901', 'michael.wilson@email.com', '654 Maple Drive, Springfield, IL 62705', 'Premium', CURDATE());
    `);
    console.log('✅ Inserted sample members');

    // Insert sample books
    await connection.query(`
      INSERT INTO books (isbn, title, author, publisher, category, publication_year, copies_available, total_copies) VALUES
      ('9780141439518', 'Pride and Prejudice', 'Jane Austen', 'Penguin Classics', 'Fiction', 1813, 3, 3),
      ('9780451524935', '1984', 'George Orwell', 'Signet Classic', 'Fiction', 1949, 2, 2),
      ('9780547928227', 'The Hobbit', 'J.R.R. Tolkien', 'Houghton Mifflin', 'Fantasy', 1937, 4, 4),
      ('9780743273565', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Scribner', 'Fiction', 1925, 2, 2),
      ('9780061120084', 'To Kill a Mockingbird', 'Harper Lee', 'Harper Perennial', 'Fiction', 1960, 3, 3),
      ('9780307474278', 'The Da Vinci Code', 'Dan Brown', 'Anchor', 'Mystery', 2003, 2, 2),
      ('9780590353427', "Harry Potter and the Sorcerer''s Stone", 'J.K. Rowling', 'Scholastic', 'Fantasy', 1997, 5, 5),
      ('9781451673319', 'Fahrenheit 451', 'Ray Bradbury', 'Simon & Schuster', 'Science Fiction', 1953, 2, 2),
      ('9780062315007', 'The Alchemist', 'Paulo Coelho', 'HarperOne', 'Fiction', 1988, 3, 3),
      ('9780141187761', 'Brave New World', 'Aldous Huxley', 'Penguin Books', 'Science Fiction', 1932, 2, 2);
    `);
    console.log('✅ Inserted sample books');

    // Insert sample book loans
    await connection.query(`
      INSERT INTO book_loans (book_id, member_id, borrow_date, due_date, return_date, status, fine_amount) VALUES
      (1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, 'Borrowed', 0.00),
      (2, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, 'Borrowed', 0.00),
      (3, 3, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, 'Borrowed', 0.00),
      (4, 4, '2025-05-01', '2025-05-15', '2025-05-14', 'Returned', 0.00),
      (7, 5, '2025-05-01', '2025-05-15', NULL, 'Overdue', 22.00);
    `);
    console.log('✅ Inserted sample book loans');

    // Display statistics
    const [members] = await connection.query('SELECT COUNT(*) as count FROM members');
    const [books] = await connection.query('SELECT COUNT(*) as count FROM books');
    const [loans] = await connection.query('SELECT COUNT(*) as count FROM book_loans');
    const [stats] = await connection.query('SELECT * FROM dashboard_stats');

    console.log('\n📊 Database Statistics:');
    console.log(`   Members: ${members[0].count}`);
    console.log(`   Books: ${members[0].count}`);
    console.log(`   Loans: ${loans[0].count}`);
    console.log('\n📈 Dashboard Statistics:');
    console.log(`   Total Members: ${stats[0].total_members}`);
    console.log(`   New Members (Week): ${stats[0].new_members_this_week}`);
    console.log(`   Total Books: ${stats[0].total_books}`);
    console.log(`   Categories: ${stats[0].categories_count}`);
    console.log(`   Active Loans: ${stats[0].active_loans}`);
    console.log(`   Overdue Loans: ${stats[0].overdue_loans}`);
    console.log(`   Available Books: ${stats[0].available_books}`);

    console.log('\n🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Check DB credentials in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Ensure MySQL server is running');
    }
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

setupDatabase().catch(console.error);
