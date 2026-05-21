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

  const getStudentAccount = async (req, res) => {
    const { student_id } = req.params;
  
    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required',
      });
    }
  
    try {
      // ============================================================
      // 1. STUDENT DETAILS
      // ============================================================
      const [[student]] = await db.promise().query(
        `SELECT 
            u.id,
            u.name,
            u.email,
            u.dob,
            u.phone,
            u.status,
            s.gpa,
            s.completed_credits,
            s.enrollment_date,
            s.campus,
            m.id AS major_id,
            m.name AS major_name,
            m.degree_type,
            m.total_credits_required,
            d.id AS department_id,
            d.name AS department_name
         FROM users u
         JOIN students s ON s.user_id = u.id
         LEFT JOIN majors m ON s.major_id = m.id
         LEFT JOIN departments d ON m.department_id = d.id
         WHERE u.id = ? AND u.role = 'student'`,
        [student_id]
      );
  
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }
  
      // ============================================================
      // 2. ACTIVE DISCOUNTS
      // ============================================================
      const [discounts] = await db.promise().query(
        `SELECT 
            sd.id,
            sd.percentage,
            sd.fixed_amount,
            sd.semester_id,
            sd.academic_year,
            sd.reason,
            sd.status,
            sd.created_at,
            dt.code AS type_code,
            dt.name AS type_name,
            dt.scope,
            dt.calculation,
            dt.applies_to,
            sem.name AS semester_name,
            approver.name AS approver_name
         FROM student_discounts sd
         JOIN discount_types dt ON sd.discount_type_id = dt.id
         LEFT JOIN semesters sem ON sd.semester_id = sem.id
         LEFT JOIN users approver ON sd.approved_by = approver.id
         WHERE sd.student_id = ?
         ORDER BY sd.created_at DESC`,
        [student_id]
      );
  
      // ============================================================
      // 3. FINANCIAL TRANSACTIONS (grouped by semester, installments nested)
      // ============================================================
      const [rows] = await db.promise().query(
        `SELECT 
            t.id,
            t.student_id,
            t.semester_id,
            t.payment_id,
            t.parent_transaction_id,
            t.installment_number,
            t.total_installments,
            t.type,
            t.description,
            t.due_date,
            t.payment_date,
            t.amount,
            t.amount_paid,
            t.discount_amount,
            t.original_amount,
            t.status,
            t.created_at,
            t.updated_at,
            s.name AS semester_name,
            s.code AS semester_code,
            s.term AS semester_term,
            s.academic_year,
            
            CASE 
              WHEN t.status = 'paid' THEN 'paid'
              WHEN t.status = 'pending' AND t.due_date IS NOT NULL AND t.due_date < CURDATE() THEN 'overdue'
              WHEN t.status = 'pending' AND t.amount_paid > 0 THEN 'partial'
              ELSE COALESCE(t.status, 'pending')
            END AS computed_status,
            
            (COALESCE(t.amount, 0) - COALESCE(t.amount_paid, 0)) AS amount_remaining
            
         FROM student_financial_transactions t
         LEFT JOIN semesters s ON t.semester_id = s.id
         WHERE t.student_id = ?
         ORDER BY 
           s.start_date DESC,
           t.parent_transaction_id IS NULL DESC,
           t.installment_number ASC,
           t.due_date ASC`,
        [student_id]
      );
  
      // Group transactions: nest installments under parents, group all by semester
      const semesterMap = new Map();
      const installmentsByParent = new Map();
  
      rows.forEach((row) => {
        if (row.parent_transaction_id) {
          if (!installmentsByParent.has(row.parent_transaction_id)) {
            installmentsByParent.set(row.parent_transaction_id, []);
          }
          installmentsByParent.get(row.parent_transaction_id).push(row);
        }
      });
  
      rows.forEach((row) => {
        if (row.parent_transaction_id) return;
  
        const semesterKey = row.semester_id || 'no_semester';
        const semesterLabel = row.semester_name || 'General Charges';
  
        if (!semesterMap.has(semesterKey)) {
          semesterMap.set(semesterKey, {
            semester_id: row.semester_id,
            semester_name: semesterLabel,
            semester_code: row.semester_code,
            academic_year: row.academic_year,
            term: row.semester_term,
            items: [],
            totals: {
              total_charged: 0,
              total_discount: 0,
              total_paid: 0,
              total_outstanding: 0,
              total_overdue: 0,
            },
          });
        }
  
        const semesterGroup = semesterMap.get(semesterKey);
        const installments = installmentsByParent.get(row.id) || [];
  
        const item = {
          id: row.id,
          type: row.type,
          description: row.description,
          amount: Number(row.amount || 0),
          original_amount: Number(row.original_amount || 0),
          discount_amount: Number(row.discount_amount || 0),
          amount_paid: Number(row.amount_paid || 0),
          amount_remaining: Number(row.amount_remaining || 0),
          due_date: row.due_date,
          payment_date: row.payment_date,
          status: row.computed_status,
          payment_id: row.payment_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          has_installments: installments.length > 0,
          installments: installments.map((inst) => ({
            id: inst.id,
            installment_number: inst.installment_number,
            total_installments: inst.total_installments,
            amount: Number(inst.amount || 0),
            amount_paid: Number(inst.amount_paid || 0),
            amount_remaining: Number(inst.amount_remaining || 0),
            due_date: inst.due_date,
            payment_date: inst.payment_date,
            status: inst.computed_status,
            payment_id: inst.payment_id,
          })),
        };
  
        semesterGroup.items.push(item);
  
        if (installments.length > 0) {
          semesterGroup.totals.total_charged += Number(row.original_amount || row.amount || 0);
          semesterGroup.totals.total_discount += Number(row.discount_amount || 0);
  
          installments.forEach((inst) => {
            semesterGroup.totals.total_paid += Number(inst.amount_paid || 0);
            const remaining = Number(inst.amount_remaining || 0);
            if (inst.computed_status !== 'paid') {
              semesterGroup.totals.total_outstanding += remaining;
              if (inst.computed_status === 'overdue') {
                semesterGroup.totals.total_overdue += remaining;
              }
            }
          });
        } else {
          semesterGroup.totals.total_charged += Number(row.original_amount || row.amount || 0);
          semesterGroup.totals.total_discount += Number(row.discount_amount || 0);
          semesterGroup.totals.total_paid += Number(row.amount_paid || 0);
  
          if (row.computed_status !== 'paid') {
            semesterGroup.totals.total_outstanding += Number(row.amount_remaining || 0);
            if (row.computed_status === 'overdue') {
              semesterGroup.totals.total_overdue += Number(row.amount_remaining || 0);
            }
          }
        }
      });
  
      const semesters = Array.from(semesterMap.values());
  
      const grandTotals = semesters.reduce(
        (acc, s) => ({
          total_charged: acc.total_charged + s.totals.total_charged,
          total_discount: acc.total_discount + s.totals.total_discount,
          total_paid: acc.total_paid + s.totals.total_paid,
          total_outstanding: acc.total_outstanding + s.totals.total_outstanding,
          total_overdue: acc.total_overdue + s.totals.total_overdue,
        }),
        {
          total_charged: 0,
          total_discount: 0,
          total_paid: 0,
          total_outstanding: 0,
          total_overdue: 0,
        }
      );
  
      return res.status(200).json({
        success: true,
        data: {
          student,
          discounts,
          semesters,
          grand_totals: grandTotals,
        },
      });
    } catch (error) {
      console.error('Get student account error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  };

  module.exports = {addPayment, markPaymentPaid, getStudentPendingPayments, getFinanceStats, searchStudents, getStudentAccount};