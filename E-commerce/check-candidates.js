const https = require('https');

const CANDIDATES = {
  'Running Shoes': [
    '1542291026-6eec442c47f7',  // current (broken)
    '1542219550-37153d387c27',
    '1595950653106-6c9ebd614d3a',
    '1606107557195-0e29a4b5b4aa',
    '1551107696-a4b0c5a0d9a2',
    '1556906781-9a412961c28c',
    '1543508282-6319a3e2621f',
    '1605408499391-6368c628ef42',
    '1460353581601-46225bb3f5f5',
    '1539185441755-769473a23570',
    '1531310197839-ccf54634509e'
  ],
  'Wireless Gaming Mouse': [
    '1527864550417-7f934fc03338',  // current (broken)
    '1615663245857-ac93bb7c39e7',
    '1593118247619-e2d6f056869e',
    '1527814050087-378381d6b3b5',
    '1567721913486-6585f069b332',
    '1616440302658-77e7d8b85f6e',
    '1587202372634-32705f3a111a',
    '1593642632559-0c6d3fc62b89',
    '1629429407759-01cd3d7cfb38',
    '1546435770-a3e426bf472b'
  ]
};

function check(id) {
  return new Promise(resolve => {
    const url = `https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop&q=60&auto=format`;
    https.get(url, res => {
      resolve({ id, status: res.statusCode });
    }).on('error', () => resolve({ id, status: 0 }));
  });
}

(async () => {
  for (const [label, ids] of Object.entries(CANDIDATES)) {
    console.log(`\n=== ${label} ===`);
    for (const id of ids) {
      const { id: i, status } = await check(id);
      const tag = status === 200 ? 'OK ' : 'BAD';
      const note = (id === '1542291026-6eec442c47f7' || id === '1527864550417-7f934fc03338') ? ' (current)' : '';
      console.log(`  ${tag} ${i} (${status})${note}`);
    }
  }
  process.exit(0);
})();
