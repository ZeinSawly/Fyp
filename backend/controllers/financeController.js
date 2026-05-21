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
      // Get current semester for "this semester" focused metrics
      const [currentSemesterRows] = await db.promise().query(
        `SELECT id, name, term, academic_year
         FROM semesters
         WHERE is_current = 1 AND is_active = 1
         LIMIT 1`
      );
  
      const currentSemester = currentSemesterRows[0] || null;
      const currentSemesterId = currentSemester?.id || null;
  
      // ============================================================
      // 1. TOTAL COLLECTED (all time, sum of amount_paid)
      //    amount_paid is accurate even on partial-paid rows
      //    Skip parent rows (they have amount_paid=0; installments hold the real paid amount)
      // ============================================================
      const [[paidTotals]] = await db.promise().query(
        `SELECT COALESCE(SUM(amount_paid), 0) AS total_paid
         FROM student_financial_transactions
         WHERE amount_paid > 0
           AND (parent_transaction_id IS NOT NULL OR total_installments IS NULL)`
      );
  
      // ============================================================
      // 2. TOTAL OUTSTANDING (everything not yet collected)
      //    Skip parent rows of split tuitions (their installments carry the real amount)
      // ============================================================
      const [[outstandingTotals]] = await db.promise().query(
        `SELECT COALESCE(SUM(amount - COALESCE(amount_paid, 0)), 0) AS total_outstanding
         FROM student_financial_transactions
         WHERE status != 'paid'
           AND (parent_transaction_id IS NOT NULL OR total_installments IS NULL)`
      );
  
      // ============================================================
      // 3. TOTAL OVERDUE (past due_date and not paid)
      // ============================================================
      const [[overdueTotals]] = await db.promise().query(
        `SELECT 
            COALESCE(SUM(amount - COALESCE(amount_paid, 0)), 0) AS total_overdue,
            COUNT(*) AS overdue_count
         FROM student_financial_transactions
         WHERE status != 'paid'
           AND due_date IS NOT NULL
           AND due_date < CURDATE()
           AND (parent_transaction_id IS NOT NULL OR total_installments IS NULL)`
      );
  
      // ============================================================
      // 4. CURRENT SEMESTER METRICS (focused view)
      // ============================================================
      let currentSemesterStats = null;
  
      if (currentSemesterId) {
        const [[sem]] = await db.promise().query(
          `SELECT 
              COALESCE(SUM(CASE 
                WHEN amount_paid > 0 THEN amount_paid 
                ELSE 0 
              END), 0) AS collected,
              COALESCE(SUM(CASE 
                WHEN status != 'paid' THEN amount - COALESCE(amount_paid, 0)
                ELSE 0
              END), 0) AS outstanding,
              COUNT(DISTINCT student_id) AS unique_students
           FROM student_financial_transactions
           WHERE semester_id = ?
             AND (parent_transaction_id IS NOT NULL OR total_installments IS NULL)`,
          [currentSemesterId]
        );
  
        currentSemesterStats = {
          semester_name: currentSemester.name,
          collected: Number(sem.collected),
          outstanding: Number(sem.outstanding),
          unique_students: Number(sem.unique_students),
        };
      }
  
      // ============================================================
      // 5. RECENT TRANSACTIONS (last 10, excluding parent rows)
      //    Show only actual chargeable rows so the table doesn't repeat
      // ============================================================
      const [recentTransactions] = await db.promise().query(
        `SELECT 
            t.id, 
            t.student_id, 
            u.name AS student_name, 
            t.type,
            t.description, 
            t.amount,
            t.amount_paid,
            t.status,
            t.due_date,
            t.payment_date,
            CASE 
              WHEN t.status = 'paid' THEN 'paid'
              WHEN t.status != 'paid' AND t.due_date IS NOT NULL AND t.due_date < CURDATE() THEN 'overdue'
              WHEN t.amount_paid > 0 THEN 'partial'
              ELSE 'pending'
            END AS computed_status,
            s.name AS semester_name
         FROM student_financial_transactions t
         JOIN users u ON t.student_id = u.id
         LEFT JOIN semesters s ON t.semester_id = s.id
         WHERE t.parent_transaction_id IS NOT NULL OR t.total_installments IS NULL
         ORDER BY 
           COALESCE(t.payment_date, t.updated_at, t.created_at) DESC
         LIMIT 10`
      );
  
      // ============================================================
      // 6. TOTAL ACTIVE STUDENTS (enrolled in current semester)
      // ============================================================
      let totalActiveStudents = 0;
      if (currentSemesterId) {
        const [[count]] = await db.promise().query(
          `SELECT COUNT(DISTINCT student_id) AS cnt
           FROM course_enrollments
           WHERE semester_id = ?`,
          [currentSemesterId]
        );
        totalActiveStudents = Number(count.cnt);
      }
  
      return res.status(200).json({
        success: true,
        data: {
          // Existing fields (kept for backward compat with current dashboard)
          totalPaid: Number(paidTotals.total_paid),
          totalPending: Number(outstandingTotals.total_outstanding),
          totalTransactions: recentTransactions.length, // count comes from a separate query if needed
          recentTransactions,
  
          // New richer fields
          totalOverdue: Number(overdueTotals.total_overdue),
          overdueCount: Number(overdueTotals.overdue_count),
          totalActiveStudents,
          currentSemesterStats,
        }
      });
    } catch (error) {
      console.error('Finance stats error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: error.message 
      });
    }
  };

  const searchStudents = async (req, res) => {
    const { q } = req.query;
  
    if (!q || q.trim().length < 1) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }
  
    const trimmed = q.trim();
    const searchTerm = `%${trimmed}%`;
    const isNumeric = /^\d+$/.test(trimmed);
    const idValue = isNumeric ? parseInt(trimmed, 10) : null;
  
    try {
      let whereClause;
      let params;
  
      if (isNumeric) {
        whereClause = `u.id = ? OR u.name LIKE ? OR u.email LIKE ?`;
        params = [idValue, searchTerm, searchTerm];
      } else {
        whereClause = `u.name LIKE ? OR u.email LIKE ?`;
        params = [searchTerm, searchTerm];
      }
  
      const orderClause = isNumeric
        ? `CASE WHEN u.id = ? THEN 0 ELSE 1 END, u.name ASC`
        : `u.name ASC`;
  
      const orderParams = isNumeric ? [idValue] : [];
  
      const sql = `
        SELECT 
            u.id,
            u.name,
            u.email,
            u.dob,
            m.name AS major_name,
            d.name AS department_name,
            s.gpa,
            s.completed_credits,
            s.enrollment_date,
            s.campus,
            
            (SELECT COALESCE(SUM(t.amount - COALESCE(t.amount_paid, 0)), 0)
             FROM student_financial_transactions t
             WHERE t.student_id = u.id
               AND t.status != 'paid'
               AND NOT EXISTS (
                 SELECT 1 FROM student_financial_transactions child
                 WHERE child.parent_transaction_id = t.id
               )
            ) AS outstanding_balance,
            
            (SELECT COUNT(*)
             FROM student_financial_transactions t
             WHERE t.student_id = u.id
               AND t.status != 'paid'
               AND t.due_date IS NOT NULL
               AND t.due_date < CURDATE()
               AND NOT EXISTS (
                 SELECT 1 FROM student_financial_transactions child
                 WHERE child.parent_transaction_id = t.id
               )
            ) AS overdue_count
            
         FROM users u
         JOIN students s ON s.user_id = u.id
         LEFT JOIN majors m ON s.major_id = m.id
         LEFT JOIN departments d ON m.department_id = d.id
         WHERE u.role = 'student'
           AND u.status = 'active'
           AND (${whereClause})
         ORDER BY ${orderClause}
         LIMIT 20`;
    
      const [students] = await db.promise().query(sql, [...params, ...orderParams]);
  
      return res.status(200).json({
        success: true,
        data: students,
        count: students.length,
      });
    } catch (error) {
      console.error('Search students error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  };

  module.exports = {addPayment, markPaymentPaid, getStudentPendingPayments, getFinanceStats, searchStudents};