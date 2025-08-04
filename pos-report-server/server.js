const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// الاتصال بقاعدة البيانات
const db = mysql.createConnection({
  host: '100.70.131.12',
  user: 'vpnuser',
  password: 'vpnpass',
  database: 'posall'
});

// جلب كل المخازن
app.get('/stores', (req, res) => {
  db.query('SELECT * FROM store', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// جلب الأصناف والكميات حسب المخزن
app.get('/batches/:storeId', (req, res) => {
  const storeId = req.params.storeId;
  db.query('SELECT item, quantity FROM batches WHERE store = ?', [storeId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// app.listen(3001, () => {
//   console.log('Server is running on port 3001');
// });


app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});