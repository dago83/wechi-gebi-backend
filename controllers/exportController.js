const XLSX = require('xlsx');
const pool = require('../config/db');

const exportTransactionsToExcel = async (req, res) => {
  
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        date,
        type,
        amount,
        category,
        description
       FROM transactions 
       WHERE user_id = $1 
       ORDER BY date DESC, created_at DESC`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No transactions found to export' });
    }

    const formattedData = result.rows.map(row => ({
      Date: new Date(row.date).toISOString().split('T')[0],
      Type: row.type.charAt(0).toUpperCase() + row.type.slice(1),
      Amount: `${parseFloat(row.amount).toFixed(2)} ETB`,
      Category: row.category,
      Description: row.description || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `wechi-gebi-transactions-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);

    res.status(200).send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Failed to export transactions' });
  }
};

module.exports = { exportTransactionsToExcel };