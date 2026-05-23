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

module.exports = {
  getCurrentCreditPrices,
  getCreditPricingHistory,
  updateCreditPrice,
};