const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auth APIs
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function(err) {
        if (err) {
            return res.status(400).json({ error: "Username might already exist." });
        }
        res.json({ message: "Registration successful", user_id: this.lastID, username });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT id, username FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            res.json({ message: "Login successful", user: row });
        } else {
            res.status(401).json({ error: "Invalid username or password" });
        }
    });
});

// Products API
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ products: rows });
    });
});

app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json({ product: row });
    });
});

// Orders API
app.post('/api/orders', (req, res) => {
    const { items, total, user_id } = req.body;
    
    if (!user_id) {
        return res.status(401).json({ error: "You must be logged in to place an order." });
    }

    db.run("INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)", [user_id, total, 'Pending'], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const order_id = this.lastID;
        
        // Insert order items
        const stmt = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
        items.forEach(item => {
            stmt.run(order_id, item.id, item.quantity, item.price);
        });
        stmt.finalize();

        res.json({ message: "Order placed successfully", order_id: order_id });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
