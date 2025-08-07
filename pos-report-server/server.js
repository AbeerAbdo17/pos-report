const express = require('express');
const mysql = require('mysql2/promise'); // مهم: عشان تقدر تستخدم await مع execute
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// الاتصال بقاعدة البيانات
const db = mysql.createPool({
  host: '100.70.131.12',
  user: 'vpnuser',
  password: 'vpnpass',
  database: 'posall'
});

// جلب كل المخازن
app.get('/stores', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM store');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب الأصناف والكميات حسب المخزن
app.get('/batches/:storeId', async (req, res) => {
  try {
    const storeId = req.params.storeId;
    const [results] = await db.query('SELECT item, quantity FROM batches WHERE store = ?', [storeId]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تقرير المبيعات
app.get('/sales-report', async (req, res) => {
  const { fdate, ldate } = req.query;

  const query = `
    SELECT
      saledets.item_name AS item_name,
      SUM(saledets.QTY) AS total_qty,
      SUM(saledets.tp) AS total_sales
    FROM saledets
    WHERE saledets.GS BETWEEN ? AND ?
      AND refund = 0
    GROUP BY saledets.item_name
  `;

  try {
    const [rows] = await db.execute(query, [fdate, ldate]);

    const totals = rows.reduce(
      (acc, row) => {
        acc.total_qty += row.total_qty;
        acc.total_sales += row.total_sales;
        return acc;
      },
      { total_qty: 0, total_sales: 0 }
    );

    res.json({ data: rows, totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/account-statement', async (req, res) => {
  const { sub_no, fdate, ldate } = req.query;

  try {
    const [rows] = await db.query(`
      SET @running_balance := 0;
    `);

    const [result] = await db.query(`
      SELECT
          j.journal_no,
          j.journal_date,
          j.journal_docno,
          j.journal_dr,
          j.journal_cr,
          CASE
              WHEN s.concatenated_items IS NOT NULL THEN
                  CONCAT('مبيعات: "', s.concatenated_items, '"')
              WHEN p.concatenated_purchases IS NOT NULL THEN
                  CONCAT('مشتريات: "', p.concatenated_purchases, '"')
              ELSE j.journal_desc
          END AS journal_desc,
          sm.submain_name,
          @running_balance := @running_balance + (j.journal_dr - j.journal_cr) AS final_balance,
          (
            SELECT SUM(journal_dr) - SUM(journal_cr)
            FROM journal
            WHERE journal_submain_no = ?
          ) AS overall_balance,
          (
              SELECT SUM(journal_dr) - SUM(journal_cr)
              FROM journal
              WHERE journal_submain_no = ?
                AND journal_date BETWEEN ? AND ?
          ) AS period_balance,
          CASE
              WHEN s.concatenated_items IS NOT NULL THEN 'مبيعات'
              WHEN p.concatenated_purchases IS NOT NULL THEN 'مشتريات'
              ELSE 'قيد يومية'
          END AS operation_type
      FROM
          journal j
      INNER JOIN
          submain sm ON j.journal_submain_no = sm.submain_no
      LEFT JOIN (
          SELECT
              fk,
              GROUP_CONCAT(CONCAT(COALESCE(qty, '0'), ' ', COALESCE(item_name, 'Unknown')) SEPARATOR ', ') AS concatenated_items
          FROM
              saledets
          GROUP BY fk
      ) s ON j.sale_inv = s.fk
      LEFT JOIN (
          SELECT
              invoice_no,
              GROUP_CONCAT(CONCAT(COALESCE(item_qty, '0'), ' ', COALESCE(item_name, 'Unknown')) SEPARATOR ', ') AS concatenated_purchases
          FROM
              purchases_det
          GROUP BY invoice_no
      ) p ON j.purchase_inv = p.invoice_no,
      (SELECT @running_balance := 0) init_balance
      WHERE
          j.journal_submain_no = ?
          AND j.journal_date BETWEEN ? AND ?
      ORDER BY
          j.journal_date, j.journal_no, j.id
    `, [sub_no, sub_no, fdate, ldate, sub_no, fdate, ldate]);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'فشل في تحميل التقرير' });
  }
});


// البحث عن الحسابات بالاسم
app.get('/accounts', async (req, res) => {
  const { search } = req.query;

  try {
    const [rows] = await db.query(
      `SELECT submain_no AS sub_no, submain_name AS name 
       FROM submain 
       WHERE submain_name LIKE ? 
       LIMIT 20`,
      [`%${search}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error('فشل في جلب الحسابات:', err);
    res.status(500).json({ error: 'خطأ في الخادم أثناء جلب الحسابات' });
  }
});


// تشغيل السيرفر
app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});
