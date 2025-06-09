// config/init-db.js - Library DB initialization
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

const initializeDatabase = async () => {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL server...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL server');
    
    // Create database
    const dbName = process.env.DB_NAME || 'library_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created or verified`);
    
    // Switch to database
    await connection.query(`USE ${dbName}`);
    
    // Try to read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    
    try {
      const schemaSQL = await fs.readFile(schemaPath, 'utf8');
      console.log('📄 Reading database schema...');
      
      // Split and execute SQL statements
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`🔧 Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            await connection.query(statement);
            process.stdout.write('.');
          } catch (error) {
            // Skip non-critical errors
            if (!error.message.includes('already exists') && 
                !error.message.includes('Duplicate entry') &&
                !error.message.includes('CHECK clause is not supported')) {
              console.warn(`⚠️ Warning in statement ${i + 1}:`, error.message);
            }
          }
        }
      }
      console.log('\n✅ Database schema executed successfully');
      
    } catch (schemaError) {
      if (schemaError.code === 'ENOENT') {
        console.log('⚠️ Schema file not found. Creating basic tables...');
        await createBasicTables(connection);
      } else {
        throw schemaError;
      }
    }
    
    // Check if tables have data
    const [members] = await connection.query('SELECT COUNT(*) as count FROM members');
    const [books] = await connection.query('SELECT COUNT(*) as count FROM books');
    const [loans] = await connection.query('SELECT COUNT(*) as count FROM book_loans');
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Members: ${members[0].count}`);
    console.log(`   Books: ${books[0].count}`);
    console.log(`   Loans: ${loans[0].count}`);
    
    // Fetch dashboard stats if view exists
    try {
      const [stats] = await connection.query('SELECT * FROM dashboard_stats');
      if (stats.length > 0) {
        console.log('\n📈 Dashboard Statistics:');
        console.log(`   Total Members: ${stats[0].total_members}`);
        console.log(`   New Members (Week): ${stats[0].new_members_this_week}`);
        console.log(`   Total Books: ${stats[0].total_books}`);
        console.log(`   Categories: ${stats[0].categories_count}`);
        console.log(`   Active Loans: ${stats[0].active_loans}`);
        console.log(`   Overdue Loans: ${stats[0].overdue_loans}`);
        console.log(`   Available Books: ${stats[0].available_books}`);
      }
    } catch (error) {
      console.log('ℹ️ Dashboard stats view not available');
    }
    
    // Add sample data if no books exist
    if (books[0].count === 0) {
      console.log('\n🔄 Adding sample data...');
      await addSampleData(connection);
      
      // Recheck counts
      const [newMembers] = await connection.query('SELECT COUNT(*) as count FROM members');
      const [newBooks] = await connection.query('SELECT COUNT(*) as count FROM books');
      const [newLoans] = await connection.query('SELECT COUNT(*) as count FROM book_loans');
      
      console.log('\n📊 Updated Database Statistics:');
      console.log(`   Members: ${newMembers[0].count}`);
      console.log(`   Books: ${newBooks[0].count}`);
      console.log(`   Loans: ${newLoans[0].count}`);
      
      // Recheck dashboard stats
      try {
        const [newStats] = await connection.query('SELECT * FROM dashboard_stats');
        if (newStats.length > 0) {
          console.log('\n📈 Updated Dashboard Statistics:');
          console.log(`   Total Members: ${newStats[0].total_members}`);
          console.log(`   New Members (Week): ${newStats[0].new_members_this_week}`);
          console.log(`   Total Books: ${newStats[0].total_books}`);
          console.log(`   Categories: ${newStats[0].categories_count}`);
          console.log(`   Active Loans: ${newStats[0].active_loans}`);
          console.log(`   Overdue Loans: ${newStats[0].overdue_loans}`);
          console.log(`   Available Books: ${newStats[0].available_books}`);
        }
      } catch (error) {
        console.log('ℹ️ Dashboard stats view not available after sample data');
      }
    }
    
    console.log('\n🎉 Library database initialization completed!');
    console.log(`🌐 Start the server with: npm start`);
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Check DB credentials in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Ensure MySQL server is running');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

const createBasicTables = async (connection) => {
  const basicTables = [
    `CREATE TABLE IF NOT EXISTS members (
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
    )`,
    
    `CREATE TABLE IF NOT EXISTS books (
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
    )`,
    
    `CREATE TABLE IF NOT EXISTS book_loans (
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
    )`
  ];
  
  for (const tableSQL of basicTables) {
    try {
      await connection.query(tableSQL);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.warn(`⚠️ Error creating table: ${error.message}`);
      }
    }
  }
  console.log('✅ Basic library tables created successfully');
};

