
# 📚 Library Management System

A **full-stack** application designed to simplify and streamline library operations — including **book cataloging**, **member management**, and **loan tracking** — all in one place.

---

## 🚀 Features

* 📚 **Book Management** — Add, update, delete, and view books.
* 👥 **Member Handling** — Register and track library members.
* 🔄 **Loan System** — Issue and return books with history tracking.
* 📊 **Statistics Dashboard** — Real-time stats on books, members, and loans.
* 🛠️ **RESTful API** — Clean and scalable backend services.
* 💻 **Responsive Web Interface** — Built with modern web standards.

---

## 🛠 Tech Stack

**Backend**

* [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
* [MySQL](https://www.mysql.com/) / [MariaDB](https://mariadb.org/)
* [Sequelize ORM](https://sequelize.org/)

**Frontend**

* HTML5, CSS3
* Vanilla JavaScript
* Tailwind CSS *(Optional enhancement)*

---

## 📦 Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/library-management-system.git
cd library-management-system
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### Create Environment File

Inside the `backend/` folder, create a `.env` file:

```env
DB_HOST=localhost
DB_NAME=library
DB_USER=admin
DB_PASS=secret
```

### Initialize the Database

```bash
node backend/setupDatabase.js
```

> ⚠️ Ensure MySQL service is running and credentials match your setup.

---

## 📡 API Endpoints

### 📘 Books (`routes/books.js`)

| Method | Endpoint         | Description           |
| ------ | ---------------- | --------------------- |
| GET    | `/api/books`     | Fetch all books       |
| POST   | `/api/books`     | Add a new book        |
| GET    | `/api/books/:id` | Get details of a book |

### 👤 Members (`routes/members.js`)

| Method | Endpoint       | Description           |
| ------ | -------------- | --------------------- |
| GET    | `/api/members` | List all members      |
| POST   | `/api/members` | Register a new member |

> Additional endpoints can be added for editing and deleting resources.

---

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
node server.js
```

### Start Frontend Server

```bash
cd ../frontend
npm start
```

Access your app at [http://localhost:3000](http://localhost:3000)

---

## 🤝 Contributing

1. **Fork** the repository
2. Create your **feature branch**:
   `git checkout -b feature/YourFeature`
3. **Commit** your changes:
   `git commit -m "Add: Your feature summary"`
4. **Push** to the branch:
   `git push origin feature/YourFeature`
5. Open a **Pull Request**

---

## 📄 License

This project is licensed under the **MIT License**.
Feel free to use and adapt it for your needs.

---
