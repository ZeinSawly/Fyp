const db = require('../config/db');

const getStudentSchedule = (req, res) => {
  const { student_id } = req.params;

  console.log('Fetching schedule for student:', student_id);

  const query = `
    SELECT cs.id AS schedule_id,
           sec.course_id,
           c.name AS course_name,
           sec.section_code,
           cs.day_of_week,
           cs.start_time,
           cs.end_time,
           cs.room,
           cs.building
    FROM course_enrollments ce
    JOIN course_sections sec ON ce.section_id = sec.id
    JOIN courses c ON sec.course_id = c.id
    JOIN course_schedule cs ON cs.section_id = sec.id
    WHERE ce.student_id = ?
    ORDER BY FIELD(cs.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
             cs.start_time
  `;

  db.query(query, [student_id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        message: 'Database error', 
        error: err.sqlMessage 
      });
    }

    console.log(`Found ${results.length} schedule items for student ${student_id}`);

    const scheduleByDay = {
      'Mon': [],
      'Tue': [],
      'Wed': [],
      'Thu': [],
      'Fri': [],
      'Sat': [],
      'Sun': []
    };

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'];

    results.forEach(row => {
      const dayMap = {
        'Monday': 'Mon',
        'Tuesday': 'Tue',
        'Wednesday': 'Wed',
        'Thursday': 'Thu',
        'Friday': 'Fri',
        'Saturday': 'Sat',
        'Sunday': 'Sun'
      };
      
      const day = dayMap[row.day_of_week] || row.day_of_week.slice(0, 3);
      
      const colorIndex = (parseInt(row.course_id) || 0) % colors.length;
      
      const startTime = row.start_time ? row.start_time.slice(0, 5) : '00:00';
      const endTime = row.end_time ? row.end_time.slice(0, 5) : '00:00';
      
      scheduleByDay[day].push({
        schedule_id: row.schedule_id,
        course_id: row.course_id,
        course: row.course_name || 'Unknown Course',
        section_code: row.section_code,
        time: `${startTime} - ${endTime}`,
        room: row.room ? (row.building ? `${row.room}, ${row.building}` : row.room) : 'Room TBD',
        color: colors[colorIndex]
      });
    });

    console.log('Schedule by day:', scheduleByDay);
    res.json(scheduleByDay);
  });
};

module.exports = { getStudentSchedule };