const db = require('../config/db');

// Get students enrolled in a section + their attendance for a specific session and date
const getSectionStudents = async (req, res) => {
  const { section_id, schedule_id, date } = req.query;

  if (!section_id || !schedule_id || !date) {
    return res.status(400).json({ success: false, message: 'section_id, schedule_id and date are required' });
  }

  try {
    const [students] = await db.promise().query(
      `SELECT 
        u.id AS student_id,
        u.name AS student_name,
        COALESCE(a.status, 'not_marked') AS attendance_status
       FROM course_enrollments ce
       JOIN users u ON ce.student_id = u.id
       LEFT JOIN attendance a 
         ON a.student_id = u.id 
         AND a.schedule_id = ?
         AND a.date = ?
       WHERE ce.section_id = ?
       ORDER BY u.name ASC`,
      [schedule_id, date, section_id]
    );

    return res.status(200).json({ success: true, data: students });

  } catch (error) {
    console.error('Get section students error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get sessions (schedules) for a section on a specific day
const getSectionSessions = async (req, res) => {
  const { section_id, date } = req.query;

  if (!section_id || !date) {
    return res.status(400).json({ success: false, message: 'section_id and date are required' });
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[new Date(date).getDay()];

  try {
    // Get day of week from date
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[new Date(date).getDay()];

    const [sessions] = await db.promise().query(
      `SELECT 
        cs.id AS schedule_id,
        cs.start_time,
        cs.end_time,
        cs.room,
        cs.building,
        cs.day_of_week
       FROM course_schedule cs
       WHERE cs.section_id = ?
         AND cs.day_of_week = ?
       ORDER BY cs.start_time ASC`,
      [section_id, dayOfWeek]
    );

    return res.status(200).json({ success: true, data: sessions });

    

  } catch (error) {
    console.error('Get section sessions error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Submit attendance for a session
const submitAttendance = async (req, res) => {
  const { section_id, schedule_id, date, attendance, recorded_by } = req.body;
  // attendance = [{ student_id, status: 'present'|'absent' }, ...]

  if (!section_id || !schedule_id || !date || !attendance || !recorded_by) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Upsert attendance for each student
    const promises = attendance.map(({ student_id, status }) =>
      db.promise().query(
        `INSERT INTO attendance (student_id, section_id, schedule_id, date, status, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), recorded_by = VALUES(recorded_by)`,
        [student_id, section_id, schedule_id, date, status, recorded_by]
      )
    );

    await Promise.all(promises);

    return res.status(200).json({ success: true, message: 'Attendance submitted successfully' });

  } catch (error) {
    console.error('Submit attendance error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get absence count per student for a section
const getAbsenceSummary = async (req, res) => {
  const { section_id } = req.params;

  try {
    const [summary] = await db.promise().query(
      `SELECT 
        u.id AS student_id,
        u.name AS student_name,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS total_absences,
        COUNT(a.id) AS total_sessions_recorded
       FROM course_enrollments ce
       JOIN users u ON ce.student_id = u.id
       LEFT JOIN attendance a ON a.student_id = u.id AND a.section_id = ?
       WHERE ce.section_id = ?
       GROUP BY u.id, u.name
       ORDER BY u.name ASC`,
      [section_id, section_id]
    );

    return res.status(200).json({ success: true, data: summary });

  } catch (error) {
    console.error('Get absence summary error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const checkAttendanceExists = async (req, res) => {
  const { section_id, schedule_id, date } = req.query;

  try {
    const [rows] = await db.promise().query(
      `SELECT COUNT(*) AS count 
       FROM attendance 
       WHERE section_id = ? 
         AND schedule_id = ? 
         AND date = ?`,
      [section_id, schedule_id, date]
    );

    const exists = rows[0].count > 0;
    return res.status(200).json({ success: true, exists });

  } catch (error) {
    console.error('Check attendance error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getStudentAttendance = async (req, res) => {
  const { student_id } = req.params;

  try {
    // Get all enrolled courses with absence count
    const [courses] = await db.promise().query(
      `SELECT 
        c.id AS course_id,
        c.name AS course_name,
        sec.id AS section_id,
        sec.section_code,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS total_absences
       FROM course_enrollments ce
       JOIN course_sections sec ON ce.section_id = sec.id
       JOIN courses c ON sec.course_id = c.id
       LEFT JOIN attendance a ON a.student_id = ce.student_id AND a.section_id = sec.id
       WHERE ce.student_id = ?
       GROUP BY c.id, c.name, sec.id, sec.section_code
       ORDER BY c.name ASC`,
      [student_id]
    );

    return res.status(200).json({ success: true, data: courses });

  } catch (error) {
    console.error('Get student attendance error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getStudentAbsenceDetails = async (req, res) => {
  const { student_id, section_id } = req.params;

  try {
    const [absences] = await db.promise().query(
      `SELECT 
        a.date,
        cs.start_time,
        cs.end_time,
        cs.room,
        cs.building,
        cs.day_of_week
       FROM attendance a
       JOIN course_schedule cs ON a.schedule_id = cs.id
       WHERE a.student_id = ?
         AND a.section_id = ?
         AND a.status = 'absent'
       ORDER BY a.date DESC, cs.start_time ASC`,
      [student_id, section_id]
    );

    return res.status(200).json({ success: true, data: absences });

  } catch (error) {
    console.error('Get absence details error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getSectionStudents, getSectionSessions, submitAttendance, getAbsenceSummary, checkAttendanceExists, getStudentAttendance, getStudentAbsenceDetails };
