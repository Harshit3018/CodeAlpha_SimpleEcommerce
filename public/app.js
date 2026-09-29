let cart = [];
let products = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateNavAuth();
    }

    loadProducts();

    document.getElementById('home-link').addEventListener('click', (e) => {
        e.preventDefault();
        renderProducts();
    });

    document.getElementById('cart-link').addEventListener('click', (e) => {
        e.preventDefault();
        renderCart();
    });

    document.getElementById('auth-nav').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            // Logout
            currentUser = null;
            localStorage.removeItem('user');
            updateNavAuth();
            renderProducts();
        } else {
            // Show Login
            renderLogin();
        }
    });
});

function updateNavAuth() {
    const authNav = document.getElementById('auth-nav');
    if (currentUser) {
        authNav.innerHTML = `<a href="#" id="logout-nav-link">Logout (${currentUser.username})</a>`;
    } else {
        authNav.innerHTML = `<a href="#" id="login-nav-link">Login</a>`;
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        products = data.products;
        renderProducts();
    } catch (err) {
        console.error('Failed to load products', err);
    }
}

function renderProducts() {
    const main = document.getElementById('main-content');
    main.innerHTML = '<h2>Products</h2><div class="product-grid" id="product-grid"></div>';
    
    const grid = document.getElementById('product-grid');
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON') {
                renderProductDetails(product.id);
            }
        };
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>$${product.price.toFixed(2)}</p>
            <button onclick="addToCart(${product.id}, event)">Add to Cart</button>
        `;
        grid.appendChild(card);
    });
}

function renderProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="product-details">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-details-info">
                <h2>${product.name}</h2>
                <div class="price">$${product.price.toFixed(2)}</div>
                <p>${product.description}</p>
                <button onclick="addToCart(${product.id}, event)">Add to Cart</button>
                <button style="background-color: #6c757d; margin-left: 10px;" onclick="renderProducts()">Back to Products</button>
            </div>
        </div>
    `;
}

function addToCart(productId, event) {
    if (event) event.stopPropagation();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartCount();
    alert(`${product.name} added to cart!`);
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').innerText = count;
}

function renderCart() {
    const main = document.getElementById('main-content');
    if (cart.length === 0) {
        main.innerHTML = '<h2>Your Cart</h2><p>Your cart is empty.</p>';
        return;
    }

    let html = '<h2>Your Cart</h2><div id="cart-items">';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div class="cart-item">
                <span>${item.name} (x${item.quantity})</span>
                <span>$${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });

    html += `</div>
        <div class="cart-total">Total: $${total.toFixed(2)}</div>
        <button class="checkout-btn" onclick="checkout()">Checkout</button>
    `;
    main.innerHTML = html;
}

async function checkout() {
    if (!currentUser) {
        alert("Please login to place an order.");
        renderLogin();
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart, total: total, user_id: currentUser.id })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Order placed successfully! Order ID: ' + data.order_id);
            cart = [];
            updateCartCount();
            renderProducts();
        } else {
            alert('Failed to place order: ' + data.error);
        }
    } catch (err) {
        console.error('Checkout failed', err);
        alert('An error occurred during checkout.');
    }
}

// Authentication Forms
function renderLogin() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="auth-container">
            <h2>Login</h2>
            <form id="login-form">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="login-username" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="login-password" required>
                </div>
                <button type="submit">Login</button>
            </form>
            <div class="auth-switch">
                Don't have an account? <a href="#" onclick="renderRegister(); return false;">Register</a>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(currentUser));
                updateNavAuth();
                renderProducts();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Login failed");
        }
    });
}

function renderRegister() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="auth-container">
            <h2>Register</h2>
            <form id="register-form">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="reg-username" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="reg-password" required>
                </div>
                <button type="submit">Register</button>
            </form>
            <div class="auth-switch">
                Already have an account? <a href="#" onclick="renderLogin(); return false;">Login</a>
            </div>
        </div>
    `;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                alert("Registration successful! You can now login.");
                renderLogin();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Registration failed");
        }
    });
}
