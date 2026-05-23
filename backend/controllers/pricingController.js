const db = require('../config/db');

// ============================================================
// GET CURRENT CREDIT PRICES (one active row per major)
// ============================================================
const getCurrentCreditPrices = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT 
          m.id AS major_id,                    -- ← use major's id directly
          m.name AS major_name,
          m.degree_type,
          d.name AS department_name,
          cp.id AS pricing_id,                 -- rename so we don't shadow
          cp.price_per_credit,
          cp.effective_from,
          cp.effective_until,
          cp.created_at
       FROM majors m
       LEFT JOIN credit_pricing cp 
         ON cp.major_id = m.id 
         AND cp.effective_from <= CURDATE()
         AND (cp.effective_until IS NULL OR cp.effective_until >= CURDATE())
       LEFT JOIN departments d ON m.department_id = d.id
       ORDER BY d.name, m.name`
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get current credit prices error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message,
    });
  }
};

// ============================================================
// GET CREDIT PRICING HISTORY (for a specific major or all)
// ============================================================
const getCreditPricingHistory = async (req, res) => {
  const { major_id } = req.query;

  try {
    const params = [];
    let whereClause = '';
    if (major_id) {
      whereClause = 'WHERE cp.major_id = ?';
      params.push(major_id);
    }

    const [rows] = await db.promise().query(
      `SELECT 
          cp.id,
          cp.major_id,
          cp.price_per_credit,
          cp.effective_from,
          cp.effective_until,
          cp.created_at,
          m.name AS major_name,
          m.degree_type,
          d.name AS department_name,
          CASE 
            WHEN cp.effective_from <= CURDATE() 
                 AND (cp.effective_until IS NULL OR cp.effective_until >= CURDATE())
            THEN 1 ELSE 0
          END AS is_active
       FROM credit_pricing cp
       JOIN majors m ON cp.major_id = m.id
       LEFT JOIN departments d ON m.department_id = d.id
       ${whereClause}
       ORDER BY m.name, cp.effective_from DESC`,
      params
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get credit pricing history error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE / SET CREDIT PRICE FOR A MAJOR
// Handles the effective-dating dance:
//   - Closes the current row (sets effective_until = effective_from - 1 day)
//   - Inserts the new row
// ============================================================
const updateCreditPrice = async (req, res) => {
  const { major_id, price_per_credit, effective_from } = req.body;

  if (!major_id || price_per_credit === undefined || !effective_from) {
    return res.status(400).json({
      success: false,
      message: 'major_id, price_per_credit, and effective_from are required',
    });
  }

  const priceNum = Number(price_per_credit);
  if (isNaN(priceNum) || priceNum < 0) {
    return res.status(400).json({
      success: false,
      message: 'Price must be a non-negative number',
    });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verify the major exists
    const [majorCheck] = await connection.query(
      `SELECT id FROM majors WHERE id = ?`,
      [major_id]
    );

    if (majorCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Major not found',
      });
    }

    // 2. Find current active price for this major
    const [currentRows] = await connection.query(
      `SELECT id, effective_from, price_per_credit
       FROM credit_pricing
       WHERE major_id = ?
         AND effective_from <= CURDATE()
         AND (effective_until IS NULL OR effective_until >= CURDATE())
       FOR UPDATE`,
      [major_id]
    );

    // 3. Prevent setting effective_from in the past (would break invariant)
    const newEffectiveDate = new Date(effective_from);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newEffectiveDate < today) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'effective_from cannot be in the past',
      });
    }

    // 4. If there's an existing active price, close it
    if (currentRows.length > 0) {
      const current = currentRows[0];

      // Don't allow setting an effective_from earlier than the current row's
      if (new Date(effective_from) <= new Date(current.effective_from)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'New effective date must be after the current price\'s effective date',
        });
      }

      // If price is unchanged, no-op
      if (Number(current.price_per_credit) === priceNum) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'New price is the same as the current price',
        });
      }

      // Close the current row (effective_until = day before new effective_from)
      const newEffectiveFromDate = new Date(effective_from);
      const closeDate = new Date(newEffectiveFromDate);
      closeDate.setDate(closeDate.getDate() - 1);
      const closeDateStr = closeDate.toISOString().split('T')[0];

      await connection.query(
        `UPDATE credit_pricing SET effective_until = ? WHERE id = ?`,
        [closeDateStr, current.id]
      );
    }

    // 5. Insert the new price row
    await connection.query(
      `INSERT INTO credit_pricing 
         (major_id, price_per_credit, effective_from, effective_until)
       VALUES (?, ?, ?, NULL)`,
      [major_id, priceNum, effective_from]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Credit price updated successfully',
      data: { major_id, price_per_credit: priceNum, effective_from },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update credit price error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// ============================================================
// FEE TYPES
// ============================================================

// GET /api/admin/fee-types
const getFeeTypes = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT 
          ft.id,
          ft.code,
          ft.name,
          ft.description,
          ft.charge_basis,
          ft.is_active,
          -- Include current price (if any)
          (SELECT amount FROM fee_pricing fp
           WHERE fp.fee_type_id = ft.id
             AND fp.major_id IS NULL
             AND fp.effective_from <= CURDATE()
             AND (fp.effective_until IS NULL OR fp.effective_until >= CURDATE())
           LIMIT 1) AS current_amount,
          (SELECT effective_from FROM fee_pricing fp
           WHERE fp.fee_type_id = ft.id
             AND fp.major_id IS NULL
             AND fp.effective_from <= CURDATE()
             AND (fp.effective_until IS NULL OR fp.effective_until >= CURDATE())
           LIMIT 1) AS current_effective_from
       FROM fee_types ft
       ORDER BY ft.is_active DESC, ft.name ASC`
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get fee types error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// POST /api/admin/fee-types
const createFeeType = async (req, res) => {
  const { code, name, description, charge_basis } = req.body;

  if (!code || !name || !charge_basis) {
    return res.status(400).json({
      success: false,
      message: 'code, name, and charge_basis are required',
    });
  }

  const validBases = ['per_semester', 'one_time', 'on_demand'];
  if (!validBases.includes(charge_basis)) {
    return res.status(400).json({
      success: false,
      message: `charge_basis must be one of: ${validBases.join(', ')}`,
    });
  }

  try {
    const codeUpper = code.toUpperCase().trim();

    // Check for duplicate code
    const [existing] = await db.promise().query(
      `SELECT id FROM fee_types WHERE code = ?`,
      [codeUpper]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A fee type with code "${codeUpper}" already exists`,
      });
    }

    await db.promise().query(
      `INSERT INTO fee_types (code, name, description, charge_basis, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [codeUpper, name.trim(), description || null, charge_basis]
    );

    return res.status(201).json({
      success: true,
      message: 'Fee type created successfully',
    });
  } catch (error) {
    console.error('Create fee type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// PUT /api/admin/fee-types/:id
const updateFeeType = async (req, res) => {
  const { id } = req.params;
  const { name, description, charge_basis, is_active } = req.body;

  if (!name || !charge_basis) {
    return res.status(400).json({
      success: false,
      message: 'name and charge_basis are required',
    });
  }

  try {
    const [existing] = await db.promise().query(
      `SELECT id FROM fee_types WHERE id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fee type not found',
      });
    }

    await db.promise().query(
      `UPDATE fee_types 
       SET name = ?, description = ?, charge_basis = ?, is_active = ?
       WHERE id = ?`,
      [
        name.trim(),
        description || null,
        charge_basis,
        is_active === undefined ? 1 : (is_active ? 1 : 0),
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Fee type updated successfully',
    });
  } catch (error) {
    console.error('Update fee type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ============================================================
// FEE PRICING
// ============================================================

// GET /api/admin/fee-pricing/history?fee_type_id=X
const getFeePricingHistory = async (req, res) => {
  const { fee_type_id } = req.query;

  try {
    const params = [];
    let whereClause = 'WHERE fp.major_id IS NULL';
    if (fee_type_id) {
      whereClause += ' AND fp.fee_type_id = ?';
      params.push(fee_type_id);
    }

    const [rows] = await db.promise().query(
      `SELECT 
          fp.id,
          fp.fee_type_id,
          fp.amount,
          fp.effective_from,
          fp.effective_until,
          fp.created_at,
          ft.code AS fee_code,
          ft.name AS fee_name,
          CASE 
            WHEN fp.effective_from <= CURDATE() 
                 AND (fp.effective_until IS NULL OR fp.effective_until >= CURDATE())
            THEN 1 ELSE 0
          END AS is_active
       FROM fee_pricing fp
       JOIN fee_types ft ON fp.fee_type_id = ft.id
       ${whereClause}
       ORDER BY ft.name, fp.effective_from DESC`,
      params
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get fee pricing history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// PUT /api/admin/fee-pricing
// Sets a new price for a fee_type (handles effective dating)
const updateFeePrice = async (req, res) => {
  const { fee_type_id, amount, effective_from } = req.body;

  if (!fee_type_id || amount === undefined || !effective_from) {
    return res.status(400).json({
      success: false,
      message: 'fee_type_id, amount, and effective_from are required',
    });
  }

  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum < 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be a non-negative number',
    });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Verify fee_type exists
    const [feeCheck] = await connection.query(
      `SELECT id FROM fee_types WHERE id = ?`,
      [fee_type_id]
    );

    if (feeCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Fee type not found',
      });
    }

    // Find current active price (major_id NULL = applies to all)
    const [currentRows] = await connection.query(
      `SELECT id, effective_from, amount
       FROM fee_pricing
       WHERE fee_type_id = ?
         AND major_id IS NULL
         AND effective_from <= CURDATE()
         AND (effective_until IS NULL OR effective_until >= CURDATE())
       FOR UPDATE`,
      [fee_type_id]
    );

    const newEffectiveDate = new Date(effective_from);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newEffectiveDate < today) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'effective_from cannot be in the past',
      });
    }

    if (currentRows.length > 0) {
      const current = currentRows[0];

      if (new Date(effective_from) <= new Date(current.effective_from)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'New effective date must be after the current price\'s effective date',
        });
      }

      if (Number(current.amount) === amountNum) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'New amount is the same as the current price',
        });
      }

      // Close current
      const newFromDate = new Date(effective_from);
      const closeDate = new Date(newFromDate);
      closeDate.setDate(closeDate.getDate() - 1);

      await connection.query(
        `UPDATE fee_pricing SET effective_until = ? WHERE id = ?`,
        [closeDate.toISOString().split('T')[0], current.id]
      );
    }

    // Insert new price
    await connection.query(
      `INSERT INTO fee_pricing 
         (fee_type_id, major_id, amount, effective_from, effective_until)
       VALUES (?, NULL, ?, ?, NULL)`,
      [fee_type_id, amountNum, effective_from]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Fee price updated successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update fee price error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// ============================================================
// DISCOUNT TYPES
// ============================================================

// GET /api/admin/discount-types
const getDiscountTypes = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT 
          id, code, name, description, scope, calculation, applies_to,
          is_active, created_at
       FROM discount_types
       ORDER BY is_active DESC, name ASC`
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get discount types error:', error);
    return res.status(500).json({
      success: false, message: 'Server error', error: error.message,
    });
  }
};

// POST /api/admin/discount-types
const createDiscountType = async (req, res) => {
  const { code, name, description, scope, calculation, applies_to } = req.body;

  if (!code || !name || !scope || !calculation || !applies_to) {
    return res.status(400).json({
      success: false,
      message: 'code, name, scope, calculation, and applies_to are required',
    });
  }

  const validScopes = ['semester', 'academic_year'];
  const validCalcs = ['percentage', 'fixed_amount'];
  const validAppliesTo = ['tuition_only', 'tuition_and_fees', 'specific_fee'];

  if (!validScopes.includes(scope)) {
    return res.status(400).json({ success: false, message: `scope must be one of: ${validScopes.join(', ')}` });
  }
  if (!validCalcs.includes(calculation)) {
    return res.status(400).json({ success: false, message: `calculation must be one of: ${validCalcs.join(', ')}` });
  }
  if (!validAppliesTo.includes(applies_to)) {
    return res.status(400).json({ success: false, message: `applies_to must be one of: ${validAppliesTo.join(', ')}` });
  }

  try {
    const codeUpper = code.toUpperCase().trim();

    const [existing] = await db.promise().query(
      `SELECT id FROM discount_types WHERE code = ?`, [codeUpper]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false, message: `A discount type with code "${codeUpper}" already exists`,
      });
    }

    await db.promise().query(
      `INSERT INTO discount_types (code, name, description, scope, calculation, applies_to, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [codeUpper, name.trim(), description || null, scope, calculation, applies_to]
    );

    return res.status(201).json({ success: true, message: 'Discount type created' });
  } catch (error) {
    console.error('Create discount type error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// PUT /api/admin/discount-types/:id
const updateDiscountType = async (req, res) => {
  const { id } = req.params;
  const { name, description, scope, calculation, applies_to, is_active } = req.body;

  if (!name || !scope || !calculation || !applies_to) {
    return res.status(400).json({ success: false, message: 'name, scope, calculation, and applies_to are required' });
  }

  try {
    const [existing] = await db.promise().query(`SELECT id FROM discount_types WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Discount type not found' });
    }

    await db.promise().query(
      `UPDATE discount_types 
       SET name = ?, description = ?, scope = ?, calculation = ?, applies_to = ?, is_active = ?
       WHERE id = ?`,
      [
        name.trim(),
        description || null,
        scope,
        calculation,
        applies_to,
        is_active === undefined ? 1 : (is_active ? 1 : 0),
        id,
      ]
    );

    return res.status(200).json({ success: true, message: 'Discount type updated' });
  } catch (error) {
    console.error('Update discount type error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ============================================================
// AWARDING DISCOUNTS TO STUDENTS
// ============================================================

// GET /api/admin/student-discounts
// List all awarded discounts (with filtering)
const getStudentDiscounts = async (req, res) => {
  const { student_id, status, discount_type_id } = req.query;

  try {
    const params = [];
    let where = 'WHERE 1=1';

    if (student_id) {
      where += ' AND sd.student_id = ?';
      params.push(student_id);
    }
    if (status) {
      where += ' AND sd.status = ?';
      params.push(status);
    }
    if (discount_type_id) {
      where += ' AND sd.discount_type_id = ?';
      params.push(discount_type_id);
    }

    const [rows] = await db.promise().query(
      `SELECT 
          sd.id,
          sd.student_id,
          sd.discount_type_id,
          sd.percentage,
          sd.fixed_amount,
          sd.semester_id,
          sd.academic_year,
          sd.reason,
          sd.status,
          sd.created_at,
          sd.updated_at,
          dt.code AS type_code,
          dt.name AS type_name,
          dt.scope,
          dt.calculation,
          dt.applies_to,
          u.name AS student_name,
          sem.name AS semester_name,
          approver.name AS approver_name
       FROM student_discounts sd
       JOIN discount_types dt ON sd.discount_type_id = dt.id
       JOIN users u ON sd.student_id = u.id
       LEFT JOIN semesters sem ON sd.semester_id = sem.id
       LEFT JOIN users approver ON sd.approved_by = approver.id
       ${where}
       ORDER BY sd.created_at DESC`,
      params
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get student discounts error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// POST /api/admin/student-discounts
// Award a discount to a student
const awardDiscount = async (req, res) => {
  const { 
    student_id, discount_type_id, percentage, fixed_amount,
    semester_id, academic_year, reason 
  } = req.body;
  const approved_by = req.user?.id;

  if (!student_id || !discount_type_id || !reason) {
    return res.status(400).json({
      success: false, message: 'student_id, discount_type_id, and reason are required',
    });
  }

  if (!approved_by) {
    return res.status(401).json({ success: false, message: 'Cannot identify admin' });
  }

  try {
    // 1. Get the discount type to know its calculation method and scope
    const [[type]] = await db.promise().query(
      `SELECT scope, calculation, is_active 
       FROM discount_types WHERE id = ?`,
      [discount_type_id]
    );

    if (!type) {
      return res.status(404).json({ success: false, message: 'Discount type not found' });
    }

    if (!type.is_active) {
      return res.status(400).json({ success: false, message: 'This discount type is inactive' });
    }

    // 2. Validate value based on calculation method
    if (type.calculation === 'percentage') {
      if (!percentage || Number(percentage) <= 0 || Number(percentage) > 100) {
        return res.status(400).json({ 
          success: false, message: 'Percentage must be between 0 and 100' 
        });
      }
    } else { // fixed_amount
      if (!fixed_amount || Number(fixed_amount) <= 0) {
        return res.status(400).json({ 
          success: false, message: 'Fixed amount must be greater than 0' 
        });
      }
    }

    // 3. Validate scope value
    if (type.scope === 'semester' && !semester_id) {
      return res.status(400).json({ 
        success: false, message: 'This discount requires a semester_id' 
      });
    }
    if (type.scope === 'academic_year' && !academic_year) {
      return res.status(400).json({ 
        success: false, message: 'This discount requires an academic_year' 
      });
    }

    // 4. Verify student exists
    const [studentCheck] = await db.promise().query(
      `SELECT id FROM users WHERE id = ? AND role = 'student' AND status = 'active'`,
      [student_id]
    );

    if (studentCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Active student not found' });
    }

    // 5. Check for duplicate active discount of same type+scope
    let duplicateCheck;
    if (type.scope === 'semester') {
      [duplicateCheck] = await db.promise().query(
        `SELECT id FROM student_discounts 
         WHERE student_id = ? AND discount_type_id = ? 
           AND semester_id = ? AND status = 'active'`,
        [student_id, discount_type_id, semester_id]
      );
    } else {
      [duplicateCheck] = await db.promise().query(
        `SELECT id FROM student_discounts 
         WHERE student_id = ? AND discount_type_id = ? 
           AND academic_year = ? AND status = 'active'`,
        [student_id, discount_type_id, academic_year]
      );
    }

    if (duplicateCheck.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This student already has an active discount of this type for this period',
      });
    }

    // 6. Insert
    const [result] = await db.promise().query(
      `INSERT INTO student_discounts
         (student_id, discount_type_id, percentage, fixed_amount,
          semester_id, academic_year, reason, approved_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        student_id,
        discount_type_id,
        type.calculation === 'percentage' ? Number(percentage) : null,
        type.calculation === 'fixed_amount' ? Number(fixed_amount) : null,
        type.scope === 'semester' ? semester_id : null,
        type.scope === 'academic_year' ? academic_year : null,
        reason.trim(),
        approved_by,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Discount awarded successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error('Award discount error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// PUT /api/admin/student-discounts/:id/cancel
// Cancel an awarded discount
const cancelStudentDiscount = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.promise().query(
      `SELECT status FROM student_discounts WHERE id = ?`, [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    if (existing[0].status !== 'active') {
      return res.status(400).json({ success: false, message: 'Discount is not active' });
    }

    await db.promise().query(
      `UPDATE student_discounts SET status = 'cancelled' WHERE id = ?`, [id]
    );

    return res.status(200).json({ success: true, message: 'Discount cancelled' });
  } catch (error) {
    console.error('Cancel discount error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Helper endpoint: lightweight student search for the award form
// GET /api/admin/students/search?q=...
const searchStudentsForDiscount = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) {
    return res.status(200).json({ success: true, data: [] });
  }

  const trimmed = q.trim();
  const searchTerm = `%${trimmed}%`;
  const isNumeric = /^\d+$/.test(trimmed);
  const idValue = isNumeric ? parseInt(trimmed, 10) : null;

  try {
    let where;
    let params;
    if (isNumeric) {
      where = `(u.id = ? OR u.name LIKE ? OR u.email LIKE ?)`;
      params = [idValue, searchTerm, searchTerm];
    } else {
      where = `(u.name LIKE ? OR u.email LIKE ?)`;
      params = [searchTerm, searchTerm];
    }

    const [rows] = await db.promise().query(
      `SELECT u.id, u.name, u.email, m.name AS major_name
       FROM users u
       JOIN students s ON s.user_id = u.id
       LEFT JOIN majors m ON s.major_id = m.id
       WHERE u.role = 'student' AND u.status = 'active'
         AND ${where}
       ORDER BY u.name
       LIMIT 10`,
      params
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Search students for discount error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  // credit pricing
  getCurrentCreditPrices,
  getCreditPricingHistory,
  updateCreditPrice,
  // fee management
  getFeeTypes,
  createFeeType,
  updateFeeType,
  getFeePricingHistory,
  updateFeePrice,
  // discount management
  getDiscountTypes,
  createDiscountType,
  updateDiscountType,
  getStudentDiscounts,
  awardDiscount,
  cancelStudentDiscount,
  searchStudentsForDiscount,
};