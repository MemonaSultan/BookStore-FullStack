const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./db');
const Book = require('./models/Book');

const app = express();
const port = 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

// Search books by title or author (This route must come BEFORE the get by ID route)
app.get('/api/books/search', async (req, res) => {
    try {
        const searchQuery = req.query.q;
        if (!searchQuery) {
            const books = await Book.find().sort({ createdAt: -1 });
            return res.json(books);
        }

        const books = await Book.find({
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { author: { $regex: searchQuery, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });

        res.json(books);
    } catch (error) {
        console.error('Error searching books:', error);
        res.status(500).json({ error: 'Error searching books' });
    }
});

// Get all books
app.get('/api/books', async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching books' });
    }
});

// Get a single book by ID
app.get('/api/books/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ error: 'Error fetching book' });
    }
});

// Add a new book
app.post('/api/books', async (req, res) => {
    try {
        const { title, author, price, currency } = req.body;
        
        if (!title || !author || !price || !currency) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newBook = new Book({
            title,
            author,
            price: Number(price),
            currency
        });

        const savedBook = await newBook.save();
        res.status(201).json(savedBook);
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ error: 'Error creating book' });
    }
});

// Update a book
app.put('/api/books/:id', async (req, res) => {
    try {
        const { title, author, price, currency } = req.body;
        
        if (!title || !author || !price || !currency) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const updatedBook = await Book.findByIdAndUpdate(
            req.params.id,
            {
                title,
                author,
                price: Number(price),
                currency
            },
            { new: true }
        );

        if (!updatedBook) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json(updatedBook);
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ error: 'Error updating book' });
    }
});

// Delete a book
app.delete('/api/books/:id', async (req, res) => {
    try {
        const deletedBook = await Book.findByIdAndDelete(req.params.id);
        
        if (!deletedBook) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ error: 'Error deleting book' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 