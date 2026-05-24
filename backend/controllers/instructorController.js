const db = require('../config/db');

const getInstructorCourses = async (req, res) => {
  const { instructor_id } = req.params;
  const { semester_id } = req.query; // optional filter

  if (!instructor_id) {
    return res.status(400).json({ success: false, message: 'Instructor ID is required' });
  }

  try {
    let semesterFilter = '';
    const params = [instructor_id];
    
    if (semester_id) {
      semesterFilter = 'AND sec.semester_id = ?';
      params.push(semester_id);
    } else {
      // Default to current semester
      semesterFilter = `AND sec.semester_id = (
        SELECT id FROM semesters WHERE is_current = 1 LIMIT 1
      )`;
    }

    const [courses] = await db.promise().query(
      `SELECT 
        c.id AS course_id,
        c.name AS course_name,
        c.credits,
        c.type,
        sec.id AS section_id,
        sec.section_code,
        sec.seats,
        sec.max_seats,
        sec.semester_id,
        sem.name AS semester_name,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        cs.room,
        cs.building
       FROM course_sections sec
       JOIN courses c ON sec.course_id = c.id
       LEFT JOIN semesters sem ON sec.semester_id = sem.id
       LEFT JOIN course_schedule cs ON cs.section_id = sec.id
       WHERE sec.instructor_id = ?
         ${semesterFilter}
       ORDER BY c.name, cs.day_of_week, cs.start_time`,
      params
    );

    // Group by course-section
    const map = {};
    courses.forEach(row => {
      const key = `${row.course_id}-${row.section_id}`;
      if (!map[key]) {
        map[key] = {
          course_id: row.course_id,
          course_name: row.course_name,
          credits: row.credits,
          type: row.type,
          section_id: row.section_id,
          section_code: row.section_code,
          seats: row.seats,
          max_seats: row.max_seats,
          semester_id: row.semester_id,
          semester_name: row.semester_name,
          schedules: []
        };
      }
      if (row.day_of_week) {
        map[key].schedules.push({
          day: row.day_of_week,
          start: row.start_time,
          end: row.end_time,
          room: row.room,
          building: row.building
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: Object.values(map)
    });

  } catch (error) {
    console.error('Get instructor courses error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getInstructorCourses };