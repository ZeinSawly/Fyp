const db = require('../config/db');

// GET /api/students/:id/financial-summary
const getFinancialSummary = (req, res) => {
  const studentId = req.params.id;

  const sql = `
    SELECT
      id,
      description,
      due_date,
      payment_date,
      amount,
      amount_paid,
      status
    FROM student_financial_transactions
    WHERE student_id = ?
    ORDER BY due_date ASC, payment_date DESC
  `;

  db.query(sql, [studentId], (err, rows) => {
    if (err) {
      console.error('Financial summary error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    const pending = [];
    const completed = [];

    let totalOutstanding = 0;
    let totalPaid = 0;

    rows.forEach(row => {
      if (row.status === 'paid') {
        completed.push(row);
        totalPaid += Number(row.amount_paid || row.amount || 0);
      } else {
        pending.push(row);
        const remaining = Number(row.amount) - Number(row.amount_paid || 0);
        totalOutstanding += remaining > 0 ? remaining : 0;
      }
    });

    return res.json({
      pending,
      completed,
      totals: {
        total_outstanding: totalOutstanding,
        total_paid: totalPaid,
      },
    });
  });
};

module.exports = { getFinancialSummary };