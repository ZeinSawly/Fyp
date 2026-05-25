const db = require('../config/db');

// ─── GET ALL COURSES ───
const getAllCourses = async (req, res) => {
  try {
    const [courses] = await db.promise().query(
      `SELECT c.id, c.name, c.description, c.credits, c.type, c.major_id, m.name as major_name
       FROM courses c
       LEFT JOIN majors m ON c.major_id = m.id
       ORDER BY c.name ASC`
    );
    return res.status(200).json({ success: true, data: courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET ALL MAJORS (Add this new function) ───
const getAllMajors = async (req, res) => {
  try {
    const [majors] = await db.promise().query(
      `SELECT id, name FROM majors ORDER BY name ASC`
    );
    return res.status(200).json({ success: true, data: majors });
  } catch (error) {
    console.error('Error fetching majors:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ADD COURSE ───
// ─── ADD COURSE (with prerequisites) ───
const addCourse = async (req, res) => {
  const { id, name, description, credits, type, major_id, prerequisite_ids } = req.body;

  if (!id || !name || !credits || !type || !major_id) {
    return res.status(400).json({ message: 'ID, name, credits, type and major are required' });
  }

  // prerequisite_ids should be an array (or undefined for no prereqs)
  const prereqs = Array.isArray(prerequisite_ids) ? prerequisite_ids : [];

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // 1. Check if course already exists
    const [existing] = await connection.query(
      `SELECT id FROM courses WHERE id = ?`,
      [id]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'A course with this ID already exists' });
    }

    // 2. If prereqs given, validate they all exist AND aren't self-referencing
    if (prereqs.length > 0) {
      // Prevent self-prereq (a course can't be its own prerequisite)
      if (prereqs.includes(id)) {
        await connection.rollback();
        return res.status(400).json({ 
          message: 'A course cannot be its own prerequisite' 
        });
      }

      // Verify all prereq IDs actually exist
      const [foundPrereqs] = await connection.query(
        `SELECT id FROM courses WHERE id IN (?)`,
        [prereqs]
      );

      if (foundPrereqs.length !== prereqs.length) {
        const foundIds = foundPrereqs.map(p => p.id);
        const missingIds = prereqs.filter(pid => !foundIds.includes(pid));
        await connection.rollback();
        return res.status(400).json({ 
          message: `Prerequisite course(s) not found: ${missingIds.join(', ')}` 
        });
      }
    }

    // 3. Insert the course
    await connection.query(
      `INSERT INTO courses (id, name, description, credits, major_id, type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, description || null, credits, major_id, type]
    );

    // 4. Insert prerequisites
    if (prereqs.length > 0) {
      const prereqValues = prereqs.map(prereqId => [id, prereqId]);
      await connection.query(
        `INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES ?`,
        [prereqValues]
      );
    }

    await connection.commit();

    return res.status(201).json({ 
      message: 'Course added successfully',
      prerequisites_added: prereqs.length,
    });

  } catch (error) {
    await connection.rollback();
    console.error('Add course error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// ─── GET AVAILABLE PREREQUISITES ───
// Returns courses that can be used as prerequisites
// Optionally filtered by major_id (frontend uses this)
// Also optionally excludes a specific course (when editing, to prevent self-prereq)
const getAvailablePrerequisites = async (req, res) => {
  const { major_id, exclude_course_id } = req.query;

  try {
    let query = `
      SELECT c.id, c.name, c.credits, c.type, m.name AS major_name
      FROM courses c
      LEFT JOIN majors m ON c.major_id = m.id
      WHERE 1 = 1
    `;
    const params = [];

    if (major_id) {
      query += ` AND c.major_id = ?`;
      params.push(major_id);
    }

    if (exclude_course_id) {
      query += ` AND c.id != ?`;
      params.push(exclude_course_id);
    }

    query += ` ORDER BY c.id ASC`;

    const [courses] = await db.promise().query(query, params);
    return res.status(200).json({ success: true, data: courses });
  } catch (error) {
    console.error('Get available prerequisites error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET COURSE PREREQUISITES ───
const getCoursePrerequisites = async (req, res) => {
  const { course_id } = req.params;

  try {
    const [prereqs] = await db.promise().query(
      `SELECT 
          cp.prerequisite_id AS id,
          c.name,
          c.credits,
          c.type,
          m.name AS major_name
       FROM course_prerequisites cp
       JOIN courses c ON cp.prerequisite_id = c.id
       LEFT JOIN majors m ON c.major_id = m.id
       WHERE cp.course_id = ?
       ORDER BY c.id ASC`,
      [course_id]
    );

    return res.status(200).json({ success: true, data: prereqs });
  } catch (error) {
    console.error('Get course prerequisites error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET COURSE SECTIONS ───
const getCourseSections = async (req, res) => {
  const { course_id } = req.params;
  
  try {
      const [sections] = await db.promise().query(
          `SELECT 
              cs.id, cs.section_code, cs.seats, cs.max_seats, cs.semester_id,
              s.name as semester_name, s.code as semester_code,
              u.name AS instructor_name, u.id AS instructor_id,
              d.name AS department
           FROM course_sections cs
           LEFT JOIN semesters s ON cs.semester_id = s.id
           LEFT JOIN instructors i ON cs.instructor_id = i.user_id
           LEFT JOIN users u ON i.user_id = u.id
           LEFT JOIN departments d ON i.department = d.id
           WHERE cs.course_id = ?
           ORDER BY s.academic_year DESC, s.term DESC, cs.section_code ASC`,
          [course_id]
      );
      
      return res.status(200).json({ success: true, data: sections });
      
  } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADD COURSE SECTION ───
const addCourseSection = async (req, res) => {
  const { course_id, instructor_id, section_code, max_seats, semester_id } = req.body;

  if (!course_id || !section_code || !max_seats || !semester_id) {
      return res.status(400).json({ 
          message: 'course_id, section_code, max_seats and semester_id are required' 
      });
  }

  try {
      // Check semester exists
      const [semester] = await db.promise().query(
          `SELECT id FROM semesters WHERE id = ?`, [semester_id]
      );
      if (semester.length === 0) {
          return res.status(404).json({ message: 'Semester not found' });
      }

      // Check course exists
      const [course] = await db.promise().query(
          `SELECT id FROM courses WHERE id = ?`, [course_id]
      );
      if (course.length === 0) {
          return res.status(404).json({ message: 'Course not found' });
      }

      // Check section code not duplicate for same course AND same semester
      const [existing] = await db.promise().query(
          `SELECT id FROM course_sections 
           WHERE course_id = ? AND section_code = ? AND semester_id = ?`,
          [course_id, section_code, semester_id]
      );
      if (existing.length > 0) {
          return res.status(400).json({ 
              message: 'Section code already exists for this course in this semester' 
          });
      }

      await db.promise().query(
          `INSERT INTO course_sections (course_id, instructor_id, section_code, max_seats, seats, semester_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [course_id, instructor_id || null, section_code, max_seats, max_seats, semester_id]
      );

      return res.status(201).json({ message: 'Section added successfully' });

  } catch (error) {
      console.error('Add section error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCoursesBySemester = async (req, res) => {
  const { semester_id, student_id } = req.query;

  if (!semester_id) {
    return res.status(400).json({
      success: false,
      message: 'semester_id is required',
    });
  }

  try {
    // Get semester details
    const [semester] = await db.promise().query(
      `SELECT * FROM semesters WHERE id = ?`,
      [semester_id]
    );
    if (semester.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found',
      });
    }

    // Get courses that have at least one section in this semester
    const [courses] = await db.promise().query(
      `SELECT 
          c.id, c.name, c.description, c.credits, c.type, c.major_id,
          m.name AS major_name,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM course_sections cs 
              JOIN course_enrollments ce ON cs.id = ce.section_id 
              WHERE cs.course_id = c.id 
                AND ce.student_id = ? 
                AND cs.semester_id = ?
            ) THEN 'enrolled'
            WHEN EXISTS (
              SELECT 1 FROM shopping_cart sc 
              JOIN course_sections cs ON sc.section_id = cs.id
              WHERE cs.course_id = c.id 
                AND sc.student_id = ? 
                AND cs.semester_id = ?
            ) THEN 'in_cart'
            ELSE 'available'
          END AS status
       FROM courses c
       LEFT JOIN majors m ON c.major_id = m.id
       WHERE EXISTS (
         SELECT 1 FROM course_sections cs 
         WHERE cs.course_id = c.id 
           AND cs.semester_id = ?
       )
       ORDER BY c.name`,
      [
        student_id || null, semester_id,   // for "enrolled" check
        student_id || null, semester_id,   // for "in_cart" check
        semester_id,                       // for "offered in semester" filter
      ]
    );

    return res.status(200).json({
      success: true,
      data: courses,
      semester: semester[0],
    });
  } catch (error) {
    console.error('Get courses by semester error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ─── GET ALL INSTRUCTORS (for dropdown) ───
const getAllInstructors = async (req, res) => {
  try {
    const [instructors] = await db.promise().query(
      `SELECT u.id, u.name, d.name AS department
       FROM users u
       JOIN instructors i ON u.id = i.user_id
       JOIN departments d ON i.department = d.id
       WHERE u.status = 'active'
       ORDER BY u.name ASC`
    );
    return res.status(200).json({ success: true, data: instructors });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ADD COURSE SCHEDULE ───
// ─── ADD COURSE SCHEDULE ───
const addCourseSchedule = async (req, res) => {
  const { section_id, day_of_week, start_time, end_time, room, building } = req.body;

  if (!section_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ 
      message: 'section_id, day_of_week, start_time and end_time are required' 
    });
  }

  try {
    // Check section exists
    const [section] = await db.promise().query(
      `SELECT id FROM course_sections WHERE id = ?`, 
      [section_id]
    );
    if (section.length === 0) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Parse start and end times into minutes
    const parseTime = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const toTimeStr = (totalMinutes) => {
      const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const m = (totalMinutes % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    const startMinutes = parseTime(start_time);
    const endMinutes = parseTime(end_time);
    const totalDuration = endMinutes - startMinutes;

    if (totalDuration <= 0) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // ─── SHORT CLASS: single session, no split ───
    const SHORT_CLASS_THRESHOLD = 90; // minutes — classes ≤ 90 min = single session

    if (totalDuration <= SHORT_CLASS_THRESHOLD) {
      await db.promise().query(
        `INSERT INTO course_schedule (section_id, day_of_week, start_time, end_time, room, building)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          section_id, 
          day_of_week, 
          toTimeStr(startMinutes), 
          toTimeStr(endMinutes), 
          room || null, 
          building || null
        ]
      );

      return res.status(201).json({
        message: 'Schedule added successfully — single session',
        sessions: [
          { 
            session: 1, 
            start: toTimeStr(startMinutes), 
            end: toTimeStr(endMinutes),
            duration_minutes: totalDuration,
          },
        ],
      });
    }

    // ─── LONG CLASS: split into 2 sessions with a 15-min break ───
    const BREAK_DURATION = 15;
    const sessionDuration = Math.floor((totalDuration - BREAK_DURATION) / 2);

    const session1Start = startMinutes;
    const session1End = startMinutes + sessionDuration;
    const session2Start = session1End + BREAK_DURATION;
    const session2End = endMinutes;

    // Insert session 1
    await db.promise().query(
      `INSERT INTO course_schedule (section_id, day_of_week, start_time, end_time, room, building)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        section_id, 
        day_of_week, 
        toTimeStr(session1Start), 
        toTimeStr(session1End), 
        room || null, 
        building || null
      ]
    );

    // Insert session 2
    await db.promise().query(
      `INSERT INTO course_schedule (section_id, day_of_week, start_time, end_time, room, building)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        section_id, 
        day_of_week, 
        toTimeStr(session2Start), 
        toTimeStr(session2End), 
        room || null, 
        building || null
      ]
    );

    return res.status(201).json({
      message: 'Schedule added successfully — 2 sessions created with a 15-minute break',
      sessions: [
        { 
          session: 1, 
          start: toTimeStr(session1Start), 
          end: toTimeStr(session1End),
          duration_minutes: sessionDuration,
        },
        { 
          session: 2, 
          start: toTimeStr(session2Start), 
          end: toTimeStr(session2End),
          duration_minutes: sessionDuration,
        },
      ],
    });

  } catch (error) {
    console.error('Add schedule error:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// ─── GET SECTION SCHEDULE ───
const getSectionSchedule = async (req, res) => {
  const { section_id } = req.params;
  try {
    const [schedule] = await db.promise().query(
      `SELECT id, day_of_week, start_time, end_time, room, building
       FROM course_schedule
       WHERE section_id = ?
       ORDER BY FIELD(day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')`,
      [section_id]
    );
    return res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET COURSE BY ID (with prerequisites) ───
const getCourseById = async (req, res) => {
  const { course_id } = req.params;

  if (!course_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Course ID is required' 
    });
  }

  try {
    // 1. Get the course itself
    const [courseRows] = await db.promise().query(
      `SELECT 
          c.id, c.name, c.description, c.credits, c.type, c.major_id,
          m.name AS major_name,
          d.id AS department_id,
          d.name AS department_name
       FROM courses c
       LEFT JOIN majors m ON c.major_id = m.id
       LEFT JOIN departments d ON m.department_id = d.id
       WHERE c.id = ?`,
      [course_id]
    );

    if (courseRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    const course = courseRows[0];

    // 2. Get its prerequisites
    const [prereqs] = await db.promise().query(
      `SELECT 
          cp.prerequisite_id AS id,
          c.name,
          c.credits,
          c.type
       FROM course_prerequisites cp
       JOIN courses c ON cp.prerequisite_id = c.id
       WHERE cp.course_id = ?
       ORDER BY c.id ASC`,
      [course_id]
    );

    // 3. Quick stats — does this course have sections/enrollments?
    // Useful context for the admin
    const [[stats]] = await db.promise().query(
      `SELECT
          (SELECT COUNT(*) FROM course_sections WHERE course_id = ?) AS section_count,
          (SELECT COUNT(*) FROM course_enrollments ce
           JOIN course_sections cs ON ce.section_id = cs.id
           WHERE cs.course_id = ?) AS enrollment_count`,
      [course_id, course_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...course,
        prerequisites: prereqs,
        stats: {
          section_count: Number(stats.section_count),
          enrollment_count: Number(stats.enrollment_count),
        },
      },
    });
  } catch (error) {
    console.error('Get course by ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// ─── UPDATE COURSE (name, description, prerequisites only) ───
const updateCourse = async (req, res) => {
  const { course_id } = req.params;
  const { name, description, prerequisite_ids } = req.body;

  if (!course_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Course ID is required' 
    });
  }

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Course name is required' 
    });
  }

  const newPrereqs = Array.isArray(prerequisite_ids) ? prerequisite_ids : [];

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verify the course exists
    const [existing] = await connection.query(
      `SELECT id FROM courses WHERE id = ?`,
      [course_id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // 2. Validate prereqs
    if (newPrereqs.length > 0) {
      // No self-prereq
      if (newPrereqs.includes(course_id)) {
        await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'A course cannot be its own prerequisite' 
        });
      }

      // Verify all prereq IDs exist
      const [found] = await connection.query(
        `SELECT id FROM courses WHERE id IN (?)`,
        [newPrereqs]
      );

      if (found.length !== newPrereqs.length) {
        const foundIds = found.map(r => r.id);
        const missingIds = newPrereqs.filter(id => !foundIds.includes(id));
        await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `Prerequisite course(s) not found: ${missingIds.join(', ')}` 
        });
      }
    }

    // 3. Update the course fields
    await connection.query(
      `UPDATE courses 
       SET name = ?, description = ?
       WHERE id = ?`,
      [name.trim(), description || null, course_id]
    );

    // 4. Replace prerequisites (simpler than computing diffs)
    await connection.query(
      `DELETE FROM course_prerequisites WHERE course_id = ?`,
      [course_id]
    );

    if (newPrereqs.length > 0) {
      const values = newPrereqs.map(prereqId => [course_id, prereqId]);
      await connection.query(
        `INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES ?`,
        [values]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: {
        course_id,
        prerequisites_count: newPrereqs.length,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update course error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllCourses, addCourse,
  getCourseSections, addCourseSection,
  getAllInstructors,
  addCourseSchedule, getSectionSchedule,
  getAllMajors, getCoursesBySemester,
  getAvailablePrerequisites, getCoursePrerequisites,
  getCourseById, updateCourse,
};