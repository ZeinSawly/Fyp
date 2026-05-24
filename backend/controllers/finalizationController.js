const db = require('../config/db');

// ============================================================
// GRADING SCALE (Antonine policy)
// ============================================================
const GRADING_SCALE = [
  { min: 97, max: 100,   letter: 'A+', points: 4.00 },
  { min: 93, max: 96.99, letter: 'A',  points: 4.00 },
  { min: 89, max: 92.99, letter: 'A-', points: 3.70 },
  { min: 86, max: 88.99, letter: 'B+', points: 3.30 },
  { min: 83, max: 85.99, letter: 'B',  points: 3.00 },
  { min: 80, max: 82.99, letter: 'B-', points: 2.70 },
  { min: 77, max: 79.99, letter: 'C+', points: 2.30 },
  { min: 73, max: 76.99, letter: 'C',  points: 2.00 },
  { min: 70, max: 72.99, letter: 'C-', points: 1.70 },
  { min: 67, max: 69.99, letter: 'D+', points: 1.30 },
  { min: 63, max: 66.99, letter: 'D',  points: 1.00 },
  { min: 60, max: 62.99, letter: 'D-', points: 0.70 },
  { min: 0,  max: 59.99, letter: 'F',  points: 0.00 },
];

const PASSING_THRESHOLD_POINTS = 0.70; // D- and above is passing

const percentToLetter = (percent) => {
  const entry = GRADING_SCALE.find((g) => percent >= g.min && percent <= g.max);
  return entry || GRADING_SCALE[GRADING_SCALE.length - 1]; // default F
};

