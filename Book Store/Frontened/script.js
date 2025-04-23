// API base URL - replace with your actual backend URL
const API_BASE_URL = 'http://localhost:3000/api';

// Function to fetch and display books
async function fetchBooks(searchQuery = '') {
    try {
        let url;
        if (searchQuery) {
            url = `${API_BASE_URL}/books/search?q=${encodeURIComponent(searchQuery)}`;
        } else {
            url = `${API_BASE_URL}/books`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        
        const books = await response.json();
        displayBooks(books);
        
        if (searchQuery && books.length === 0) {
            showMessage('No books found matching your search', 'info');
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        showMessage('Error loading books. Please try again later.', 'error');
    }
}

// Function to display books in the UI
function displayBooks(books) {
    const container = document.getElementById('booksContainer');
    const tableBody = document.getElementById('booksTableBody');
    tableBody.innerHTML = '';

    if (books.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No books found</td>
            </tr>
        `;
        return;
    }

    books.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.price} ${book.currency}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-book" data-id="${book._id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger delete-book" data-id="${book._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners for edit and delete buttons
    setupEditDeleteButtons();
}

// Function to handle search
async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput.value.trim();
    
    try {
        const response = await fetch(`${API_BASE_URL}/books/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
            throw new Error('Search failed');
        }
        const books = await response.json();
        displayBooks(books);
        
        if (books.length === 0) {
            showMessage('No books found matching your search', 'info');
        }
    } catch (error) {
        console.error('Error searching books:', error);
        showMessage('Error searching books', 'error');
    }
}

// Function to handle adding a new book
function setupAddBookForm() {
    const form = document.getElementById('addBookForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('title').value;
            const author = document.getElementById('author').value;
            const price = document.getElementById('price').value;
            const currency = document.getElementById('currency').value;

            if (!title || !author || !price) {
                showMessage('Please fill in all fields', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/books`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        title, 
                        author, 
                        price: parseFloat(price),
                        currency
                    }),
                });

                if (response.ok) {
                    showMessage('Book added successfully!', 'success');
                    form.reset();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to add book');
                }
            } catch (error) {
                console.error('Error adding book:', error);
                showMessage(error.message || 'Error adding book. Please try again.', 'error');
            }
        });
    }
}

// Function to show messages
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type}`;
        messageDiv.textContent = message;
    }
}

// Function to get currency symbol
function getCurrencySymbol(currency) {
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'INR': '₹',
        'PKR': '₨',
        'CAD': 'C$',
        'AUD': 'A$'
    };
    return symbols[currency] || '$';
}

// Function to setup edit and delete buttons
function setupEditDeleteButtons() {
    // Edit button click handler
    document.querySelectorAll('.edit-book').forEach(button => {
        button.addEventListener('click', async (e) => {
            const bookId = e.target.closest('.edit-book').dataset.id;
            try {
                const response = await fetch(`/api/books/${bookId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch book details');
                }
                const book = await response.json();
                
                // Populate the edit form
                document.getElementById('editTitle').value = book.title;
                document.getElementById('editAuthor').value = book.author;
                document.getElementById('editPrice').value = book.price;
                document.getElementById('editCurrency').value = book.currency;
                document.getElementById('editBookId').value = bookId;
                
                // Show the edit modal
                const editModal = new bootstrap.Modal(document.getElementById('editBookModal'));
                editModal.show();
            } catch (error) {
                console.error('Error fetching book:', error);
                showMessage('Error loading book details', 'error');
            }
        });
    });

    // Delete button click handler
    document.querySelectorAll('.delete-book').forEach(button => {
        button.addEventListener('click', async (e) => {
            const bookId = e.target.closest('.delete-book').dataset.id;
            if (confirm('Are you sure you want to delete this book?')) {
                try {
                    const response = await fetch(`/api/books/${bookId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        showMessage('Book deleted successfully', 'success');
                        fetchBooks(); // Refresh the book list
                    } else {
                        throw new Error('Failed to delete book');
                    }
                } catch (error) {
                    console.error('Error deleting book:', error);
                    showMessage('Error deleting book', 'error');
                }
            }
        });
    });
}

// Function to setup edit form
function setupEditForm() {
    const form = document.getElementById('editBookForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const bookId = document.getElementById('editBookId').value;
            const title = document.getElementById('editTitle').value.trim();
            const author = document.getElementById('editAuthor').value.trim();
            const price = document.getElementById('editPrice').value.trim();
            const currency = document.getElementById('editCurrency').value;

            if (!title || !author || !price) {
                showMessage('Please fill in all fields', 'error');
                return;
            }

            try {
                const response = await fetch(`/api/books/${bookId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title,
                        author,
                        price,
                        currency
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update book');
                }

                const updatedBook = await response.json();
                showMessage('Book updated successfully!', 'success');
                
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editBookModal'));
                modal.hide();

                // Refresh the book list
                fetchBooks();
            } catch (error) {
                console.error('Error updating book:', error);
                showMessage('Error updating book', 'error');
            }
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load books on the main page
    if (document.getElementById('booksContainer')) {
        fetchBooks();
        setupEditForm();
        
        // Add event listeners for search
        const searchButton = document.getElementById('searchButton');
        const searchInput = document.getElementById('searchInput');
        
        if (searchButton) {
            searchButton.addEventListener('click', handleSearch);
        }
        
        if (searchInput) {
            // Real-time search as user types
            searchInput.addEventListener('input', () => {
                handleSearch();
            });
        }
    }

    // Setup add book form if on the add book page
    if (document.getElementById('addBookForm')) {
        setupAddBookForm();
    }
}); 