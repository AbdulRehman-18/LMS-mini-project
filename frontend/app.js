// Library Management System - app.js
// Using proper event listeners instead of inline handlers

// API Configuration
const API = {
    baseUrl: 'http://localhost:5001/api', // Make sure this matches your backend port
    endpoints: {
        books: '/books',
        members: '/members',
        loans: '/loans',
        stats: '/stats'
    }
};

// Global state
let members = [];
let books = [];
let loans = [];
let currentSection = 'dashboard';

// API Helper Function
async function apiRequest(endpoint, options = {}) {
    const defaults = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        console.log(`Making API request to: ${API.baseUrl + endpoint}`);
        showLoading();
        const response = await fetch(API.baseUrl + endpoint, { ...defaults, ...options });
        console.log('API response status:', response.status);

        const data = await response.json();
        console.log('API response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        hideLoading();
        return data;
    } catch (error) {
        hideLoading();
        console.error('API Error:', error);
        showNotification('error', error.message);
        throw error;
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Setup event listeners
        setupEventListeners();

        // Load initial data
        await Promise.all([
            loadBooksData(),
            loadMembersData(),
            loadLoansData()
        ]);

        // Update dashboard with loaded data
        await loadDashboardData();

        // Show initial section (dashboard)
        showSection('dashboard');

        // Start datetime updates
        updateDateTime();
        setInterval(updateDateTime, 1000);

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showNotification('error', 'Failed to initialize application');
    }
});

// Utility Functions
function showNotification(type, message) {
    const notification = document.getElementById('notification');
    const icon = notification.querySelector('.notification-icon');
    const text = notification.querySelector('.notification-text');

    text.textContent = message;

    if (type === 'success') {
        notification.classList.add('bg-green-500', 'text-white');
        icon.className = 'fas fa-check-circle text-2xl mr-3';
    } else if (type === 'error') {
        notification.classList.add('bg-red-500', 'text-white');
        icon.className = 'fas fa-exclamation-circle text-2xl mr-3';
    } else if (type === 'warning') {
        notification.classList.add('bg-yellow-500', 'text-white');
        icon.className = 'fas fa-exclamation-triangle text-2xl mr-3';
    } else {
        notification.classList.add('bg-blue-500', 'text-white');
        icon.className = 'fas fa-info-circle text-2xl mr-3';
    }

    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
}

function showLoading() {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
}

