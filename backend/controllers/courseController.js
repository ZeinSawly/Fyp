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
const addCourse = async (req, res) => {
  const { id, name, description, credits, type, major_id } = req.body;

  if (!id || !name || !credits || !type || !major_id) {
    return res.status(400).json({ message: 'ID, name, credits, type and major are required' });
  }

  try {
    // Check if course already exists
    const [existing] = await db.promise().query(
      `SELECT id FROM courses WHERE id = ?`, [id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'A course with this ID already exists' });
    }

    await db.promise().query(
      `INSERT INTO courses (id, name, description, credits, major_id, type) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, description || null, credits, major_id, type]
    );

    return res.status(201).json({ message: 'Course added successfully' });

  } catch (error) {
    console.error('Add course error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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
  
  try {
      // Get semester details
      const [semester] = await db.promise().query(
          `SELECT * FROM semesters WHERE id = ?`, [semester_id]
      );
      if (semester.length === 0) {
          return res.status(404).json({ success: false, message: 'Semester not found' });
      }
      
      const term = semester[0].term;
      
      // Get courses offered in this semester (based on offered_in)
      const [courses] = await db.promise().query(
          `SELECT c.id, c.name, c.description, c.credits, c.type, c.offered_in, c.major_id,
                  m.name as major_name,
                  CASE 
                      WHEN EXISTS (
                          SELECT 1 FROM course_sections cs 
                          JOIN course_enrollments ce ON cs.id = ce.section_id 
                          WHERE cs.course_id = c.id AND ce.student_id = ? AND cs.semester_id = ?
                      ) THEN 'enrolled'
                      WHEN EXISTS (
                          SELECT 1 FROM shopping_cart sc 
                          JOIN course_sections cs ON sc.section_id = cs.id
                          WHERE cs.course_id = c.id AND sc.student_id = ? AND cs.semester_id = ?
                      ) THEN 'in_cart'
                      ELSE 'available'
                  END AS status
           FROM courses c
           LEFT JOIN majors m ON c.major_id = m.id
           WHERE c.offered_in IN (?, 'Both')
           ORDER BY c.name`,
          [student_id || null, semester_id, student_id || null, semester_id, term]
      );
      
      return res.status(200).json({ success: true, data: courses, semester: semester[0] });
  } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
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
const addCourseSchedule = async (req, res) => {
  const { section_id, day_of_week, start_time, end_time, room, building } = req.body;

  if (!section_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ message: 'section_id, day_of_week, start_time and end_time are required' });
  }

  try {
    // Check section exists
    const [section] = await db.promise().query(
      `SELECT id FROM course_sections WHERE id = ?`, [section_id]
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

    // Split into 2 sessions with 15-minute break
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
      [section_id, day_of_week, toTimeStr(session1Start), toTimeStr(session1End), room || null, building || null]
    );

    // Insert session 2
    await db.promise().query(
      `INSERT INTO course_schedule (section_id, day_of_week, start_time, end_time, room, building)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [section_id, day_of_week, toTimeStr(session2Start), toTimeStr(session2End), room || null, building || null]
    );

    return res.status(201).json({
      message: 'Schedule added successfully — 2 sessions created',
      sessions: [
        { session: 1, start: toTimeStr(session1Start), end: toTimeStr(session1End) },
        { session: 2, start: toTimeStr(session2Start), end: toTimeStr(session2End) },
      ]
    });

  } catch (error) {
    console.error('Add schedule error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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

module.exports = {
  getAllCourses, addCourse,
  getCourseSections, addCourseSection,
  getAllInstructors,
  addCourseSchedule, getSectionSchedule,
  getAllMajors, getCoursesBySemester
};