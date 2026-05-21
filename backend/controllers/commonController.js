const db = require('../config/db');

// GET /api/common/current-semester
const getCurrentSemester = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT id, name, code, term, academic_year, 
              start_date, end_date,
              enrollment_start_date, enrollment_end_date,
              is_current, is_active
       FROM semesters
       WHERE is_current = 1 AND is_active = 1
       LIMIT 1`
    );

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No current semester set'
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching current semester:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// GET /api/common/semesters
// Returns all semesters, optionally filtered by active status
const getAllSemesters = async (req, res) => {
  const { active_only } = req.query;

  try {
    let query = `
      SELECT id, name, code, term, academic_year,
             start_date, end_date,
             enrollment_start_date, enrollment_end_date,
             is_current, is_active
      FROM semesters
    `;

    if (active_only === 'true') {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY start_date DESC';

    const [rows] = await db.promise().query(query);

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = { getCurrentSemester, getAllSemesters };