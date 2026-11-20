const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { db, run, get, all, hashPassword, comparePassword } = require('./database');

const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'products');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'ecommerce-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// ----- Auth -----
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const passwordHash = hashPassword(password);
    const result = await run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
    req.session.userId = result.lastID;
    req.session.userName = name;
    req.session.userEmail = email;
    res.json({ user: { id: result.lastID, name, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: { id: req.session.userId, name: req.session.userName, email: req.session.userEmail } });
});

// ----- Products -----
// Helper that includes the optional marketing columns only if they exist
function productsSelect() {
  return `SELECT id, name, description, price, image, category, stock,
                 rating, reviews, original_price, featured, badge, created_at
          FROM products`;
}

app.get('/api/products', async (req, res) => {
  try {
    const { q, category, sort } = req.query;
    let sql = productsSelect();
    const params = [];
    const where = [];
    if (q) {
      where.push('(LOWER(name) LIKE ? OR LOWER(category) LIKE ? OR LOWER(COALESCE(description, "")) LIKE ?)');
      const term = `%${String(q).toLowerCase()}%`;
      params.push(term, term, term);
    }
    if (category && category !== 'All') {
      where.push('category = ?');
      params.push(category);
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');

    switch (sort) {
      case 'price-asc': sql += ' ORDER BY price ASC'; break;
      case 'price-desc': sql += ' ORDER BY price DESC'; break;
      case 'rating': sql += ' ORDER BY rating DESC'; break;
      case 'name': sql += ' ORDER BY name ASC'; break;
      default: sql += ' ORDER BY featured DESC, id DESC';
    }
    const products = await all(sql, params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const cats = await all(
      `SELECT category AS name, COUNT(*) AS count
       FROM products
       WHERE category IS NOT NULL AND category != ''
       GROUP BY category
       ORDER BY count DESC`
    );
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    const image = req.file ? `/uploads/products/${req.file.filename}` : null;
    const result = await run(
      'INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || '', parseFloat(price), image, category || '', parseInt(stock || 0, 10)]
    );
    const product = await get('SELECT * FROM products WHERE id = ?', [result.lastID]);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await get(`${productsSelect()} WHERE id = ?`, [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- Cart -----
app.get('/api/cart', requireAuth, async (req, res) => {
  try {
    const items = await all(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`,
      [req.session.userId]
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cart/add', requireAuth, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const product = await get('SELECT id, stock FROM products WHERE id = ?', [product_id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (quantity > product.stock) {
      return res.status(400).json({ error: 'Not enough stock' });
    }
    const existing = await get('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [req.session.userId, product_id]);
    if (existing) {
      if (existing.quantity + quantity > product.stock) {
        return res.status(400).json({ error: 'Not enough stock' });
      }
      await run('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing.id]);
    } else {
      await run('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.session.userId, product_id, quantity]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cart/update', requireAuth, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const product = await get('SELECT stock FROM products WHERE id = ?', [product_id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (quantity > product.stock) {
      return res.status(400).json({ error: 'Not enough stock' });
    }
    if (quantity <= 0) {
      await run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.session.userId, product_id]);
    } else {
      await run('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', [quantity, req.session.userId, product_id]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cart/remove', requireAuth, async (req, res) => {
  try {
    const { product_id } = req.body;
    await run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.session.userId, product_id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- Orders -----
app.post('/api/checkout', requireAuth, async (req, res) => {
  try {
    const items = await all(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`,
      [req.session.userId]
    );
    if (items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    for (const item of items) {
      if (item.quantity > item.stock) {
        return res.status(400).json({ error: `Not enough stock for product ${item.product_id}` });
      }
    }
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await run('BEGIN TRANSACTION');
    const orderResult = await run(
      'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)',
      [req.session.userId, total, 'completed']
    );
    for (const item of items) {
      await run(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderResult.lastID, item.product_id, item.quantity, item.price]
      );
      await run(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }
    await run('DELETE FROM cart_items WHERE user_id = ?', [req.session.userId]);
    await run('COMMIT');

    res.json({ ok: true, orderId: orderResult.lastID, total });
  } catch (err) {
    try { await run('ROLLBACK'); } catch (_) { }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const orders = await all(
      'SELECT id, total, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.session.userId]
    );
    for (const order of orders) {
      order.items = await all(
        `SELECT oi.quantity, oi.price, p.name, p.image
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [order.id]
      );
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`E-commerce server running on http://localhost:${PORT}`);
});
