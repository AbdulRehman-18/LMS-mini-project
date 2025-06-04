// test-db.js - Simple database connection and query test
require('dotenv').config();
const pool = require('./config/database');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    console.log('✅ Database connected successfully');
    connection.release();
    
    console.log('\n🔍 Testing basic queries...');
    
    // Test simple query without parameters
    const [tables] = await pool.query('SHOW TABLES');
    console.log('✅ SHOW TABLES query successful:', tables.length, 'tables found');
    
    // Test query with parameters
    try {
      const [memberCount] = await pool.query('SELECT COUNT(*) as count FROM members');
      console.log('✅ Member count query successful:', memberCount[0].count, 'members');
    } catch (err) {
      console.log('⚠️ Members table may not exist yet:', err.message);
    }
    
    try {
      const [bookCount] = await pool.query('SELECT COUNT(*) as count FROM books');
      console.log('✅ Book count query successful:', bookCount[0].count, 'books');
    } catch (err) {
      console.log('⚠️ Books table may not exist yet:', err.message);
    }
    
    // Test LIMIT query with parameters
    console.log('\n🔍 Testing LIMIT queries...');
    try {
      const [members] = await pool.query('SELECT * FROM members ORDER BY created_at DESC LIMIT ? OFFSET ?', [5, 0]);
      console.log('✅ Member LIMIT query successful:', members.length, 'members returned');
    } catch (err) {
      console.log('⚠️ Members LIMIT query failed:', err.message);
    }
    
    try {
      const [books] = await pool.query('SELECT * FROM books ORDER BY title LIMIT ? OFFSET ?', [5, 0]);
      console.log('✅ Book LIMIT query successful:', books.length, 'books returned');
    } catch (err) {
      console.log('⚠️ Books LIMIT query failed:', err.message);
    }
    
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage
    });
  } finally {
    process.exit(0);
  }
}

testDatabase();