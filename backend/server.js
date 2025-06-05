// server-production.js - Production-ready server with strict security
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
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

// Security middleware for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Required for Tailwind
        "https://cdn.tailwindcss.com", 
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrc: [
        "'self'", 
        ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : []), // Only in development
        "https://cdn.tailwindcss.com"
      ],
      fontSrc: [
        "'self'", 
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:"
      ],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      formAction: ["'self'", "'unsafe-inline'"], // Allow form submissions to self and inline JS
      upgradeInsecureRequests: !isDev ? [] : null, // Only in production
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
app.use(compression());

// Rate limiting with different limits for dev/prod
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100, // Higher limit in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints (future use)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5500', // Added for VS Code Live Server
      'http://localhost:5500', // Added for VS Code Live Server
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all origins for debugging
      // callback(new Error('Not allowed by CORS')); // Uncomment for production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Logging middleware
if (isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve static files with proper caching headers
app.use(express.static(path.join(__dirname, '../frontend'), {
  maxAge: isDev ? 0 : '1d', // Cache for 1 day in production
  etag: true,
  lastModified: true
}));

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
    description: 'RESTful API for hospital management operations',
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
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
  
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
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
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed',
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle JSON parsing errors
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
  
  // Close server
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connections
    pool.end()
      .then(() => {
        console.log('✅ Database connections closed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('❌ Error closing database connections:', err);
        process.exit(1);
      });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Initialize server variable
let server;

// Start server
const startServer = async () => {
  try {
    console.log('🔄 Testing database connection...');
    await pool.getConnection().then(conn => {
      console.log('✅ Database connected successfully');
      conn.release();
    });
    
    // Kill any existing processes on the port (Windows)
    if (isDev) {
      try {
        const { execSync } = require('child_process');
        const result = execSync(`netstat -ano | findstr :${PORT}`).toString();
        if (result) {
          const pid = result.split(/\s+/).slice(-1)[0];
          execSync(`taskkill /F /PID ${pid}`);
        }
      } catch (err) {
        // Ignore errors - port might not be in use
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
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
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

// Export for testing
if (require.main === module) {
  startServer();
}

module.exports = app;