const addSampleData = async (connection) => {
  try {
    // Sample members
    const members = [
      ['John Doe', '(555) 123-4567', 'john.doe@email.com', '123 Main Street, Springfield, IL 62701', 'Standard', 'CURDATE()'],
      ['Jane Smith', '(555) 234-5678', 'jane.smith@email.com', '456 Oak Avenue, Springfield, IL 62702', 'Premium', 'CURDATE()'],
      ['Robert Johnson', '(555) 345-6789', 'robert.johnson@email.com', '789 Pine Road, Springfield, IL 62703', 'Scholar', 'CURDATE()'],
      ['Emily Davis', '(555) 456-7890', 'emily.davis@email.com', '321 Elm Street, Springfield, IL 62704', 'Standard', 'CURDATE()'],
      ['Michael Wilson', '(555) 567-8901', 'michael.wilson@email.com', '654 Maple Drive, Springfield, IL 62705', 'Premium', 'CURDATE()']
    ];
    
    for (const member of members) {
      try {
        await connection.query(
          `INSERT INTO members (name, phone, email, address, membership_type, membership_date) 
           VALUES (?, ?, ?, ?, ?, ${member[5]})`,
          [member[0], member[1], member[2], member[3], member[4]]
        );
      } catch (error) {
        if (!error.message.includes('Duplicate entry')) {
          console.warn(`⚠️ Error adding member ${member[0]}: ${error.message}`);
        }
      }
    }
    console.log('✅ Sample members added');
    
    // Sample books
    const books = [
      ['9780141439518', 'Pride and Prejudice', 'Jane Austen', 'Penguin Classics', 'Fiction', 1813, 3, 3],
      ['9780451524935', '1984', 'George Orwell', 'Signet Classic', 'Fiction', 1949, 2, 2],
      ['9780547928227', 'The Hobbit', 'J.R.R. Tolkien', 'Houghton Mifflin', 'Fantasy', 1937, 4, 4],
      ['9780743273565', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Scribner', 'Fiction', 1925, 2, 2],
      ['9780061120084', 'To Kill a Mockingbird', 'Harper Lee', 'Harper Perennial', 'Fiction', 1960, 3, 3]
    ];
    
    for (const book of books) {
      try {
        await connection.query(
          'INSERT INTO books (isbn, title, author, publisher, category, publication_year, copies_available, total_copies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          book
        );
      } catch (error) {
        if (!error.message.includes('Duplicate entry')) {
          console.warn(`⚠️ Error adding book ${book[1]}: ${error.message}`);
        }
      }
    }
    console.log('✅ Sample books added');
    
    // Sample loans
    const loans = [
      [1, 1, 'CURDATE()', 'DATE_ADD(CURDATE(), INTERVAL 14 DAY)', null, 'Borrowed', 0.00],
      [2, 2, 'CURDATE()', 'DATE_ADD(CURDATE(), INTERVAL 14 DAY)', null, 'Borrowed', 0.00],
      [3, 3, 'CURDATE()', 'DATE_ADD(CURDATE(), INTERVAL 14 DAY)', null, 'Borrowed', 0.00],
      [4, 4, "'2025-05-01'", "'2025-05-15'", "'2025-05-14'", 'Returned', 0.00],
      [1, 5, "'2025-05-01'", "'2025-05-15'", null, 'Overdue', 22.00] // Calculated for June 6, 2025
    ];
    
    for (const loan of loans) {
      try {
        await connection.query(
          `INSERT INTO book_loans (book_id, member_id, borrow_date, due_date, return_date, status, fine_amount) 
           VALUES (?, ?, ${loan[2]}, ${loan[3]}, ${loan[4]}, ?, ?)`,
          [loan[0], loan[1], loan[5], loan[6]]
        );
      } catch (error) {
        if (!error.message.includes('Duplicate entry')) {
          console.warn(`⚠️ Error adding loan for book_id ${loan[0]}: ${error.message}`);
        }
      }
    }
    console.log('✅ Sample book loans added');
    
  } catch (error) {
    console.warn('⚠️ Error adding sample data:', error.message);
  }
};

const testConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      ...dbConfig,
      database: process.env.DB_NAME || 'library_db'
    });
    
    await connection.query('SELECT 1');
    await connection.end();
    
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
};

const dropDatabase = async () => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const dbName = process.env.DB_NAME || 'library_db';
    
    const confirmed = process.argv.includes('--confirm');
    if (!confirmed) {
      console.log('⚠️ To drop database: npm run drop-db -- --confirm');
      return;
    }
    
    await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log(`🗑️ Database '${dbName}' dropped`);
  } catch (error) {
    console.error('❌ Drop database failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// CLI Commands
const command = process.argv[2];

switch (command) {
  case 'init':
    initializeDatabase();
    break;
  case 'test':
    testConnection();
    break;
  case 'drop':
    dropDatabase();
    break;
  default:
    console.log(`
📚 Library Management System - Database Tools

Commands:
  npm run init-db     - Initialize database
  npm run test-db     - Test database connection
  npm run drop-db     - Drop database (add -- --confirm)

Examples:
  npm run init-db
  npm run test-db
  npm run drop-db -- --confirm
    `);
}

module.exports = {
  initializeDatabase,
  testConnection,
  dropDatabase
};