// ============================================================
// HELPER: Compute final grades for a section (read-only — used by preview)
// ============================================================
const computeSectionFinalGrades = async (connection, sectionId) => {
  // 1. Get section + course info
  const [[section]] = await connection.query(
    `SELECT 
        cs.id AS section_id,
        cs.course_id,
        cs.section_code,
        cs.semester_id,
        cs.grades_finalized,
        cs.instructor_id,
        c.name AS course_name,
        c.credits,
        sem.name AS semester_name
     FROM course_sections cs
     JOIN courses c ON cs.course_id = c.id
     LEFT JOIN semesters sem ON cs.semester_id = sem.id
     WHERE cs.id = ?`,
    [sectionId]
  );

  if (!section) {
    return { error: 'Section not found' };
  }

  // 2. Get grade components
  const [components] = await connection.query(
    `SELECT id, name, max_grade, weight
     FROM grade_components
     WHERE course_id = ?
     ORDER BY id`,
    [section.course_id]
  );

  if (components.length === 0) {
    return {
      section,
      components: [],
      students: [],
      students_with_missing_grades: [],
      can_finalize: false,
      reason: 'No grade components defined for this course. Ask admin to set them up.',
      summary: { total_students: 0, passed: 0, failed: 0, missing: 0 },
    };
  }

  // 3. Verify components sum to 100%
  const totalWeight = components.reduce((sum, c) => sum + Number(c.weight), 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    return {
      section,
      components,
      students: [],
      students_with_missing_grades: [],
      can_finalize: false,
      reason: `Grade components must total 100% (currently ${totalWeight.toFixed(1)}%). Ask admin to fix this.`,
      summary: { total_students: 0, passed: 0, failed: 0, missing: 0 },
    };
  }

  // 4. Get all enrolled students with their grades
  const [enrollments] = await connection.query(
    `SELECT ce.student_id, u.name AS student_name
     FROM course_enrollments ce
     JOIN users u ON ce.student_id = u.id
     WHERE ce.section_id = ?
     ORDER BY u.name`,
    [sectionId]
  );

  if (enrollments.length === 0) {
    return {
      section,
      components,
      students: [],
      students_with_missing_grades: [],
      can_finalize: false,
      reason: 'No students enrolled in this section.',
      summary: { total_students: 0, passed: 0, failed: 0, missing: 0 },
    };
  }

  // 5. For each student, compute their final grade
  const studentResults = [];
  const studentsWithMissingGrades = [];

  for (const enrollment of enrollments) {
    // Fetch this student's grades for all components in this section
    const [grades] = await connection.query(
      `SELECT 
          gc.id AS component_id,
          gc.name AS component_name,
          gc.max_grade,
          gc.weight,
          sg.grade
       FROM grade_components gc
       LEFT JOIN student_grades sg 
         ON sg.component_id = gc.id 
         AND sg.student_id = ? 
         AND sg.section_id = ?
       WHERE gc.course_id = ?
       ORDER BY gc.id`,
      [enrollment.student_id, sectionId, section.course_id]
    );

    // Check for missing grades
    const missingComponents = grades.filter(g => g.grade === null || g.grade === undefined);
    
    if (missingComponents.length > 0) {
      studentsWithMissingGrades.push({
        student_id: enrollment.student_id,
        student_name: enrollment.student_name,
        missing: missingComponents.map(g => g.component_name),
      });
      studentResults.push({
        student_id: enrollment.student_id,
        student_name: enrollment.student_name,
        component_grades: grades,
        final_percent: null,
        letter_grade: null,
        grade_points: null,
        status: 'missing_grades',
        credits_earned: 0,
      });
      continue;
    }

    // Compute weighted final grade (as percentage of max)
    let finalPercent = 0;
    for (const g of grades) {
      const componentPercent = (Number(g.grade) / Number(g.max_grade)) * 100;
      finalPercent += componentPercent * (Number(g.weight) / 100);
    }
    finalPercent = Math.round(finalPercent * 100) / 100;

    const gradeInfo = percentToLetter(finalPercent);
    const passed = gradeInfo.points >= PASSING_THRESHOLD_POINTS;

    studentResults.push({
      student_id: enrollment.student_id,
      student_name: enrollment.student_name,
      component_grades: grades,
      final_percent: finalPercent,
      letter_grade: gradeInfo.letter,
      grade_points: gradeInfo.points,
      status: passed ? 'passed' : 'failed',
      credits_earned: passed ? Number(section.credits) : 0,
    });
  }

  const canFinalize = studentsWithMissingGrades.length === 0 && !section.grades_finalized;
  let reason = null;
  if (section.grades_finalized) {
    reason = 'This section has already been finalized.';
  } else if (studentsWithMissingGrades.length > 0) {
    reason = `${studentsWithMissingGrades.length} student(s) have missing grades. Enter all grades before finalizing.`;
  }

  return {
    section,
    components,
    students: studentResults,
    students_with_missing_grades: studentsWithMissingGrades,
    can_finalize: canFinalize,
    reason,
    summary: {
      total_students: studentResults.length,
      passed: studentResults.filter(s => s.status === 'passed').length,
      failed: studentResults.filter(s => s.status === 'failed').length,
      missing: studentsWithMissingGrades.length,
    },
  };
};

// ============================================================
// HELPER: Recalculate a student's GPA based on most-recent-attempt rule
// ============================================================
const recalculateStudentGPA = async (connection, studentId) => {
  // Get the most recent attempt of each course
  // (latest by completed_at, falling back to id for tie-break)
  const [latestAttempts] = await connection.query(
    `SELECT scc.course_id, scc.grade_points, scc.credits_earned, scc.status
     FROM student_course_completions scc
     INNER JOIN (
       SELECT course_id, MAX(id) AS latest_id
       FROM student_course_completions
       WHERE student_id = ? 
         AND status IN ('passed', 'failed')
       GROUP BY course_id
     ) latest ON scc.id = latest.latest_id`,
    [studentId]
  );

  if (latestAttempts.length === 0) {
    // No completions yet
    await connection.query(
      `UPDATE students SET gpa = 0.00, completed_credits = 0 WHERE user_id = ?`,
      [studentId]
    );
    return { gpa: 0, completed_credits: 0 };
  }

  // GPA = SUM(grade_points × course_credits) / SUM(course_credits)
  // Need course credits, not just credits_earned (failed = 0 credits earned, but still counts in GPA divisor)
  let totalQualityPoints = 0;
  let totalCreditsAttempted = 0;
  let totalCreditsEarned = 0;

  for (const attempt of latestAttempts) {
    // Get the course credits
    const [[course]] = await connection.query(
      `SELECT credits FROM courses WHERE id = ?`,
      [attempt.course_id]
    );
    const credits = Number(course?.credits || 0);
    
    totalQualityPoints += Number(attempt.grade_points) * credits;
    totalCreditsAttempted += credits;
    
    if (attempt.status === 'passed') {
      totalCreditsEarned += Number(attempt.credits_earned);
    }
  }

  const gpa = totalCreditsAttempted > 0
    ? Math.round((totalQualityPoints / totalCreditsAttempted) * 100) / 100
    : 0;

  await connection.query(
    `UPDATE students SET gpa = ?, completed_credits = ? WHERE user_id = ?`,
    [gpa, totalCreditsEarned, studentId]
  );

  return { gpa, completed_credits: totalCreditsEarned };
};

