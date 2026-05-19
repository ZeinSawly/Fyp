const db = require('../config/db');

const getInstructorCourses = async (req, res) => {
  const { instructor_id } = req.params;

  if (!instructor_id) {
    return res.status(400).json({ success: false, message: 'Instructor ID is required' });
  }

  try {
    const [courses] = await db.promise().query(
      `SELECT 
        c.id AS course_id,
        c.name AS course_name,
        c.credits,
        c.type,
        sec.id AS section_id,
        sec.section_code,
        sec.capacity,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        cs.room,
        cs.building
       FROM course_sections sec
       JOIN courses c ON sec.course_id = c.id
       LEFT JOIN course_schedule cs ON cs.section_id = sec.id
       WHERE sec.instructor_id = ?
       ORDER BY c.name, cs.day_of_week, cs.start_time`,
      [instructor_id]
    );

    // Group by course
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
          capacity: row.capacity,
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