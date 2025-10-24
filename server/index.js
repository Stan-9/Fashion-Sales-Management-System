const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Database setup
const db = new sqlite3.Database('./fashion_sales.db');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    sku TEXT UNIQUE,
    size TEXT,
    color TEXT,
    brand TEXT,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    image_url TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  )`);

  // Customers table
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    order_number TEXT UNIQUE NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  )`);

  // Order items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  // Ratings table
  db.run(`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  // Insert sample data
  db.run(`INSERT OR IGNORE INTO categories (name, description) VALUES 
    ('Tops', 'Shirts, Blouses, T-shirts'),
    ('Bottoms', 'Pants, Jeans, Skirts'),
    ('Dresses', 'Casual and Formal Dresses'),
    ('Outerwear', 'Jackets, Coats, Blazers'),
    ('Accessories', 'Bags, Jewelry, Scarves')`);

  db.run(`INSERT OR IGNORE INTO products (name, description, category_id, price, cost, sku, size, color, brand, stock_quantity) VALUES 
    ('Classic White T-Shirt', 'Comfortable cotton t-shirt', 1, 29.99, 15.00, 'TSH001', 'M', 'White', 'FashionBrand', 50),
    ('Blue Denim Jeans', 'Classic straight fit jeans', 2, 79.99, 35.00, 'JNS001', '32', 'Blue', 'DenimCo', 30),
    ('Summer Dress', 'Light floral summer dress', 3, 59.99, 25.00, 'DRS001', 'M', 'Floral', 'StyleCo', 25),
    ('Leather Jacket', 'Genuine leather jacket', 4, 199.99, 120.00, 'JKT001', 'L', 'Black', 'LeatherBrand', 15),
    ('Designer Handbag', 'Luxury leather handbag', 5, 299.99, 150.00, 'BAG001', 'One Size', 'Brown', 'LuxuryBrand', 10)`);

  db.run(`INSERT OR IGNORE INTO customers (first_name, last_name, email, phone, city) VALUES 
    ('John', 'Doe', 'john.doe@email.com', '555-0123', 'New York'),
    ('Jane', 'Smith', 'jane.smith@email.com', '555-0456', 'Los Angeles'),
    ('Mike', 'Johnson', 'mike.johnson@email.com', '555-0789', 'Chicago')`);

  // Create admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, email, password, role) VALUES 
    ('admin', 'admin@fashionsales.com', '${adminPassword}', 'admin')`);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Authentication routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });
});

// Products routes
app.get('/api/products', (req, res) => {
  const { category, search, lowStock } = req.query;
  let query = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.status = 'active'
  `;
  const params = [];

  if (category) {
    query += ' AND p.category_id = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (lowStock === 'true') {
    query += ' AND p.stock_quantity <= p.min_stock_level';
  }

  query += ' ORDER BY p.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/products', authenticateToken, (req, res) => {
  const { name, description, category_id, price, cost, sku, size, color, brand, stock_quantity, min_stock_level } = req.body;
  
  db.run(
    `INSERT INTO products (name, description, category_id, price, cost, sku, size, color, brand, stock_quantity, min_stock_level) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description, category_id, price, cost, sku, size, color, brand, stock_quantity, min_stock_level],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, message: 'Product created successfully' });
    }
  );
});

app.put('/api/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description, category_id, price, cost, sku, size, color, brand, stock_quantity, min_stock_level } = req.body;
  
  db.run(
    `UPDATE products SET name = ?, description = ?, category_id = ?, price = ?, cost = ?, sku = ?, size = ?, color = ?, brand = ?, stock_quantity = ?, min_stock_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, description, category_id, price, cost, sku, size, color, brand, stock_quantity, min_stock_level, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('UPDATE products SET status = ? WHERE id = ?', ['inactive', id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// Categories routes
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Customers routes
app.get('/api/customers', (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM customers';
  const params = [];

  if (search) {
    query += ' WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/customers', (req, res) => {
  const { first_name, last_name, email, phone, address, city, state, zip_code, country } = req.body;
  
  db.run(
    `INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zip_code, country) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [first_name, last_name, email, phone, address, city, state, zip_code, country],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, message: 'Customer created successfully' });
    }
  );
});

// Orders routes
app.get('/api/orders', (req, res) => {
  const { status, customer_id } = req.query;
  let query = `
    SELECT o.*, c.first_name, c.last_name, c.email as customer_email
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
  `;
  const params = [];

  if (status || customer_id) {
    query += ' WHERE ';
    const conditions = [];
    
    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }
    
    if (customer_id) {
      conditions.push('o.customer_id = ?');
      params.push(customer_id);
    }
    
    query += conditions.join(' AND ');
  }

  query += ' ORDER BY o.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/orders', (req, res) => {
  const { customer_id, items, subtotal, tax, discount, total, payment_method, notes } = req.body;
  const order_number = 'ORD-' + Date.now();
  
  db.run(
    `INSERT INTO orders (customer_id, order_number, subtotal, tax, discount, total, payment_method, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [customer_id, order_number, subtotal, tax, discount, total, payment_method, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      const orderId = this.lastID;
      
      // Insert order items
      const itemPromises = items.map(item => {
        return new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) 
             VALUES (?, ?, ?, ?, ?)`,
            [orderId, item.product_id, item.quantity, item.unit_price, item.total_price],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      });
      
      Promise.all(itemPromises)
        .then(() => {
          res.json({ id: orderId, order_number, message: 'Order created successfully' });
        })
        .catch(err => {
          res.status(500).json({ error: 'Error creating order items' });
        });
    }
  );
});