// ============================================================
// ENDPOINT: GET /api/instructor/grades/finalize/preview/:section_id
// Shows what would be finalized (without writing)
// ============================================================
const previewFinalization = async (req, res) => {
  const { section_id } = req.params;
  const instructor_id = req.user?.id;

  if (!section_id) {
    return res.status(400).json({ success: false, message: 'section_id is required' });
  }

  const connection = await db.promise().getConnection();

  try {
    // Verify ownership
    const [ownership] = await connection.query(
      `SELECT id FROM course_sections WHERE id = ? AND instructor_id = ?`,
      [section_id, instructor_id]
    );

    if (ownership.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have access to this section' 
      });
    }

    const result = await computeSectionFinalGrades(connection, section_id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Preview finalization error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

// ============================================================
// ENDPOINT: POST /api/instructor/grades/finalize/:section_id
// Actually performs the finalization
// ============================================================
const finalizeGrades = async (req, res) => {
  const { section_id } = req.params;
  const instructor_id = req.user?.id;

  if (!section_id) {
    return res.status(400).json({ success: false, message: 'section_id is required' });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Verify ownership
    const [ownership] = await connection.query(
      `SELECT id, grades_finalized FROM course_sections 
       WHERE id = ? AND instructor_id = ?`,
      [section_id, instructor_id]
    );

    if (ownership.length === 0) {
      await connection.rollback();
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have access to this section' 
      });
    }

    if (ownership[0].grades_finalized) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'This section has already been finalized. Contact admin to reverse.' 
      });
    }

    // Compute grades
    const result = await computeSectionFinalGrades(connection, section_id);

    if (!result.can_finalize) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: result.reason || 'Cannot finalize this section' 
      });
    }

    // Insert completion rows
    for (const student of result.students) {
      // Use INSERT ... ON DUPLICATE KEY UPDATE — safe if a row already exists
      await connection.query(
        `INSERT INTO student_course_completions
            (student_id, course_id, section_id, semester_id,
             final_grade, letter_grade, grade_points, credits_earned,
             status, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
         ON DUPLICATE KEY UPDATE
            final_grade = VALUES(final_grade),
            letter_grade = VALUES(letter_grade),
            grade_points = VALUES(grade_points),
            credits_earned = VALUES(credits_earned),
            status = VALUES(status),
            completed_at = VALUES(completed_at)`,
        [
          student.student_id,
          result.section.course_id,
          section_id,
          result.section.semester_id,
          student.final_percent,
          student.letter_grade,
          student.grade_points,
          student.credits_earned,
          student.status,
        ]
      );
    }

    // Lock the section
    await connection.query(
      `UPDATE course_sections 
       SET grades_finalized = 1, finalized_at = NOW(), finalized_by = ?
       WHERE id = ?`,
      [instructor_id, section_id]
    );

    // Recalculate GPA for each affected student
    const gpaUpdates = [];
    for (const student of result.students) {
      const gpaResult = await recalculateStudentGPA(connection, student.student_id);
      gpaUpdates.push({
        student_id: student.student_id,
        student_name: student.student_name,
        new_gpa: gpaResult.gpa,
        completed_credits: gpaResult.completed_credits,
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Grades finalized for ${result.students.length} student(s).`,
      data: {
        section_id,
        course_name: result.section.course_name,
        section_code: result.section.section_code,
        students_finalized: result.students.length,
        passed: result.summary.passed,
        failed: result.summary.failed,
        gpa_updates: gpaUpdates,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Finalize grades error:', error);
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
  previewFinalization, 
  finalizeGrades 
};