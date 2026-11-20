const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database(path.join(__dirname, 'ecommerce.db'));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Real product photos from Unsplash CDN (stable IDs, hot-linked with size & quality params)
const IMG = (id, w = 700) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${w}&fit=crop&q=80&auto=format`;

const PRODUCTS = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description:
      'Premium over-ear headphones with adaptive noise cancellation, 40h battery life, hi-res audio, and plush memory-foam cushions for all-day comfort.',
    price: 89.99, originalPrice: 129.99, rating: 4.8, reviews: 1284, featured: 1,
    image: IMG('1505740420928-5e560c06d30e'),
    category: 'Electronics', stock: 25, badge: 'Best Seller'
  },
  {
    name: 'Smart Fitness Watch Pro',
    description:
      'Track heart rate, SpO2, sleep, and 100+ workouts. Built-in GPS, AMOLED display, 7-day battery, and water resistance to 5ATM.',
    price: 149.50, originalPrice: 199.00, rating: 4.6, reviews: 842, featured: 1,
    image: IMG('1523275335684-37898b6baf30'),
    category: 'Electronics', stock: 40, badge: 'New'
  },
  {
    name: 'Lightweight Running Shoes',
    description:
      'Engineered knit upper, responsive foam midsole, and durable rubber outsole. Built for daily training and long-distance comfort.',
    price: 120.00, originalPrice: null, rating: 4.7, reviews: 612, featured: 1,
    image: IMG('1542219550-37153d387c27'),
    category: 'Footwear', stock: 60, badge: null
  },
  {
    name: 'Urban Explorer Backpack',
    description:
      'Water-resistant 600D polyester, padded 16" laptop sleeve, anti-theft pocket, and ergonomic straps for all-day carry.',
    price: 59.90, originalPrice: 89.90, rating: 4.5, reviews: 421, featured: 0,
    image: IMG('1553062407-98eeb64c6a62'),
    category: 'Accessories', stock: 30, badge: 'Sale'
  },
  {
    name: 'Portable Bluetooth Speaker',
    description:
      'IPX7 waterproof, 24-hour battery, dual passive radiators for deep bass, and 360° sound. Pair two for stereo mode.',
    price: 45.00, originalPrice: 69.00, rating: 4.4, reviews: 738, featured: 0,
    image: IMG('1608043152269-423dbba4e7e1'),
    category: 'Electronics', stock: 50, badge: 'Sale'
  },
  {
    name: 'Polarized UV Sunglasses',
    description:
      'Polarized lenses with UV400 protection, lightweight aluminum frame, and spring hinges for a comfortable fit.',
    price: 35.00, originalPrice: null, rating: 4.3, reviews: 256, featured: 0,
    image: IMG('1572635196237-14b3f281503f'),
    category: 'Accessories', stock: 45, badge: null
  },
  {
    name: 'Ultra-Slim Laptop 14"',
    description:
      '14" 2.8K OLED display, latest-gen processor, 16GB RAM, 1TB SSD. All-day battery in a 1.2kg aluminum chassis.',
    price: 1299.00, originalPrice: 1499.00, rating: 4.9, reviews: 312, featured: 1,
    image: IMG('1496181133206-80ce9b88a853'),
    category: 'Electronics', stock: 12, badge: 'Premium'
  },
  {
    name: 'Premium Cotton T-Shirt',
    description:
      '100% combed ringspun cotton, pre-shrunk, side-seamed for the perfect fit. Soft hand-feel that lasts.',
    price: 24.99, originalPrice: null, rating: 4.5, reviews: 980, featured: 0,
    image: IMG('1521572163474-6864f9cf17ab'),
    category: 'Apparel', stock: 100, badge: null
  },
  {
    name: 'Slim-Fit Denim Jeans',
    description:
      'Stretch selvedge denim with a modern slim cut. Reinforced stitching and a comfortable mid-rise waist.',
    price: 79.00, originalPrice: 110.00, rating: 4.6, reviews: 502, featured: 0,
    image: IMG('1542272604-787c3835535d'),
    category: 'Apparel', stock: 70, badge: 'Sale'
  },
  {
    name: 'Ceramic Coffee Mug Set',
    description:
      'Set of 4 handcrafted stoneware mugs. Microwave and dishwasher safe. 350ml capacity.',
    price: 32.00, originalPrice: null, rating: 4.7, reviews: 188, featured: 0,
    image: IMG('1514228742587-6b1558fcca3d'),
    category: 'Home', stock: 80, badge: null
  },
  {
    name: 'Modern LED Desk Lamp',
    description:
      'Touch-controlled, 5 color temperatures, 10 brightness levels, USB charging port, and memory function.',
    price: 49.90, originalPrice: 75.00, rating: 4.5, reviews: 340, featured: 0,
    image: IMG('1507473885765-e6ed057f782c'),
    category: 'Home', stock: 35, badge: 'Sale'
  },
  {
    name: 'Premium Yoga Mat',
    description:
      '6mm thick, non-slip TPE, eco-friendly, alignment markers. Includes carrying strap.',
    price: 38.00, originalPrice: null, rating: 4.8, reviews: 264, featured: 1,
    image: IMG('1601925260368-ae2f83cf8b7f'),
    category: 'Fitness', stock: 55, badge: 'Eco'
  },
  {
    name: 'Mirrorless Camera Body',
    description:
      '24MP sensor, 4K60 video, in-body stabilization, and a tilting touchscreen. Perfect for content creators.',
    price: 999.00, originalPrice: 1199.00, rating: 4.9, reviews: 178, featured: 1,
    image: IMG('1502920917128-1aa500764cbd'),
    category: 'Electronics', stock: 8, badge: 'Hot'
  },
  {
    name: '10" Android Tablet',
    description:
      '2K display, octa-core processor, 128GB storage, stylus support, and 12-hour battery life.',
    price: 249.00, originalPrice: null, rating: 4.4, reviews: 412, featured: 0,
    image: IMG('1561154464-82e9adf32764'),
    category: 'Electronics', stock: 22, badge: null
  },
  {
    name: 'Gaming Mechanical Keyboard',
    description:
      'Hot-swappable switches, RGB backlight, PBT keycaps, and a solid aluminum frame. Wired USB-C.',
    price: 119.00, originalPrice: 159.00, rating: 4.7, reviews: 654, featured: 1,
    image: IMG('1587829741301-dc798b83add3'),
    category: 'Electronics', stock: 28, badge: 'Best Seller'
  },
  {
    name: 'Wireless Gaming Mouse',
    description:
      '25K DPI optical sensor, 8 programmable buttons, 70-hour battery, and 1ms wireless latency.',
    price: 69.00, originalPrice: null, rating: 4.6, reviews: 489, featured: 0,
    image: IMG('1593642632559-0c6d3fc62b89'),
    category: 'Electronics', stock: 42, badge: null
  },
  {
    name: 'Insulated Water Bottle 750ml',
    description:
      '24h cold, 12h hot. Stainless steel, leak-proof lid, and a powder-coated finish.',
    price: 28.00, originalPrice: 39.00, rating: 4.8, reviews: 1102, featured: 0,
    image: IMG('1602143407151-7111542de6e8'),
    category: 'Fitness', stock: 90, badge: 'Sale'
  },
  {
    name: 'Leather Bifold Wallet',
    description:
      'Full-grain Italian leather, RFID-blocking, 8 card slots, and a hidden bill compartment.',
    price: 55.00, originalPrice: null, rating: 4.5, reviews: 232, featured: 0,
    image: IMG('1627123424574-724758594e93'),
    category: 'Accessories', stock: 38, badge: null
  },
  {
    name: 'Classic Baseball Cap',
    description:
      '6-panel structured cap, breathable cotton twill, and an adjustable strap closure. One size fits most.',
    price: 22.00, originalPrice: null, rating: 4.3, reviews: 318, featured: 0,
    image: IMG('1588850561407-ed78c282e89b'),
    category: 'Apparel', stock: 75, badge: null
  },
  {
    name: 'Smartphone 6.5" AMOLED',
    description:
      'Triple-camera system, 5G connectivity, 5000mAh battery, and a vibrant 120Hz AMOLED display.',
    price: 699.00, originalPrice: 849.00, rating: 4.7, reviews: 2204, featured: 1,
    image: IMG('1511707171634-5f897ff02aa9'),
    category: 'Electronics', stock: 18, badge: 'Top Rated'
  }
];

(async () => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image TEXT,
      category TEXT,
      stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(user_id, product_id)
    );
  `);

  // Add optional columns if they don't exist
  for (const stmt of [
    "ALTER TABLE products ADD COLUMN rating REAL DEFAULT 4.5",
    "ALTER TABLE products ADD COLUMN reviews INTEGER DEFAULT 0",
    "ALTER TABLE products ADD COLUMN original_price REAL",
    "ALTER TABLE products ADD COLUMN featured INTEGER DEFAULT 0",
    "ALTER TABLE products ADD COLUMN badge TEXT"
  ]) {
    try { await run(stmt); } catch (_) { /* column already exists */ }
  }

  // Upsert seed products so the DB always has the latest images and data
  for (const p of PRODUCTS) {
    const existing = await get('SELECT id FROM products WHERE name = ?', [p.name]);
    if (existing) {
      await run(
        `UPDATE products
         SET description=?, price=?, original_price=?, rating=?, reviews=?,
             featured=?, image=?, category=?, stock=?, badge=?
         WHERE id=?`,
        [p.description, p.price, p.originalPrice, p.rating, p.reviews,
        p.featured, p.image, p.category, p.stock, p.badge, existing.id]
      );
    } else {
      await run(
        `INSERT INTO products
         (name, description, price, original_price, rating, reviews, featured,
          image, category, stock, badge)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [p.name, p.description, p.price, p.originalPrice, p.rating, p.reviews,
        p.featured, p.image, p.category, p.stock, p.badge]
      );
    }
  }
})();

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

module.exports = { db, run, get, all, hashPassword, comparePassword };
