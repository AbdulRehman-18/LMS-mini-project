// server-production.js - Production-ready server with strict security
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import database connection
const pool = require('./config/database');

// Import routes
const bookRoutes = require('./routes/books');
const memberRoutes = require('./routes/members');
const loanRoutes = require('./routes/loans');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5001; // Use port 5001 to avoid conflicts
const isDev = process.env.NODE_ENV !== 'production';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: [
        "'self'",
        "https://cdn.tailwindcss.com",
        ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : []) // Allow inline/eval in dev for dev tools
      ],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", ...(isDev ? ['ws:', 'http://localhost:*'] : [])], // Allow WebSocket/localhost in dev
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isDev ? null : [] // Enforce HTTPS in production
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100, // Higher limit in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints (placeholder)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});
// Example: app.use('/api/auth', authLimiter); // Apply when auth routes are added

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (isDev || !origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS')); // Strict in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(isDev ? morgan('dev') : morgan('combined'));

// Serve static files
const frontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath, {
    maxAge: isDev ? 0 : '1d',
    etag: true,
    lastModified: true
  }));
} else {
  console.warn(`⚠️ Frontend directory not found at ${frontendPath}`);
}

// API Routes
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/stats', statsRoutes);

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Library Management System API',
    version: '1.0.0',
    description: 'RESTful API for Library management operations',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    authentication: 'Bearer token (future implementation)',
    endpoints: {
      books: {
        'GET /api/books': 'Get all books',
        'GET /api/books/:id': 'Get book by ID',
        'GET /api/books/search': 'Search books',
        'POST /api/books': 'Create new book',
        'PUT /api/books/:id': 'Update book',
        'DELETE /api/books/:id': 'Delete book'
      },
      members: {
        'GET /api/members': 'Get all members',
        'GET /api/members/:id': 'Get member by ID',
        'GET /api/members/search': 'Search members',
        'POST /api/members': 'Create new member',
        'PUT /api/members/:id': 'Update member',
        'DELETE /api/members/:id': 'Delete member',
        'PATCH /api/members/:id/status': 'Update member status'
      },
      loans: {
        'GET /api/loans': 'Get all loans',
        'GET /api/loans/:id': 'Get loan by ID',
        'GET /api/loans/overdue': 'Get overdue loans',
        'GET /api/loans/member/:memberId': 'Get loans by member',
        'POST /api/loans': 'Create new loan',
        'POST /api/loans/:id/return': 'Return a book',
        'PATCH /api/loans/:id/fine': 'Update fine amount'
      },
      stats: {
        'GET /api/stats': 'Get dashboard statistics'
      }
    },
    rateLimits: {
      general: '100 requests per 15 minutes',
      auth: '5 requests per 15 minutes (future)'
    }
  });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
  
  const indexPath = path.join(__dirname, '../frontend/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Frontend not found',
      message: 'Ensure frontend is built and available',
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: isDev ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed',
      timestamp: new Date().toISOString()
    });
  }
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
    timestamp: new Date().toISOString(),
    ...(isDev && { stack: err.stack })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    status: 404,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} received, shutting down gracefully`);
  
  if (server && !server.closed) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      
      pool.end()
        .then(() => {
          console.log('✅ Database connections closed');
          process.exit(0);
        })
        .catch((err) => {
          console.error('❌ Error closing database connections:', err.message);
          process.exit(1);
        });
    });
    
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    console.log('✅ No active server, closing database connections');
    pool.end()
      .then(() => {
        console.log('✅ Database connections closed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('❌ Error closing database connections:', err.message);
        process.exit(1);
      });
  }
};

// Initialize server
let server;

const startServer = async () => {
  try {
    console.log('🔄 Testing database connection...');
    const conn = await pool.getConnection();
    console.log('✅ Database connected successfully');
    conn.release();
    
    // Skip port cleanup in production or if not needed
    if (isDev && process.platform === 'win32') {
      try {
        const { exec } = require('child_process');
        exec(`netstat -ano | findstr :${PORT}`, (err, stdout) => {
          if (stdout) {
            const pid = stdout.split(/\s+/).slice(-1)[0];
            exec(`taskkill /F /PID ${pid}`, (killErr) => {
              if (killErr) console.warn(`⚠️ Could not kill process on port ${PORT}: ${killErr.message}`);
            });
          }
        });
      } catch (err) {
        console.warn(`⚠️ Port cleanup failed: ${err.message}`);
      }
    }

    server = app.listen(PORT, () => {
      console.log('🎉 AbdulRehman Library Management System Started!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Server: http://localhost:${PORT}`);
      console.log(`🏥 Frontend: http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security: ${isDev ? 'Development' : 'Production'} mode`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
    
    // Setup graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err.message);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('💡 Check database connection and configuration');
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
