const { run } = require('./database');

const IMG = (id, w = 700) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${w}&fit=crop&q=80&auto=format`;

const UPDATES = [
  ['Wireless Noise-Cancelling Headphones', IMG('1505740420928-5e560c06d30e')],
  ['Smart Fitness Watch Pro', IMG('1523275335684-37898b6baf30')],
  ['Lightweight Running Shoes', IMG('1542219550-37153d387c27')],
  ['Urban Explorer Backpack', IMG('1553062407-98eeb64c6a62')],
  ['Portable Bluetooth Speaker', IMG('1608043152269-423dbba4e7e1')],
  ['Polarized UV Sunglasses', IMG('1572635196237-14b3f281503f')],
  ['Ultra-Slim Laptop 14"', IMG('1496181133206-80ce9b88a853')],
  ['Premium Cotton T-Shirt', IMG('1521572163474-6864f9cf17ab')],
  ['Slim-Fit Denim Jeans', IMG('1542272604-787c3835535d')],
  ['Ceramic Coffee Mug Set', IMG('1514228742587-6b1558fcca3d')],
  ['Modern LED Desk Lamp', IMG('1507473885765-e6ed057f782c')],
  ['Premium Yoga Mat', IMG('1601925260368-ae2f83cf8b7f')],
  ['Mirrorless Camera Body', IMG('1502920917128-1aa500764cbd')],
  ['10" Android Tablet', IMG('1561154464-82e9adf32764')],
  ['Gaming Mechanical Keyboard', IMG('1587829741301-dc798b83add3')],
  ['Wireless Gaming Mouse', IMG('1593642632559-0c6d3fc62b89')],
  ['Insulated Water Bottle 750ml', IMG('1602143407151-7111542de6e8')],
  ['Leather Bifold Wallet', IMG('1627123424574-724758594e93')],
  ['Classic Baseball Cap', IMG('1588850561407-ed78c282e89b')],
  ['Smartphone 6.5" AMOLED', IMG('1511707171634-5f897ff02aa9')]
];

(async () => {
  let count = 0;
  for (const [name, img] of UPDATES) {
    const r = await run('UPDATE products SET image = ? WHERE name = ?', [img, name]);
    if (r.changes > 0) count++;
  }
  console.log(`Updated ${count} products with real Unsplash images.`);
  process.exit(0);
})();
