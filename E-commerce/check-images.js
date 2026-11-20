const https = require('https');

const IMG_IDS = [
  '1505740420928-5e560c06d30e',  // Headphones
  '1523275335684-37898b6baf30',  // Smart Watch
  '1542291026-6eec442c47f7',     // Running Shoes
  '1553062407-98eeb64c6a62',     // Backpack
  '1608043152269-423dbba4e7e1',  // Speaker
  '1572635196237-14b3f281503f',  // Sunglasses
  '1496181133206-80ce9b88a853',  // Laptop
  '1521572163474-6864f9cf17ab',  // T-Shirt
  '1542272604-787c3835535d',     // Jeans
  '1514228742587-6b1558fcca3d',  // Mug Set
  '1507473885765-e6ed057f782c',  // Desk Lamp
  '1601925260368-ae2f83cf8b7f',  // Yoga Mat
  '1502920917128-1aa500764cbd',  // Camera
  '1561154464-82e9adf32764',     // Tablet
  '1587829741301-dc798b83add3',  // Keyboard
  '1527864550417-7f934fc03338',  // Mouse
  '1602143407151-7111542de6e8',  // Water Bottle
  '1627123424574-724758594e93',  // Wallet
  '1588850561407-ed78c282e89b',  // Baseball Cap
  '1511707171634-5f897ff02aa9'   // Smartphone
];

function check(id) {
  return new Promise(resolve => {
    const url = `https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop&q=60&auto=format`;
    https.get(url, res => {
      console.log(`${res.statusCode === 200 ? 'OK ' : 'BAD'} ${id} (${res.statusCode})`);
      resolve();
    }).on('error', () => {
      console.log(`BAD ${id} (network error)`);
      resolve();
    });
  });
}

(async () => {
  for (const id of IMG_IDS) await check(id);
  process.exit(0);
})();
