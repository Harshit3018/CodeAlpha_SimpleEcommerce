const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'ecommerce.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create tables
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                description TEXT,
                price REAL,
                image TEXT
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                total REAL,
                status TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                product_id INTEGER,
                quantity INTEGER,
                price REAL,
                FOREIGN KEY(order_id) REFERENCES orders(id),
                FOREIGN KEY(product_id) REFERENCES products(id)
            )`);

            // Insert dummy products if empty
            db.get("SELECT count(*) as count FROM products", (err, row) => {
                if (row.count === 0) {
                    const insert = 'INSERT INTO products (name, description, price, image) VALUES (?,?,?,?)';
                    db.run(insert, ["Laptop", "High performance laptop", 999.99, "https://via.placeholder.com/150"]);
                    db.run(insert, ["Smartphone", "Latest model smartphone", 499.99, "https://via.placeholder.com/150"]);
                    db.run(insert, ["Headphones", "Noise cancelling headphones", 149.99, "https://via.placeholder.com/150"]);
                }
            });
            
            // Insert dummy user
            db.get("SELECT count(*) as count FROM users", (err, row) => {
                if (row.count === 0) {
                    db.run('INSERT INTO users (username, password) VALUES (?,?)', ["testuser", "password123"]);
                }
            });
        });
    }
});

module.exports = db;
