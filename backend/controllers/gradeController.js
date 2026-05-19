const db = require('../config/db');

// ADMIN: Add grade component for a course
const addGradeComponent = async (req, res) => {
  const { course_id, name, max_grade, weight } = req.body;

  if (!course_id || !name || !max_grade || !weight) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check total weight doesn't exceed 100%
    const [existing] = await db.promise().query(
      `SELECT COALESCE(SUM(weight), 0) AS total_weight 
       FROM grade_components 
       WHERE course_id = ?`,
      [course_id]
    );

    const currentTotal = parseFloat(existing[0].total_weight);
    if (currentTotal + parseFloat(weight) > 100) {
      return res.status(400).json({
        message: `Total weight would exceed 100%. Current total: ${currentTotal}%`
      });
    }

    await db.promise().query(
      `INSERT INTO grade_components (course_id, name, max_grade, weight)
       VALUES (?, ?, ?, ?)`,
      [course_id, name, max_grade, weight]
    );

    return res.status(201).json({ message: 'Grade component added successfully' });

  } catch (error) {
    console.error('Add grade component error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Get grade components for a course
const getCourseComponents = async (req, res) => {
  const { course_id } = req.params;

  try {
    const [components] = await db.promise().query(
      `SELECT id, name, max_grade, weight 
       FROM grade_components 
       WHERE course_id = ?
       ORDER BY id ASC`,
      [course_id]
    );

    return res.status(200).json({ success: true, data: components });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADMIN: Delete grade component
const deleteGradeComponent = async (req, res) => {
  const { component_id } = req.params;

  try {
    await db.promise().query(
      `DELETE FROM grade_components WHERE id = ?`,
      [component_id]
    );

    return res.status(200).json({ message: 'Component deleted successfully' });

  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN: Get all courses (for dropdown)
const getAllCoursesForDropdown = async (req, res) => {
  try {
    const [courses] = await db.promise().query(
      `SELECT id, name FROM courses ORDER BY name ASC`
    );
    return res.status(200).json({ success: true, data: courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// INSTRUCTOR: Get grade components for a course
const getComponentsForInstructor = async (req, res) => {
  const { course_id } = req.params;

  try {
    const [components] = await db.promise().query(
      `SELECT id, name, max_grade, weight 
       FROM grade_components 
       WHERE course_id = ?
       ORDER BY id ASC`,
      [course_id]
    );

    return res.status(200).json({ success: true, data: components });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// INSTRUCTOR: Get students with their grades for a component
const getStudentsWithGrades = async (req, res) => {
  const { section_id, component_id } = req.query;

  if (!section_id || !component_id) {
    return res.status(400).json({ success: false, message: 'section_id and component_id are required' });
  }

  try {
    const [students] = await db.promise().query(
      `SELECT 
        u.id AS student_id,
        u.name AS student_name,
        COALESCE(sg.grade, NULL) AS grade
       FROM course_enrollments ce
       JOIN users u ON ce.student_id = u.id
       LEFT JOIN student_grades sg 
         ON sg.student_id = u.id 
         AND sg.section_id = ce.section_id
         AND sg.component_id = ?
       WHERE ce.section_id = ?
       ORDER BY u.name ASC`,
      [component_id, section_id]
    );

    return res.status(200).json({ success: true, data: students });

  } catch (error) {
    console.error('Get students with grades error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// INSTRUCTOR: Submit grades
const submitGrades = async (req, res) => {
  const { section_id, component_id, grades, recorded_by } = req.body;
  // grades = [{ student_id, grade }, ...]

  if (!section_id || !component_id || !grades || !recorded_by) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const promises = grades.map(({ student_id, grade }) =>
      db.promise().query(
        `INSERT INTO student_grades (student_id, section_id, component_id, grade, recorded_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE grade = VALUES(grade), recorded_by = VALUES(recorded_by)`,
        [student_id, section_id, component_id, grade, recorded_by]
      )
    );

    await Promise.all(promises);

    return res.status(200).json({ success: true, message: 'Grades submitted successfully' });

  } catch (error) {
    console.error('Submit grades error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// STUDENT: Get grades for all enrolled courses
const getStudentGrades = async (req, res) => {
  const { student_id } = req.params;

  try {
    const [grades] = await db.promise().query(
      `SELECT 
        c.id AS course_id,
        c.name AS course_name,
        sec.id AS section_id,
        sec.section_code,
        gc.id AS component_id,
        gc.name AS component_name,
        gc.max_grade,
        gc.weight,
        sg.grade
       FROM course_enrollments ce
       JOIN course_sections sec ON ce.section_id = sec.id
       JOIN courses c ON sec.course_id = c.id
       LEFT JOIN grade_components gc ON gc.course_id = c.id
       LEFT JOIN student_grades sg 
         ON sg.student_id = ce.student_id 
         AND sg.section_id = sec.id
         AND sg.component_id = gc.id
       WHERE ce.student_id = ?
       ORDER BY c.name ASC, gc.id ASC`,
      [student_id]
    );

    // Group by course
    const map = {};
    grades.forEach(row => {
      const key = row.course_id;
      if (!map[key]) {
        map[key] = {
          course_id: row.course_id,
          course_name: row.course_name,
          section_id: row.section_id,
          section_code: row.section_code,
          components: []
        };
      }
      if (row.component_id) {
        map[key].components.push({
          component_id: row.component_id,
          component_name: row.component_name,
          max_grade: row.max_grade,
          weight: row.weight,
          grade: row.grade
        });
      }
    });

    return res.status(200).json({ success: true, data: Object.values(map) });

  } catch (error) {
    console.error('Get student grades error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  addGradeComponent,
  getCourseComponents,
  deleteGradeComponent,
  getAllCoursesForDropdown,
  getComponentsForInstructor,
  getStudentsWithGrades,
  submitGrades,
  getStudentGrades
};