const db = require('../config/db');

// GET /api/students/:id/financial-summary
// Optional query: ?semester_id=1 to filter by a specific semester
const getFinancialSummary = async (req, res) => {
  const studentId = req.params.id;
  const { semester_id } = req.query;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: 'Student ID is required',
    });
  }

  try {
    // Build query with optional semester filter
    const params = [studentId];
    let semesterFilter = '';

    if (semester_id) {
      semesterFilter = 'AND t.semester_id = ?';
      params.push(semester_id);
    }

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
          
          -- Computed status: overdue if past due_date and not paid
          CASE 
            WHEN t.status = 'paid' THEN 'paid'
            WHEN t.status = 'pending' AND t.due_date IS NOT NULL AND t.due_date < CURDATE() THEN 'overdue'
            WHEN t.status = 'pending' AND t.amount_paid > 0 THEN 'partial'
            ELSE COALESCE(t.status, 'pending')
          END AS computed_status,
          
          -- Remaining amount to pay
          (COALESCE(t.amount, 0) - COALESCE(t.amount_paid, 0)) AS amount_remaining
          
       FROM student_financial_transactions t
       LEFT JOIN semesters s ON t.semester_id = s.id
       WHERE t.student_id = ?
         ${semesterFilter}
       ORDER BY 
         s.start_date DESC,
         t.parent_transaction_id IS NULL DESC,  -- parents first
         t.installment_number ASC,
         t.due_date ASC`,
      params
    );

    // Build semester-grouped structure
    const semesterMap = new Map();
    // Map of parent transaction ID -> array of installment rows
    const installmentsByParent = new Map();

    // First pass: collect installments under their parents
    rows.forEach((row) => {
      if (row.parent_transaction_id) {
        if (!installmentsByParent.has(row.parent_transaction_id)) {
          installmentsByParent.set(row.parent_transaction_id, []);
        }
        installmentsByParent.get(row.parent_transaction_id).push(row);
      }
    });

    // Second pass: build the response
    rows.forEach((row) => {
      // Skip child installments - they'll be nested under their parent
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

      // Get installments for this transaction (if any)
      const installments = installmentsByParent.get(row.id) || [];

      // Build the item
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
        })),
      };

      semesterGroup.items.push(item);

      // Aggregate totals
      // For items with installments, use the installments for paid/outstanding
      // For standalone items, use the item itself
      if (installments.length > 0) {
        // Parent shows the overall charge with discount info
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
        // Standalone item (fees, etc.)
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

    // Convert map to array
    const semesters = Array.from(semesterMap.values());

    // Compute grand totals across all semesters
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
        semesters,
        grand_totals: grandTotals,
      },
    });
  } catch (err) {
    console.error('Financial summary error:', err);
    return res.status(500).json({
      success: false,
      message: 'Database error',
      error: err.message,
    });
  }
};

// GET /api/students/:id/financial-semesters
// Returns just the list of semesters where the student has any transactions (for the filter dropdown)
const getStudentFinancialSemesters = async (req, res) => {
  const studentId = req.params.id;

  try {
    const [rows] = await db.promise().query(
      `SELECT DISTINCT 
          s.id, s.name, s.code, s.term, s.academic_year, s.start_date
       FROM student_financial_transactions t
       JOIN semesters s ON t.semester_id = s.id
       WHERE t.student_id = ?
       ORDER BY s.start_date DESC`,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error('Error fetching student financial semesters:', err);
    return res.status(500).json({
      success: false,
      message: 'Database error',
      error: err.message,
    });
  }
};

module.exports = { getFinancialSummary, getStudentFinancialSemesters };