// Ratings routes
app.post('/api/ratings', (req, res) => {
  const { product_id, rating } = req.body;
  if (!product_id || !rating) {
    return res.status(400).json({ error: 'product_id and rating are required' });
  }
  db.run(
    'INSERT INTO ratings (product_id, rating) VALUES (?, ?)',
    [product_id, rating],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, message: 'Rating saved successfully' });
    }
  );
});

app.get('/api/ratings/:productId/average', (req, res) => {
  const { productId } = req.params;
  db.get(
    'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE product_id = ?',
    [productId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ avg_rating: row?.avg_rating || 0, count: row?.count || 0 });
    }
  );
});

// Predictions route
app.get('/api/predictions', (req, res) => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const iso = threeMonthsAgo.toISOString();

  const runQuery = (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const runGet = (query, params = []) => new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || {});
    });
  });

  const productQuery = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      COALESCE(SUM(CASE WHEN o.order_date >= ? THEN oi.quantity ELSE 0 END), 0) AS qty_last_3m,
      COALESCE(SUM(CASE WHEN o.order_date >= ? THEN oi.quantity * oi.unit_price ELSE 0 END), 0) AS revenue_last_3m,
      COALESCE(SUM(oi.quantity), 0) AS qty_all_time,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue_all_time
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON o.id = oi.order_id
    WHERE p.status = 'active'
    GROUP BY p.id
  `;

  const ratingsQuery = `
    SELECT
      product_id,
      AVG(rating) AS avg_rating,
      COUNT(*) AS rating_count
    FROM ratings
    GROUP BY product_id
  `;

  const summaryQuery = `
    SELECT
      COUNT(*) AS total_orders,
      COALESCE(SUM(total), 0) AS total_revenue,
      COALESCE(AVG(total), 0) AS avg_order_value
    FROM orders
    WHERE status != 'cancelled'
  `;

  const categoryQuery = `
    SELECT
      c.name AS category_name,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON o.id = oi.order_id
    WHERE p.status = 'active'
    GROUP BY c.id
    ORDER BY total_revenue DESC
  `;

  Promise.all([
    runQuery(productQuery, [iso, iso]),
    runQuery(ratingsQuery),
    runGet(summaryQuery),
    runQuery(categoryQuery)
  ]).then(([productRows, ratingRows, summaryRow, categoryRows]) => {
    const ratingMap = new Map();
    ratingRows.forEach(r => {
      ratingMap.set(r.product_id, {
        avg_rating: Number(r.avg_rating) || 0,
        rating_count: r.rating_count || 0
      });
    });

    const products = productRows.map(r => {
      const ratings = ratingMap.get(r.product_id) || { avg_rating: 0, rating_count: 0 };
      const avgRatingValue = Number(ratings.avg_rating || 0);
      const avgMonthly = (Number(r.qty_last_3m) || 0) / 3;
      const ratingFactor = 1 + ((avgRatingValue || 0) - 3) * 0.1;
      const forecastQty = Math.max(0, avgMonthly * ratingFactor);
      return {
        product_id: r.product_id,
        product_name: r.product_name,
        avg_rating: Number(avgRatingValue.toFixed(2)),
        rating_count: ratings.rating_count,
        qty_last_3m: Number(r.qty_last_3m) || 0,
        qty_all_time: Number(r.qty_all_time) || 0,
        revenue_last_3m: Number(r.revenue_last_3m || 0),
        revenue_all_time: Number(r.revenue_all_time || 0),
        forecast_qty_next_month: Number(forecastQty.toFixed(2))
      };
    });

    const bestSellers = [...products]
      .sort((a, b) => (b.qty_last_3m || 0) - (a.qty_last_3m || 0))
      .slice(0, 5);

    const topCategory = categoryRows[0] || {};

    res.json({
      summary: {
        total_revenue: Number(summaryRow.total_revenue || 0),
        total_orders: summaryRow.total_orders || 0,
        avg_order_value: Number(summaryRow.avg_order_value || 0),
        top_category: topCategory.category_name || null,
        top_category_revenue: Number(topCategory.total_revenue || 0)
      },
      products,
      best_sellers: bestSellers
    });
  }).catch(() => {
    res.status(500).json({ error: 'Database error' });
  });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_products FROM products WHERE status = "active"',
    'SELECT COUNT(*) as total_customers FROM customers',
    'SELECT COUNT(*) as total_orders FROM orders',
    'SELECT SUM(total) as total_revenue FROM orders WHERE status = "completed"',
    'SELECT COUNT(*) as low_stock_products FROM products WHERE stock_quantity <= min_stock_level AND status = "active"'
  ];

  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    })
  )).then(results => {
    res.json({
      total_products: results[0].total_products,
      total_customers: results[1].total_customers,
      total_orders: results[2].total_orders,
      total_revenue: results[3].total_revenue || 0,
      low_stock_products: results[4].low_stock_products
    });
  }).catch(err => {
    res.status(500).json({ error: 'Database error' });
  });
});

// Serve static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
