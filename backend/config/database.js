// config/database.js
const mysql = require('mysql2');

// Valid MySQL connection options
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'library_db',
  port: process.env.DB_PORT || 3306,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  connectTimeout: 60000, // Replaces acquireTimeout
  multipleStatements: true,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Create connection pool
const pool = mysql.createPool(dbConfig).promise();

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    console.log('✅ Database connected successfully');
    console.log(`📊 Connected to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Check your database credentials (username/password)');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure MySQL server is running');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Database does not exist. Run: npm run init-db');
    }

    throw error;
  }
};

// Sanitize and validate parameters
const sanitizeParams = (params) => {
  if (!Array.isArray(params)) return [];
  return params.map(param => {
    if (typeof param === 'string' && !isNaN(param) && param !== '') {
      const num = parseInt(param, 10);
      return isNaN(num) ? 0 : num;
    }
    if (param === undefined || param === null) return null;
    if (typeof param === 'number' && isNaN(param)) return 0;
    return param;
  });
};

// Execute query
const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await promisePool.getConnection();
    const sanitizedParams = sanitizeParams(params);
    console.log('Executing query:', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      originalParams: params,
      sanitizedParams: sanitizedParams
    });

    const [results] = sanitizedParams.length === 0
      ? await connection.query(query)
      : await connection.query(query, sanitizedParams);

    console.log(`✅ Query executed successfully, returned ${Array.isArray(results) ? results.length : 1} rows`);
    return results;

  } catch (error) {
    console.error('Database query error:', {
      query: query.substring(0, 200),
      originalParams: params,
      sanitizedParams: sanitizeParams(params),
      error: error.message,
      code: error.code
    });
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Execute transaction
const executeTransaction = async (queries) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    const results = [];

    for (const { query, params } of queries) {
      const sanitizedParams = sanitizeParams(params || []);
      const [result] = sanitizedParams.length === 0
        ? await connection.query(query)
        : await connection.query(query, sanitizedParams);
      results.push(result);
    }

    await connection.commit();
    console.log(`✅ Transaction completed successfully (${queries.length} queries)`);
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('❌ Transaction rolled back due to error:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// Check if database exists
const checkDatabase = async () => {
  try {
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;

    const tempPool = mysql.createPool(tempConfig);
    const tempPromisePool = tempPool.promise();

    const [databases] = await tempPromisePool.query(
      'SHOW DATABASES LIKE ?', 
      [dbConfig.database]
    );

    await tempPool.end();
    return databases.length > 0;
  } catch (error) {
    console.error('Error checking database existence:', error.message);
    return false;
  }
};

// Create database
const createDatabase = async () => {
  try {
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;

    const tempPool = mysql.createPool(tempConfig);
    const tempPromisePool = tempPool.promise();

    await tempPromisePool.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    console.log(`✅ Database '${dbConfig.database}' created or verified`);
    await tempPool.end();
    return true;
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    throw error;
  }
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    console.log('✅ Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
};

// Handle termination
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = pool;
