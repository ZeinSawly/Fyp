const db = require('../config/db');
const bcrypt = require('bcrypt');

/* =========================
   ADD STUDENT
========================= */
const addStudent = async (req, res) => {
  const { id, name, password, dob, enrollment_date, major_id, email, phone, campus } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ message: 'Transaction error', error: err });
      }

      const rollback = (error) => {
        console.error(error);
        db.rollback(() => {
          return res.status(500).json({
            message: 'Transaction failed, changes reverted',
            error,
          });
        });
      };

      const checkMajor = 'SELECT * FROM majors WHERE id = ?';
      db.query(checkMajor, [major_id], (err1, majorRows) => {
        if (err1) return rollback(err1);

        if (majorRows.length === 0) {
          return db.rollback(() =>
            res.status(400).json({ message: 'Major does not exist' })
          );
        }

        const checkStudent = 'SELECT * FROM students WHERE user_id = ?';
        db.query(checkStudent, [id], (err2, studentRows) => {
          if (err2) return rollback(err2);

          if (studentRows.length > 0) {
            return db.rollback(() =>
              res.status(400).json({ message: 'Student already exists' })
            );
          }

          const userSql = 'INSERT INTO users (id, name, password, role, dob, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)';

          db.query( userSql, [id, name, hashedPassword, 'Student', dob, email, phone], (err3) => {

              if (err3) return rollback(err3);

              const studentSql = 'INSERT INTO students (user_id, enrollment_date, major_id, campus) VALUES (?, ?, ?, ?)';

              db.query( studentSql, [id, enrollment_date, major_id, campus], (err4) => {

                  if (err4) return rollback(err4);

                  db.commit((err5) => {
                    if (err5) return rollback(err5);

                    return res.status(201).json({ message: 'Student added successfully' });
                  });
                }
              );
            }
          );
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

/* =========================
   DEACTIVATE STUDENT (FIXED)
========================= */
const deactivateStudent = async (req, res) => {
  const { id } = req.body;

  try {
    // First check if student exists
    const [rows] = await db.promise().query(
      `SELECT u.id, u.name, u.email, u.status, s.major_id, m.name AS major_name
       FROM users u
       JOIN students s ON u.id = s.user_id
       JOIN majors m ON s.major_id = m.id
       WHERE u.id = ? AND u.role = 'student'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (rows[0].status === 'inactive') {
      return res.status(400).json({ message: 'Student account is already deactivated' });
    }

    await db.promise().query(
      `UPDATE users SET status = 'inactive' WHERE id = ?`,
      [id]
    );

    return res.status(200).json({
      message: 'Student account deactivated successfully',
      student: rows[0]
    });

  } catch (error) {
    console.error('Deactivate student error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =========================
  LOOKUP STUDENT
========================= */

const lookupStudent = async (req, res) => {
  const { id } = req.params;

  console.log('Looking up student ID:', id, typeof id);

  try {
    const [rows] = await db.promise().query(
      `SELECT u.id, u.name, u.email, u.phone, u.status, u.dob,
              s.enrollment_date, s.gpa, s.campus,
              m.name AS major_name
       FROM users u
       JOIN students s ON u.id = s.user_id
       JOIN majors m ON s.major_id = m.id
       WHERE u.id = ? AND u.role = 'student'`,
      [id]
    );

    console.log('Query result:', rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({ success: true, data: rows[0] });

  } catch (error) {
    console.error('Lookup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* =========================
   ADD INSTRUCTOR
========================= */
const addInstructor = async (req, res) => {
  const { id, name, password, dob, department, email, phone } = req.body;

  // Basic validation
  if (!id || !name || !password || !email || !department) {
    return res.status(400).json({
      message: 'id, name, password, email, and department are required',
    });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verify department exists
    const [deptRows] = await connection.query(
      'SELECT id FROM departments WHERE id = ?',
      [department]
    );

    if (deptRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid department' });
    }

    // 2. Check if a user with this ID already exists
    const [userRows] = await connection.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (userRows.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Instructor already exists' });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert into users
    await connection.query(
      `INSERT INTO users (id, name, password, role, dob, email, phone, status)
       VALUES (?, ?, ?, 'instructor', ?, ?, ?, 'active')`,
      [id, name, hashedPassword, dob || null, email, phone || null]
    );

    // 5. Insert into instructors
    await connection.query(
      `INSERT INTO instructors (user_id, department) VALUES (?, ?)`,
      [id, department]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Instructor added successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Add instructor error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  } finally {
    connection.release();
  }
};

/* =========================
   GET DEPARTMENTS
========================= */
const getDepartments = (req, res) => {
  const sql =
    'SELECT id, name, building, office, phone, email FROM departments ORDER BY name';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching departments' });
    }
    return res.status(200).json(results);
  });
};

/* =========================
   REMOVE INSTRUCTOR (FIXED)
========================= */
// adminController.js
const lookupInstructor = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.promise().query(
      `SELECT u.id, u.name, u.email, u.phone, u.status, u.dob,
              d.name AS department_name
       FROM users u
       JOIN instructors i ON u.id = i.user_id
       JOIN departments d ON i.department = d.id
       WHERE u.id = ? AND u.role = 'instructor'`,
      [parseInt(id)]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Instructor not found' });
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const deactivateInstructor = async (req, res) => {
  const { id } = req.body;
  try {
    const [result] = await db.promise().query(
      `UPDATE users SET status = 'inactive' WHERE id = ? AND role = 'instructor'`,
      [id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Instructor not found' });
    return res.status(200).json({ message: 'Instructor account deactivated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const getMajors = (req, res) => {
  const sql = 'SELECT id, name FROM majors ORDER BY name';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching majors:', err);
      return res.status(500).json({ message: 'Error fetching majors' });
    }

    return res.status(200).json(results);
  });
};


/* =========================
   ADD FINANCE OFFICER
========================= */
const addFinanceOfficer = async (req, res) => {
  const { id, name, password, dob, email, phone, office_location } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ message: 'Transaction error', error: err });
      }

      const rollback = (error) => {
        console.error(error);
        db.rollback(() => {
          return res.status(500).json({
            message: 'Transaction failed',
            error,
          });
        });
      };

      // Check if user already exists
      const checkUserSql = 'SELECT * FROM users WHERE id = ?';
      db.query(checkUserSql, [id], (err1, userRows) => {
        if (err1) return rollback(err1);

        if (userRows.length > 0) {
          return db.rollback(() =>
            res.status(400).json({ message: 'Finance officer with this ID already exists' })
          );
        }

        // Insert into users table
        const userSql = `
          INSERT INTO users (id, name, password, role, dob, email, phone, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `;

        db.query(
          userSql,
          [id, name, hashedPassword, 'finance_officer', dob, email, phone],
          (err2) => {
            if (err2) return rollback(err2);

            // Insert into finance_officers table
            const financeOfficerSql = `
              INSERT INTO finance_officers (user_id, office_location) 
              VALUES (?, ?)
            `;

            db.query(financeOfficerSql, [id, office_location], (err3) => {
              if (err3) return rollback(err3);

              db.commit((err4) => {
                if (err4) return rollback(err4);

                return res.status(201).json({
                  message: 'Finance officer added successfully',
                });
              });
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('Add finance officer error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =========================
   LOOKUP FINANCE OFFICER
========================= */
const lookupFinanceOfficer = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.promise().query(
      `SELECT u.id, u.name, u.email, u.phone, u.status, u.dob,
              f.office_location
       FROM users u
       JOIN finance_officers f ON u.id = f.user_id
       WHERE u.id = ? AND u.role = 'finance_officer'`,
      [parseInt(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Finance officer not found' });
    }

    return res.status(200).json({ success: true, data: rows[0] });

  } catch (error) {
    console.error('Lookup finance officer error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =========================
   DEACTIVATE FINANCE OFFICER
========================= */
const deactivateFinanceOfficer = async (req, res) => {
  const { id, reason } = req.body;

  try {
    // Check if finance officer exists and is active
    const [rows] = await db.promise().query(
      `SELECT u.id, u.name, u.email, u.status
       FROM users u
       JOIN finance_officers f ON u.id = f.user_id
       WHERE u.id = ? AND u.role = 'finance_officer'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Finance officer not found' });
    }

    if (rows[0].status === 'inactive') {
      return res.status(400).json({ message: 'Finance officer account is already deactivated' });
    }

    // Update user status to inactive
    await db.promise().query(
      `UPDATE users SET status = 'inactive' WHERE id = ?`,
      [id]
    );

    // Optional: Log deactivation reason (if you have an audit log table)
    // await db.promise().query(
    //   `INSERT INTO audit_logs (user_id, action, reason, created_at) 
    //    VALUES (?, 'deactivate_finance_officer', ?, NOW())`,
    //   [id, reason]
    // );

    return res.status(200).json({
      message: 'Finance officer account deactivated successfully',
      officer: rows[0]
    });

  } catch (error) {
    console.error('Deactivate finance officer error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =========================
   EXPORTS
========================= */
module.exports = {addStudent, deactivateStudent, lookupStudent, addInstructor,getDepartments,lookupInstructor, deactivateInstructor, getMajors, addFinanceOfficer, lookupFinanceOfficer, deactivateFinanceOfficer};