// Book API Functions
const bookAPI = {
    getAll: () => apiRequest('/books'),
    getById: (id) => apiRequest(`/books/${id}`),
    create: (data) => apiRequest('/books', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/books/${id}`, {
        method: 'DELETE'
    }),
    search: (query) => apiRequest(`/books/search?q=${encodeURIComponent(query)}`)
};

// Member API Functions
const memberAPI = {
    getAll: () => apiRequest('/members'),
    getById: (id) => apiRequest(`/members/${id}`),
    create: (data) => apiRequest('/members', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/members/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/members/${id}`, {
        method: 'DELETE'
    }),
    search: (query) => apiRequest(`/members/search?q=${encodeURIComponent(query)}`),
    updateStatus: (id, status) => apiRequest(`/members/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    })
};

// Loan API Functions
const loanAPI = {
    getAll: () => apiRequest('/loans'),
    getById: (id) => apiRequest(`/loans/${id}`),
    create: (data) => apiRequest('/loans', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/loans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    getOverdue: () => apiRequest('/loans/overdue'),
    getMemberLoans: (memberId) => apiRequest(`/loans/member/${memberId}`),
    returnBook: (id) => apiRequest(`/loans/${id}/return`, {
        method: 'POST'
    }),
    updateFine: (id, amount) => apiRequest(`/loans/${id}/fine`, {
        method: 'PATCH',
        body: JSON.stringify({ amount })
    })
};

// Setup Event Listeners  
function setupEventListeners() {
    // Navigation event listeners
    setupNavigationListeners();

    // Modal event listeners
    setupModalListeners();

    // Search event listeners
    setupSearchListeners();

    // Quick action listeners
    setupQuickActionListeners();

    // Table action listeners will be setup when tables are populated
}

function setupNavigationListeners() {
    // Desktop navigation
    document.querySelectorAll('.nav-item[data-section]').forEach(button => {
        button.addEventListener('click', function () {
            const section = this.getAttribute('data-section');
            showSection(section);
            updateActiveNav(this);
        });
    });

    // Mobile navigation
    document.querySelectorAll('.nav-item-mobile[data-section]').forEach(button => {
        button.addEventListener('click', function () {
            const section = this.getAttribute('data-section');
            showSection(section);
            // Close mobile menu
            document.getElementById('mobileMenu').classList.add('hidden');
        });
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
}

function setupModalListeners() {
    // Modal open buttons
    document.querySelectorAll('[data-modal]').forEach(button => {
        button.addEventListener('click', function () {
            const modalId = this.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', function () {
            const modalId = this.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    // Close modal when clicking outside
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            const modalId = e.target.id;
            closeModal(modalId);
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            openModals.forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

function setupSearchListeners() {
    // Member search functionality would go here if needed
}

function setupQuickActionListeners() {
    // Quick action buttons
    document.querySelectorAll('.quick-action[data-modal]').forEach(button => {
        button.addEventListener('click', function () {
            const modalId = this.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    // Library-specific buttons
    const addMemberBtn = document.querySelector('.add-member-btn[data-modal]');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', function () {
            openModal('memberModal');
        });
    }

    const addBookBtn = document.querySelector('.add-book-btn[data-modal]');
    if (addBookBtn) {
        addBookBtn.addEventListener('click', function () {
            openModal('bookModal');
        });
    }

    const addLoanBtn = document.querySelector('.add-loan-btn[data-modal]');
    if (addLoanBtn) {
        addLoanBtn.addEventListener('click', function () {
            openModal('loanModal');
        });
    }
}

// Date/Time Functions
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    const dateTimeElement = document.getElementById('currentDateTime');
    const lastUpdatedElement = document.getElementById('lastUpdated');

    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleString('en-US', options);
    }
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = now.toLocaleTimeString();
    }
}

// Utility Functions
const showLoading = () => {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }
};

const hideLoading = () => {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
};

const showNotification = (title, message, type = 'info') => {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notificationIcon');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');

    if (!notification || !icon || !titleEl || !messageEl) {
        console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        return;
    }

    // Set content
    titleEl.textContent = title;
    messageEl.textContent = message;

    // Reset classes
    notification.className = 'fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 max-w-sm';

    // Set styling based on type
    if (type === 'success') {
        notification.classList.add('bg-green-500', 'text-white');
        icon.className = 'fas fa-check-circle text-2xl mr-3';
    } else if (type === 'error') {
        notification.classList.add('bg-red-500', 'text-white');
        icon.className = 'fas fa-exclamation-circle text-2xl mr-3';
    } else if (type === 'warning') {
        notification.classList.add('bg-yellow-500', 'text-white');
        icon.className = 'fas fa-exclamation-triangle text-2xl mr-3';
    } else {
        notification.classList.add('bg-blue-500', 'text-white');
        icon.className = 'fas fa-info-circle text-2xl mr-3';
    }

    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
};

// Data Loading Functions
async function loadMembers() {
    try {
        console.log('Loading members from API...');
        const response = await fetch(API.baseUrl + '/members');
        console.log('API Response:', response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Members loaded:', data);

        if (!Array.isArray(data)) {
            console.warn('Expected array of members but got:', typeof data);
            members = [];
        } else {
            members = data;
        }

        return members;
    } catch (error) {
        console.error('Error loading members:', error);
        showNotification('error', 'Failed to load members: ' + error.message);
        return [];
    }
}

async function loadBooks() {
    try {
        console.log('Loading books from API...');
        const response = await fetch(API.baseUrl + '/books');
        console.log('API Response:', response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Books loaded:', data);

        if (!Array.isArray(data)) {
            console.warn('Expected array of books but got:', typeof data);
            books = [];
        } else {
            books = data.map(book => ({
                ...book,
                available: book.copies_available > 0
            }));
        }

        return books;
    } catch (error) {
        console.error('Error loading books:', error);
        showNotification('error', 'Failed to load books: ' + error.message);
        return [];
    }
}

async function loadLoans() {
    try {
        console.log('Loading loans from API...');
        const response = await fetch(API.baseUrl + '/loans');
        console.log('API Response:', response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Loans loaded:', data);

        if (!Array.isArray(data)) {
            console.warn('Expected array of loans but got:', typeof data);
            loans = [];
        } else {
            loans = data.map(loan => ({
                ...loan,
                returned: loan.status === 'Returned',
                loan_date: loan.borrow_date
            }));
        }

        return loans;
    } catch (error) {
        console.error('Error loading loans:', error);
        showNotification('error', 'Failed to load loans: ' + error.message);
        return [];
    }
}

// Ensure dashboard statistics and analytics update dynamically from backend
async function updateDashboardStats() {
    try {
        console.log('Fetching dashboard statistics...');
        const stats = await apiRequest(API.endpoints.stats);
        console.log('Received stats:', stats);

        const elements = {
            'totalMembers': stats.total_members,
            'newMembersThisWeek': stats.new_members_this_week,
            'totalBooks': stats.total_books,
            'categoriesCount': stats.categories_count,
            'activeLoans': stats.active_loans,
            'overdueLoans': stats.overdue_loans,
            'availableBooks': stats.available_books,
            'returnedCount': stats.returned_count,
            'borrowedCount': stats.borrowed_count,
            'overdueCount': stats.overdue_count
        };

        // Update all elements, with fallback to 0 for missing values
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 0;
            } else {
                console.warn(`Element with id "${id}" not found in the dashboard`);
            }
        });

        console.log('Dashboard statistics updated successfully');
    } catch (error) {
        console.error('Failed to update dashboard stats:', error);
        showNotification('error', 'Failed to load dashboard statistics');
    }
}

async function loadBooksData() {
    try {
        books = await loadBooks();
        renderBooksGrid(books);
        return books;
    } catch (error) {
        console.error('Failed to load books:', error);
    }
}

async function loadMembersData() {
    try {
        members = await loadMembers();
        renderMembersTable(members);
        return members;
    } catch (error) {
        console.error('Failed to load members:', error);
    }
}

async function loadLoansData() {
    try {
        loans = await loadLoans();
        renderLoansTable(loans);
        return loans;
    } catch (error) {
        console.error('Failed to load loans:', error);
    }
}

// Render Functions
function renderMembersTable(members) {
    console.log('Rendering members table with data:', members);
    const tableBody = document.getElementById('membersTableBody');
    if (!tableBody) {
        console.error('Members table body element not found!');
        return;
    }

    tableBody.innerHTML = '';

    if (!members || members.length === 0) {
        console.log('No members data to display');
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-4 text-center text-gray-500">No members found</td>
            </tr>
        `;
        return;
    }

    members.forEach(member => {
        // Use membership_status from database schema
        const status = member.membership_status || 'Active';
        const statusClass = status === 'Active'
            ? 'bg-green-100 text-green-800'
            : status === 'Suspended'
                ? 'bg-red-100 text-red-800'
                : status === 'Expired'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800';

        // Get membership type - handle differences in naming between frontend and backend
        const membershipType = member.membership_type || member.membership_type || 'Standard';

        tableBody.innerHTML += `
            <tr data-member-id="${member.id}">
                <td class="py-3 px-4">${member.id}</td>
                <td class="py-3 px-4">${member.name}</td>
                <td class="py-3 px-4">${member.email}</td>
                <td class="py-3 px-4">${member.phone || 'N/A'}</td>
                <td class="py-3 px-4">${membershipType}</td>
                <td class="py-3 px-4">
                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </td>
                <td class="py-3 px-4 flex space-x-2">
                    <button class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200" data-action="edit-member">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" data-action="delete-member">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    // Setup event listeners for the edit and delete buttons
    const editButtons = document.querySelectorAll('[data-action="edit-member"]');
    const deleteButtons = document.querySelectorAll('[data-action="delete-member"]');

    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const memberId = e.target.closest('[data-member-id]').dataset.memberId;
            openEditMemberModal(memberId);
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const memberId = e.target.closest('[data-member-id]').dataset.memberId;
            handleMemberDelete(memberId);
        });
    });
}

function renderBooksGrid(books) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) {
        console.error('Books grid element not found!');
        return;
    }

    console.log('Rendering books grid with:', books);
    booksGrid.innerHTML = '';

    if (!books || books.length === 0) {
        booksGrid.innerHTML = `
            <div class="col-span-full py-8 text-center text-gray-500">
                <i class="fas fa-book-open text-4xl mb-3 opacity-30"></i>
                <p>No books found in the library.</p>
            </div>
        `;
        return;
    }

    books.forEach(book => {
        // Determine status class
        const available = book.copies_available > 0;
        const statusClass = available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const statusText = available ? 'Available' : 'Borrowed';

        booksGrid.innerHTML += `
            <div class="book-card" data-book-id="${book.id}">
                <div class="bg-gradient-to-br from-gray-100 to-blue-50 p-5 rounded-t-xl">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-bold text-gray-800 mb-2 line-clamp-2">${book.title}</h3>
                            <span class="status-badge ${statusClass} text-xs px-2 py-1">
                                ${statusText}
                            </span>
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm mb-3">${book.author}</p>
                    <div class="flex justify-between items-center">
                        <span class="bg-blue-50 text-blue-800 py-1 px-3 rounded-full text-xs font-medium">
                            ${book.category || 'Uncategorized'}
                        </span>
                        <span class="text-gray-500 text-xs">${book.publication_year || 'N/A'}</span>
                    </div>
                </div>
                <div class="p-4 bg-white rounded-b-xl flex justify-between items-center border-t border-gray-100">
                    <div class="text-xs text-gray-500">
                        ISBN: ${book.isbn || 'N/A'}
                    </div>
                    <div class="flex space-x-2">
                        <button class="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200" data-action="edit-book">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" data-action="delete-book">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    // Setup event listeners for edit and delete buttons
    document.querySelectorAll('[data-action="edit-book"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const bookId = e.target.closest('[data-book-id]').dataset.bookId;
            openEditBookModal(bookId);
        });
    });

    document.querySelectorAll('[data-action="delete-book"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const bookId = e.target.closest('[data-book-id]').dataset.bookId;
            handleBookDelete(bookId);
        });
    });
}

