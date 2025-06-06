

# Library Management System

A full-stack application for managing library operations including book inventory, member management, and loan tracking.

## Features
- 📚 Book catalog management
- 👥 Member registration & tracking
- 🔄 Loan management system
- 📊 Statistical reporting
- 🛠️ REST API backend
- 💻 Web-based frontend

## Tech Stack
**Backend:**
- Node.js + Express
- SQL database (configured in `config/database.js`)
- Sequelize ORM (defined in `models/`)

**Frontend:**
- Vanilla JavaScript
- HTML5/CSS3

## Installation
1. Install backend dependencies:
```bash
cd backend
npm install
```
2. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

## Configuration
1. Create `.env` file in backend directory:
```env
DB_HOST=localhost
DB_NAME=library
DB_USER=admin
DB_PASS=secret
```
2. Initialize database using:
```bash
node backend/setupDatabase.js
```

## API Documentation
### Books Endpoint (`routes/books.js`)
- `GET /api/books` - List all books
- `POST /api/books` - Add new book
- `GET /api/books/:id` - Get book details

### Members Endpoint (`routes/members.js`)
- `GET /api/members` - List all members
- `POST /api/members` - Register new member

## Running the System
```bash
# Start backend server
node backend/server.js

# Start frontend
cd frontend
npm start
```

## Contributing
1. Fork the repository
2. Create feature branch
3. Submit PR with description

## License
MIT License