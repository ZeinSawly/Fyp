const db = require('../config/db');



const addPayment = async (req, res) => {
    const { major_id, type, description, due_date, amount } = req.body;
  
    if (!major_id || !description || !due_date || !amount) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      // 1. Insert into major_payments
      const [paymentResult] = await db.promise().query(
        `INSERT INTO major_payments (major_id, type, description, due_date, amount)
         VALUES (?, ?, ?, ?, ?)`,
        [major_id, type || 'tuition', description, due_date, amount]
      );
  
      const payment_id = paymentResult.insertId;
  
      // 2. Get all students in that major
      const [students] = await db.promise().query(
        `SELECT user_id FROM students WHERE major_id = ?`,
        [major_id]
      );
  
      if (students.length === 0) {
        return res.status(200).json({
          message: 'Payment created but no students found in this major',
          payment_id
        });
      }
  
      // 3. Bulk insert into student_financial_transactions
      const values = students.map(s => [
        s.user_id,
        payment_id,
        type || 'tuition',
        description,
        due_date,
        amount,
        0.00,
        'pending'
      ]);
  
      await db.promise().query(
        `INSERT INTO student_financial_transactions
         (student_id, payment_id, type, description, due_date, amount, amount_paid, status)
         VALUES ?`,
        [values]
      );
  
      return res.status(201).json({
        message: `Payment added successfully for ${students.length} student(s)`,
        payment_id,
        students_affected: students.length
      });
  
    } catch (error) {
      console.error('Add payment error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


  const markPaymentPaid = async (req, res) => {
    const { transaction_id, amount_paid, payment_date } = req.body;
  
    if (!transaction_id || !amount_paid || !payment_date) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      const [result] = await db.promise().query(
        `UPDATE student_financial_transactions
         SET status = 'paid',
             amount_paid = ?,
             payment_date = ?
         WHERE id = ? AND status = 'pending'`,
        [amount_paid, payment_date, transaction_id]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Transaction not found or already paid' });
      }
  
      return res.status(200).json({ message: 'Payment marked as completed' });
  
    } catch (error) {
      console.error('Mark payment paid error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


  const getStudentPendingPayments = async (req, res) => {
    const { student_id } = req.params;
  
    try {
      const [rows] = await db.promise().query(
        `SELECT id, description, amount, amount_paid, due_date, type
         FROM student_financial_transactions
         WHERE student_id = ? AND status = 'pending'
         ORDER BY due_date ASC`,
        [student_id]
      );
  
      return res.status(200).json({ success: true, data: rows });
  
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  const getFinanceStats = async (req, res) => {
    try {
      const [[paid]] = await db.promise().query(
        `SELECT COALESCE(SUM(amount_paid), 0) AS totalPaid FROM student_financial_transactions WHERE status = 'paid'`
      );
      const [[pending]] = await db.promise().query(
        `SELECT COALESCE(SUM(amount), 0) AS totalPending FROM student_financial_transactions WHERE status = 'pending'`
      );
      const [[total]] = await db.promise().query(
        `SELECT COUNT(*) AS totalTransactions FROM student_financial_transactions`
      );
      const [recent] = await db.promise().query(
        `SELECT t.id, t.student_id, u.name AS student_name, t.description, t.amount, t.status, t.due_date
         FROM student_financial_transactions t
         JOIN users u ON t.student_id = u.id
         ORDER BY t.id DESC LIMIT 10`
      );
      return res.status(200).json({
        success: true,
        data: {
          totalPaid: paid.totalPaid,
          totalPending: pending.totalPending,
          totalTransactions: total.totalTransactions,
          recentTransactions: recent,
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  module.exports = {addPayment, markPaymentPaid, getStudentPendingPayments, getFinanceStats};