function renderLoansTable(loans) {
    const loansTableBody = document.getElementById('loansTableBody');
    if (!loansTableBody) {
        console.error('Loans table body element not found!');
        return;
    }

    console.log('Rendering loans table with:', loans);
    loansTableBody.innerHTML = '';

    if (!loans || loans.length === 0) {
        loansTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-4 text-center text-gray-500">No loans found</td>
            </tr>
        `;
        return;
    }

    loans.forEach(loan => {
        const now = new Date();
        const dueDate = new Date(loan.due_date);

        // Calculate status and class
        let statusClass = 'bg-blue-100 text-blue-800';
        let status = loan.status || 'Borrowed';

        if (loan.status === 'Returned') {
            statusClass = 'bg-green-100 text-green-800';
        } else if (dueDate < now) {
            status = 'Overdue';
            statusClass = 'bg-red-100 text-red-800';
        }

        loansTableBody.innerHTML += `
            <tr data-loan-id="${loan.id}">
                <td class="py-3 px-4">${loan.id}</td>
                <td class="py-3 px-4">${loan.book_title || 'Unknown Book'}</td>
                <td class="py-3 px-4">${loan.member_name || 'Unknown Member'}</td>
                <td class="py-3 px-4">${new Date(loan.borrow_date).toLocaleDateString()}</td>
                <td class="py-3 px-4">${new Date(loan.due_date).toLocaleDateString()}</td>
                <td class="py-3 px-4">
                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </td>
                <td class="py-3 px-4 flex space-x-2">
                    ${loan.status !== 'Returned' ? `
                        <button class="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" data-action="return-loan">
                            <i class="fas fa-undo-alt"></i> Return
                        </button>
                    ` : `
                        <span class="text-gray-500 text-sm">
                            Returned on ${loan.return_date ? new Date(loan.return_date).toLocaleDateString() : 'N/A'}
                        </span>
                    `}
                </td>
            </tr>
        `;
    });

    // Add event listeners for return buttons
    document.querySelectorAll('[data-action="return-loan"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const loanId = e.target.closest('[data-loan-id]').dataset.loanId;
            handleLoanReturn(loanId);
        });
    });
}

// Form Submission Handlers

async function handleBookSubmit(event) {
    event.preventDefault();
    const form = event.target;

    try {
        console.log('Book form submitted');
        showLoading();

        const bookData = {
            title: form.querySelector('[name="title"]').value,
            author: form.querySelector('[name="author"]').value,
            isbn: form.querySelector('[name="isbn"]').value,
            category: form.querySelector('[name="category"]').value,
            copies_available: parseInt(form.querySelector('[name="copiesAvailable"]').value, 10),
            total_copies: parseInt(form.querySelector('[name="copiesAvailable"]').value, 10), // Match schema
            publisher: form.querySelector('[name="publisher"]').value,
            publication_year: parseInt(form.querySelector('[name="publication_year"]').value, 10)
        };

        console.log('Book data:', bookData);

        const bookId = form.dataset.bookId;
        if (bookId) {
            // Update existing book
            await bookAPI.update(bookId, bookData);
            showNotification('success', 'Book updated successfully');
        } else {
            // Create new book
            await bookAPI.create(bookData);
            showNotification('success', 'Book added successfully');
        }

        form.reset();
        closeModal('bookModal');

        // Reload books data and update UI
        books = await loadBooks();
        renderBooksGrid(books);

        // Update dashboard stats
        await loadDashboardData();

        // Update loan dropdown since book availability changed
        populateDropdowns();

        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('error', 'Failed to save book: ' + error.message);
        console.error('Book save error:', error);
    }
}

function openEditBookModal(bookId) {
    const book = books.find(b => b.id == bookId);
    if (!book) {
        showNotification('error', 'Book not found');
        return;
    }

    const form = document.getElementById('bookForm');
    form.dataset.bookId = bookId;

    // Fill form fields
    form.querySelector('#bookTitle').value = book.title;
    form.querySelector('#bookAuthor').value = book.author;
    form.querySelector('#bookISBN').value = book.isbn;
    form.querySelector('#bookCategory').value = book.category;
    form.querySelector('#bookPublisher').value = book.publisher || '';
    form.querySelector('#bookYear').value = book.publishYear || '';
    form.querySelector('#bookCopies').value = book.copiesAvailable || 1;

    // Change button text to indicate editing
    form.querySelector('button[type="submit"]').textContent = 'Update Book';

    openModal('bookModal');
}

async function handleBookDelete(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) {
        return;
    }

    try {
        await bookAPI.delete(bookId);
        showNotification('success', 'Book deleted successfully');
        await loadBooksData();
        await updateDashboardStats();
    } catch (error) {
        showNotification('error', 'Failed to delete book: ' + error.message);
    }
}

async function handleBookSearch(event) {
    const searchInput = event.target;
    const query = searchInput.value.trim();

    if (query.length === 0) {
        await loadBooksData(); // Reset to show all books
        return;
    }

    if (query.length < 2) {
        return; // Wait for more characters
    }

    try {
        const searchResults = await bookAPI.search(query);
        renderBooksGrid(searchResults);
    } catch (error) {
        console.error('Search failed:', error);
    }
}

// Member CRUD and event handlers
function setupMemberEventListeners() {
    // Add/Edit member form
    document.getElementById('memberForm')?.addEventListener('submit', handleMemberSubmit);

    // Member search
    document.getElementById('memberSearch')?.addEventListener('input', debounce(handleMemberSearch, 300));

    // Quick actions for members (edit/delete)
    document.getElementById('membersTableBody')?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit-member"]');
        const deleteBtn = e.target.closest('[data-action="delete-member"]');
        if (editBtn) {
            const memberId = editBtn.closest('[data-member-id]').dataset.memberId;
            openEditMemberModal(memberId);
        } else if (deleteBtn) {
            const memberId = deleteBtn.closest('[data-member-id]').dataset.memberId;
            handleMemberDelete(memberId);
        }
    });
}

async function handleMemberSubmit(event) {
    event.preventDefault();
    const form = event.target;
    try {
        console.log('Member form submitted');
        showLoading();

        const memberData = {
            name: form.querySelector('[name="name"]').value,
            email: form.querySelector('[name="email"]').value,
            phone: form.querySelector('[name="phone"]').value,
            address: form.querySelector('[name="address"]').value,
            membership_status: 'Active', // Setting correct field for backend
            membershipType: form.querySelector('[name="membershipType"]').value, // Keeping for frontend reference
            membership_date: new Date().toISOString().split('T')[0]
        };

        console.log('Member data:', memberData);

        const memberId = form.dataset.memberId;
        if (memberId) {
            // When updating, ensure we preserve the existing membership status if it exists
            const existingMember = members.find(m => m.id == memberId);
            if (existingMember && existingMember.membership_status) {
                memberData.membership_status = existingMember.membership_status;
            }
            await memberAPI.update(memberId, memberData);
            showNotification('success', 'Member updated successfully');
        } else {
            await memberAPI.create(memberData);
            showNotification('success', 'Member added successfully');
        }

        form.reset();
        delete form.dataset.memberId;
        closeModal('memberModal');

        // Reload members data and update UI
        members = await loadMembers();
        renderMembersTable(members);

        // Update dashboard stats
        await loadDashboardData();

        // Populate dropdowns in case this member is used in loans
        populateDropdowns();

        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('error', 'Failed to save member: ' + error.message);
        console.error('Member save error:', error);
    }
}

function openEditMemberModal(memberId) {
    const member = members.find(m => m.id == memberId);
    if (!member) {
        showNotification('error', 'Member not found');
        return;
    }
    const form = document.getElementById('memberForm');
    form.dataset.memberId = memberId;
    form.querySelector('[name="name"]').value = member.name;
    form.querySelector('[name="email"]').value = member.email;
    form.querySelector('[name="phone"]').value = member.phone || '';
    form.querySelector('[name="address"]').value = member.address || '';

    // Set membership type if it exists in the form
    const membershipTypeField = form.querySelector('[name="membershipType"]');
    if (membershipTypeField) {
        // Default to 'Standard' if not specified
        membershipTypeField.value = member.membership_type || member.membershipType || 'Standard';
    }

    // Change button text to indicate editing
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Update Member';
    }

    openModal('memberModal');
}

async function handleMemberDelete(memberId) {
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
        await memberAPI.delete(memberId);
        showNotification('success', 'Member deleted successfully');
        await loadMembersData();
        await updateDashboardStats();
    } catch (error) {
        showNotification('error', 'Failed to delete member: ' + error.message);
    }
}

async function handleMemberSearch(event) {
    const query = event.target.value.trim();
    if (query.length === 0) {
        await loadMembersData();
        return;
    }
    if (query.length < 2) return;
    try {
        const results = await memberAPI.search(query);
        renderMembersTable(results);
    } catch (error) {
        showNotification('error', 'Search failed: ' + error.message);
    }
}

// Loan CRUD and event handlers
function setupLoanEventListeners() {
    // Add/Edit loan form
    document.getElementById('loanForm')?.addEventListener('submit', handleLoanSubmit);

    // Loan search/filter
    document.getElementById('loanStatusFilter')?.addEventListener('change', handleLoanFilter);
    document.getElementById('memberFilter')?.addEventListener('change', handleLoanFilter);
    document.getElementById('dateFilter')?.addEventListener('change', handleLoanFilter);
    document.getElementById('resetFilters')?.addEventListener('click', async () => {
        document.getElementById('loanStatusFilter').value = '';
        document.getElementById('memberFilter').value = '';
        document.getElementById('dateFilter').value = '';
        await loadLoansData();
    });

    // Loan table actions (return/view)
    document.getElementById('loansTableBody')?.addEventListener('click', (e) => {
        const returnBtn = e.target.closest('[data-action="return-loan"]');
        if (returnBtn) {
            const loanId = returnBtn.closest('[data-loan-id]').dataset.loanId;
            handleLoanReturn(loanId);
        }
        // Add more actions as needed (e.g., view history)
    });
}

async function handleLoanSubmit(event) {
    event.preventDefault();
    const form = event.target;
    try {
        console.log('Loan form submitted');
        showLoading();

        // Get today if no date provided
        const today = new Date().toISOString().split('T')[0];

        // Calculate due date (14 days from borrow date by default)
        const borrowDate = form.querySelector('[name="borrow_date"]').value || today;
        let dueDate = form.querySelector('[name="due_date"]').value;

        if (!dueDate) {
            const dueDateObj = new Date(borrowDate);
            dueDateObj.setDate(dueDateObj.getDate() + 14);
            dueDate = dueDateObj.toISOString().split('T')[0];
        }

        const loanData = {
            member_id: parseInt(form.querySelector('[name="member_id"]').value, 10),
            book_id: parseInt(form.querySelector('[name="book_id"]').value, 10),
            borrow_date: borrowDate,
            due_date: dueDate,
            status: 'Borrowed'
        };

        console.log('Loan data:', loanData);
        // Validate required fields
        if (!loanData.member_id || !loanData.book_id) {
            hideLoading();
            showNotification('error', 'Please select both a member and a book');
            return;
        }

        await loanAPI.create(loanData);
        showNotification('success', 'Loan issued successfully');
        form.reset();
        closeModal('loanModal');

        // Reload loans data and update UI
        loans = await loadLoans();
        renderLoansTable(loans);

        // Reload books as availability has changed
        books = await loadBooks();
        renderBooksGrid(books);

        // Update dashboard stats
        await loadDashboardData();

        // Repopulate dropdowns as book availability changed
        populateDropdowns();

        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('error', 'Failed to issue loan: ' + error.message);
        console.error('Loan creation error:', error);
    }
}

async function handleLoanReturn(loanId) {
    if (!confirm('Are you sure you want to mark this book as returned?')) {
        return;
    }

    try {
        showLoading();

        await loanAPI.returnBook(loanId);
        showNotification('success', 'Book returned successfully');

        // Reload loans data
        loans = await loadLoans();
        renderLoansTable(loans);

        // Reload books as availability has changed
        books = await loadBooks();
        renderBooksGrid(books);

        // Update dashboard stats
        await loadDashboardData();

        // Update loan dropdown since book availability changed
        populateDropdowns();

        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('error', 'Failed to return book: ' + error.message);
        console.error('Loan return error:', error);
    }
}

async function handleLoanFilter() {
    const status = document.getElementById('loanStatusFilter').value;
    const memberId = document.getElementById('memberFilter').value;
    const date = document.getElementById('dateFilter').value;
    let loans = await loanAPI.getAll();
    if (status) loans = loans.filter(l => l.status === status);
    if (memberId) loans = loans.filter(l => l.member_id == memberId);
    if (date) loans = loans.filter(l => l.borrow_date === date);
    renderLoansTable(loans);
}

// Initialize Application - Main Entry Point
document.addEventListener('DOMContentLoaded', async () => {
    try {
        showLoading();

        // Setup all event listeners first
        setupEventListeners();

        // Update date/time immediately and then every second
        updateDateTime();
        setInterval(updateDateTime, 1000);

        // Form submit handlers are set up in setupMemberEventListeners(), setupBookEventListeners(), setupLoanEventListeners()

        // Load all data
        members = await loadMembers();
        books = await loadBooks();
        loans = await loadLoans();

        // Populate the dropdowns for loans
        populateDropdowns();

        // Update dashboard statistics
        await updateDashboardStats();

        // Render data in tables
        renderMembersTable(members);
        renderBooksGrid(books);
        renderLoansTable(loans);

        // Initialize default section
        showSection('dashboard');

        // Setup specific event listeners
        setupMemberEventListeners();
        setupBookEventListeners();
        setupLoanEventListeners();
        setupSearchHandlers();

        // Setup auto-refresh for loans (every 5 minutes)
        setInterval(async () => {
            loans = await loadLoans();
            renderLoansTable(loans);
            updateDashboardStats();
        }, 5 * 60 * 1000);

        hideLoading();
        showNotification('success', 'Library Management System initialized successfully');
    } catch (error) {
        hideLoading();
        console.error('Failed to initialize application:', error);
        showNotification('error', 'Failed to initialize application. Please check the console for details.');
    }
});

// Populate dropdown menus for loans
function populateDropdowns() {
    // Populate member dropdown for loans
    const memberDropdown = document.getElementById('loanMember');
    if (memberDropdown) {
        memberDropdown.innerHTML = '<option value="">Select a member...</option>';
        members.forEach(member => {
            memberDropdown.innerHTML += `<option value="${member.id}">${member.name}</option>`;
        });
    }

    // Populate book dropdown for loans
    const bookDropdown = document.getElementById('loanBook');
    if (bookDropdown) {
        bookDropdown.innerHTML = '<option value="">Select a book...</option>';
        // Only show available books
        const availableBooks = books.filter(book => book.copies_available > 0);
        availableBooks.forEach(book => {
            bookDropdown.innerHTML += `<option value="${book.id}">${book.title} (${book.author})</option>`;
        });
    }

    // Populate member filter for loans page
    const memberFilter = document.getElementById('memberFilter');
    if (memberFilter) {
        memberFilter.innerHTML = '<option value="">All Members</option>';
        members.forEach(member => {
            memberFilter.innerHTML += `<option value="${member.id}">${member.name}</option>`;
        });
    }
}

// Search handlers for books and members
function setupSearchHandlers() {
    // Book search handling with advanced features
    const bookSearchInput = document.getElementById('bookSearch');
    if (bookSearchInput) {
        // Add autocomplete functionality
        setupAutocomplete(bookSearchInput, 'books');
        
        bookSearchInput.addEventListener('input', debounce(function (e) {
            const searchTerm = e.target.value.trim();

            if (searchTerm.length === 0) {
                // When search is cleared, show all books
                renderBooksGrid(books);
                return;
            }

            if (searchTerm.length < 2) return; // Wait for more characters

            // Use advanced search API for better results
            performBookSearch({ search: searchTerm });
        }, 300));
    }

    // Member search handling with advanced features
    const memberSearchInput = document.getElementById('memberSearch');
    if (memberSearchInput) {
        setupAutocomplete(memberSearchInput, 'members');
        
        memberSearchInput.addEventListener('input', debounce(function (e) {
            const searchTerm = e.target.value.trim();

            if (searchTerm.length === 0) {
                // When search is cleared, show all members
                renderMembersTable(members);
                return;
            }

            if (searchTerm.length < 2) return; // Wait for more characters

            // Use advanced search for members
            performMemberSearch({ search: searchTerm });
        }, 300));
    }

    // Advanced Search Button Handlers
    const advancedSearchBtn = document.getElementById('advancedSearchBtn');
    if (advancedSearchBtn) {
        advancedSearchBtn.addEventListener('click', () => {
            populateAdvancedSearchModal();
            openModal('advancedSearchModal');
        });
    }

    const memberAdvancedSearchBtn = document.getElementById('memberAdvancedSearchBtn');
    if (memberAdvancedSearchBtn) {
        memberAdvancedSearchBtn.addEventListener('click', () => {
            populateMemberAdvancedSearchModal();
            openModal('memberAdvancedSearchModal');
        });
    }

    // Search History Button Handlers
    const searchHistoryBtn = document.getElementById('searchHistoryBtn');
    if (searchHistoryBtn) {
        searchHistoryBtn.addEventListener('click', () => {
            loadSearchHistory('books');
            openModal('searchHistoryModal');
        });
    }

    const memberSearchHistoryBtn = document.getElementById('memberSearchHistoryBtn');
    if (memberSearchHistoryBtn) {
        memberSearchHistoryBtn.addEventListener('click', () => {
            loadSearchHistory('members');
            openModal('searchHistoryModal');
        });
    }

    // Advanced Search Form Handlers
    const executeAdvancedSearchBtn = document.getElementById('executeAdvancedSearch');
    if (executeAdvancedSearchBtn) {
        executeAdvancedSearchBtn.addEventListener('click', () => {
            executeAdvancedBookSearch();
        });
    }

    const executeMemberAdvancedSearchBtn = document.getElementById('executeAdvancedMemberSearch');
    if (executeMemberAdvancedSearchBtn) {
        executeMemberAdvancedSearchBtn.addEventListener('click', () => {
            executeAdvancedMemberSearch();
        });
    }

    // Clear Advanced Search Handlers
    const clearAdvancedSearchBtn = document.getElementById('clearAdvancedSearch');
    if (clearAdvancedSearchBtn) {
        clearAdvancedSearchBtn.addEventListener('click', () => {
            clearAdvancedSearchForm();
        });
    }

    const clearAdvancedMemberSearchBtn = document.getElementById('clearAdvancedMemberSearch');
    if (clearAdvancedMemberSearchBtn) {
        clearAdvancedMemberSearchBtn.addEventListener('click', () => {
            clearAdvancedMemberSearchForm();
        });
    }

    // Clear Search History Handlers
    const clearSearchHistoryBtn = document.getElementById('clearSearchHistory');
    if (clearSearchHistoryBtn) {
        clearSearchHistoryBtn.addEventListener('click', () => {
            clearSearchHistory();
        });
    }

    // Category and Status filters for books
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            performBookSearch({
                category: categoryFilter.value,
                search: bookSearchInput ? bookSearchInput.value : ''
            });
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            performBookSearch({
                status: statusFilter.value,
                search: bookSearchInput ? bookSearchInput.value : ''
            });
        });
    }

    // Member dashboard search handlers
    setupMemberDashboardSearch();
}
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            const category = this.value;
            const searchTerm = document.getElementById('bookSearch')?.value || '';
            
            performAdvancedBookSearch({ 
                search: searchTerm,
                category: category 
            });
        });
    }

    // Status filter for books
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function () {
            const availability = this.value;
            const searchTerm = document.getElementById('bookSearch')?.value || '';
            const category = document.getElementById('categoryFilter')?.value || '';
            
            performAdvancedBookSearch({ 
                search: searchTerm,
                category: category,
                availability: availability 
            });
        });
    }

    // Setup advanced search modal triggers
    setupAdvancedSearchModals();


// Debounce utility function to limit function calls
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

function setupBookEventListeners() {
    // Book form submit handler
    document.getElementById('bookForm')?.addEventListener('submit', handleBookSubmit);

    // Add event listeners for book actions in the grid
    const booksGrid = document.getElementById('booksGrid');
    if (booksGrid) {
        booksGrid.addEventListener('click', (e) => {
            const editBtn = e.target.closest('[data-action="edit-book"]');
            const deleteBtn = e.target.closest('[data-action="delete-book"]');

            if (editBtn) {
                const bookId = editBtn.closest('[data-book-id]').dataset.bookId;
                openEditBookModal(bookId);
            } else if (deleteBtn) {
                const bookId = deleteBtn.closest('[data-book-id]').dataset.bookId;
                handleBookDelete(bookId);
            }
        });
    }
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling while modal is open

        // If opening a modal for adding something new (not editing), reset the form
        const form = modal.querySelector('form');
        if (form && !form.dataset.bookId && !form.dataset.memberId && !form.dataset.loanId) {
            form.reset();

            // Reset any submit button text to default
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                if (modalId === 'bookModal') submitBtn.textContent = 'Add Book';
                if (modalId === 'memberModal') submitBtn.textContent = 'Create Membership';
                if (modalId === 'loanModal') submitBtn.textContent = 'Issue Book Loan';
            }
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Re-enable scrolling

        // Clear any form data-id attributes when closing
        const form = modal.querySelector('form');
        if (form) {
            delete form.dataset.bookId;
            delete form.dataset.memberId;
            delete form.dataset.loanId;
        }
    }
}

async function loadDashboardData() {
    try {
        // Update basic counters based on loaded data
        const totalMembers = members.length;
        const totalBooks = books.length;
        const activeLoans = loans.filter(loan => loan.status === 'Borrowed').length;
        const overdueLoans = loans.filter(loan => {
            return loan.status === 'Borrowed' && new Date(loan.due_date) < new Date();
        }).length;
        const availableBooks = books.reduce((sum, book) => sum + (book.copies_available || 0), 0);

        // Get today's loans and returns
        const today = new Date().toISOString().split('T')[0];
        const returnedToday = loans.filter(loan => {
            return loan.status === 'Returned' && loan.return_date && loan.return_date.startsWith(today);
        }).length;
        const borrowedToday = loans.filter(loan => loan.borrow_date && loan.borrow_date.startsWith(today)).length;

        // Calculate new members this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newMembersThisWeek = members.filter(member => {
            return new Date(member.membership_date) >= oneWeekAgo;
        }).length;

        // Count unique categories
        const categories = new Set(books.map(book => book.category).filter(Boolean)).size;

        // Update dashboard elements
        document.getElementById('totalMembers').textContent = totalMembers;
        document.getElementById('totalBooks').textContent = totalBooks;
        document.getElementById('activeLoans').textContent = activeLoans;
        document.getElementById('overdueLoans').textContent = `${overdueLoans} Overdue`;
        document.getElementById('availableBooks').textContent = availableBooks;
        document.getElementById('returnedCount').textContent = `${returnedToday} Returned`;
        document.getElementById('borrowedCount').textContent = `${borrowedToday} Borrowed`;
        document.getElementById('overdueCount').textContent = `${overdueLoans} Overdue`;
        document.getElementById('newMembersThisWeek').textContent = newMembersThisWeek;
        document.getElementById('categories').textContent = `${categories} Categories`;

        return {
            totalMembers,
            totalBooks,
            activeLoans,
            overdueLoans,
            availableBooks,
            returnedToday,
            borrowedToday,
            newMembersThisWeek,
            categories
        };
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('error', 'Failed to update dashboard statistics');
        return {};
    }
}

function showSection(sectionId) {
    // Hide all sections first
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');

        // Update the active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });

        // Update mobile nav items
        document.querySelectorAll('.nav-item-mobile').forEach(item => {
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('bg-white', 'bg-opacity-10');
            } else {
                item.classList.remove('bg-white', 'bg-opacity-10');
            }
        });

        // Save current section to global state
        currentSection = sectionId;

        // Perform section-specific actions
        if (sectionId === 'dashboard') {
            loadDashboardData();
        } else if (sectionId === 'books') {
            renderBooksGrid(books);
        } else if (sectionId === 'members') {
            renderMembersTable(members);
        } else if (sectionId === 'loans') {
            renderLoansTable(loans);
        }
    }
}

// Advanced Search Functions
async function performBookSearch(searchParams) {
    try {
        const queryParams = new URLSearchParams();
        
        if (searchParams.search) queryParams.append('search', searchParams.search);
        if (searchParams.category) queryParams.append('category', searchParams.category);
        if (searchParams.status) queryParams.append('status', searchParams.status);
        if (searchParams.author) queryParams.append('author', searchParams.author);
        if (searchParams.title) queryParams.append('title', searchParams.title);
        if (searchParams.isbn) queryParams.append('isbn', searchParams.isbn);
        if (searchParams.publisher) queryParams.append('publisher', searchParams.publisher);
        if (searchParams.yearFrom) queryParams.append('yearFrom', searchParams.yearFrom);
        if (searchParams.yearTo) queryParams.append('yearTo', searchParams.yearTo);
        if (searchParams.sortBy) queryParams.append('sortBy', searchParams.sortBy);

        const response = await apiRequest(`/search/books/advanced?${queryParams.toString()}`);
        if (response.success) {
            renderBooksGrid(response.data.books);
            
            // Save search to history if it's a user-initiated search
            if (searchParams.search || searchParams.title || searchParams.author) {
                saveSearchToHistory(searchParams.search || `${searchParams.title || ''} ${searchParams.author || ''}`.trim(), 'books');
            }
        }
    } catch (error) {
        console.error('Book search failed:', error);
        showNotification('error', 'Search failed. Please try again.');
    }
}

async function performMemberSearch(searchParams) {
    try {
        const queryParams = new URLSearchParams();
        
        if (searchParams.search) queryParams.append('search', searchParams.search);
        if (searchParams.name) queryParams.append('name', searchParams.name);
        if (searchParams.email) queryParams.append('email', searchParams.email);
        if (searchParams.phone) queryParams.append('phone', searchParams.phone);
        if (searchParams.membershipType) queryParams.append('membershipType', searchParams.membershipType);
        if (searchParams.status) queryParams.append('status', searchParams.status);
        if (searchParams.joinedFrom) queryParams.append('joinedFrom', searchParams.joinedFrom);
        if (searchParams.joinedTo) queryParams.append('joinedTo', searchParams.joinedTo);

        const response = await apiRequest(`/search/members/advanced?${queryParams.toString()}`);
        if (response.success) {
            renderMembersTable(response.data.members);
            
            // Save search to history
            if (searchParams.search || searchParams.name || searchParams.email) {
                saveSearchToHistory(searchParams.search || `${searchParams.name || ''} ${searchParams.email || ''}`.trim(), 'members');
            }
        }
    } catch (error) {
        console.error('Member search failed:', error);
        showNotification('error', 'Search failed. Please try again.');
    }
}

// Advanced Search Modal Functions
async function populateAdvancedSearchModal() {
    try {
        // Load categories for the dropdown
        const response = await apiRequest('/books/filters');
        if (response.success) {
            const categorySelect = document.getElementById('advancedCategory');
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">All Categories</option>';
                response.data.categories.forEach(category => {
                    categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Failed to load search filters:', error);
    }
}

async function populateMemberAdvancedSearchModal() {
    // Member advanced search modal is already pre-populated with static options
    // Can be enhanced to load dynamic data if needed
}

function executeAdvancedBookSearch() {
    const searchParams = {
        title: document.getElementById('advancedTitle')?.value,
        author: document.getElementById('advancedAuthor')?.value,
        isbn: document.getElementById('advancedISBN')?.value,
        publisher: document.getElementById('advancedPublisher')?.value,
        category: document.getElementById('advancedCategory')?.value,
        status: document.getElementById('advancedStatus')?.value,
        yearFrom: document.getElementById('advancedYearFrom')?.value,
        yearTo: document.getElementById('advancedYearTo')?.value,
        sortBy: document.getElementById('advancedSortBy')?.value
    };

    // Remove empty values
    Object.keys(searchParams).forEach(key => {
        if (!searchParams[key]) delete searchParams[key];
    });

    performBookSearch(searchParams);
    closeModal('advancedSearchModal');
}

function executeAdvancedMemberSearch() {
    const searchParams = {
        name: document.getElementById('advancedMemberName')?.value,
        email: document.getElementById('advancedMemberEmail')?.value,
        phone: document.getElementById('advancedMemberPhone')?.value,
        membershipType: document.getElementById('advancedMembershipType')?.value,
        status: document.getElementById('advancedMemberStatus')?.value,
        joinedFrom: document.getElementById('advancedJoinedFrom')?.value,
        joinedTo: document.getElementById('advancedJoinedTo')?.value
    };

    // Remove empty values
    Object.keys(searchParams).forEach(key => {
        if (!searchParams[key]) delete searchParams[key];
    });

    performMemberSearch(searchParams);
    closeModal('memberAdvancedSearchModal');
}

function clearAdvancedSearchForm() {
    document.getElementById('advancedTitle').value = '';
    document.getElementById('advancedAuthor').value = '';
    document.getElementById('advancedISBN').value = '';
    document.getElementById('advancedPublisher').value = '';
    document.getElementById('advancedCategory').value = '';
    document.getElementById('advancedStatus').value = '';
    document.getElementById('advancedYearFrom').value = '';
    document.getElementById('advancedYearTo').value = '';
    document.getElementById('advancedSortBy').value = 'title';
}

function clearAdvancedMemberSearchForm() {
    document.getElementById('advancedMemberName').value = '';
    document.getElementById('advancedMemberEmail').value = '';
    document.getElementById('advancedMemberPhone').value = '';
    document.getElementById('advancedMembershipType').value = '';
    document.getElementById('advancedMemberStatus').value = '';
    document.getElementById('advancedJoinedFrom').value = '';
    document.getElementById('advancedJoinedTo').value = '';
}

// Search History Functions
async function loadSearchHistory(type) {
    try {
        const response = await apiRequest(`/search/history?type=${type}&limit=20`);
        if (response.success) {
            renderSearchHistory(response.data.history);
        }
    } catch (error) {
        console.error('Failed to load search history:', error);
        // Load from localStorage as fallback
        const localHistory = getLocalSearchHistory(type);
        renderSearchHistory(localHistory);
    }
}

function renderSearchHistory(history) {
    const historyContent = document.getElementById('searchHistoryContent');
    if (!historyContent) return;

    if (!history || history.length === 0) {
        historyContent.innerHTML = '<p class="text-gray-500 text-center py-4">No search history found</p>';
        return;
    }

    historyContent.innerHTML = history.map(item => `
        <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-b border-gray-100 last:border-b-0" 
             onclick="repeatSearch('${item.search_query || item.query}', '${item.search_type || item.type}')">
            <div class="flex items-center">
                <i class="fas fa-history text-gray-400 mr-3"></i>
                <div>
                    <span class="text-sm font-medium">${item.search_query || item.query}</span>
                    <p class="text-xs text-gray-500">${item.search_type || item.type} search</p>
                </div>
            </div>
            <span class="text-xs text-gray-400">${formatSearchDate(item.created_at || item.timestamp)}</span>
        </div>
    `).join('');
}

function repeatSearch(query, type) {
    const searchInput = type === 'books' ? document.getElementById('bookSearch') : document.getElementById('memberSearch');
    if (searchInput) {
        searchInput.value = query;
        searchInput.dispatchEvent(new Event('input'));
    }
}