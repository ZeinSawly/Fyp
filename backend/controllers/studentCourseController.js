const db = require('../config/db'); // Make sure this is the promise version

const getCoursesForStudent = async (req, res) => {
    const { student_id } = req.params;
  
    if (!student_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required.' 
      });
    }
  
    try {
      // Get the student's major_id
      const [student] = await db.promise().query(
        'SELECT major_id FROM students WHERE user_id = ?',
        [student_id]
      );
  
      if (student.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student not found.' 
        });
      }
  
      const major_id = student[0].major_id;
  
      // Fix: Use subqueries or DISTINCT instead of GROUP BY
      const [courses] = await db.promise().query(
        `SELECT 
            c.id, 
            c.name, 
            c.description, 
            c.credits,
            c.type,
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM course_sections cs 
                    JOIN course_enrollments ce ON cs.id = ce.section_id 
                    WHERE cs.course_id = c.id AND ce.student_id = ?
                ) THEN 'enrolled'
                WHEN EXISTS (
                    SELECT 1 FROM shopping_cart sc 
                    WHERE sc.course_id = c.id AND sc.student_id = ?
                ) THEN 'in_cart'
                ELSE 'available'
            END AS status

         FROM courses c
         ORDER BY c.id`,
         [student_id, student_id]
      );
  
      return res.status(200).json({
        success: true,
        data: courses
      });
  
    } catch (error) {
      console.error('Error fetching courses for student:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
};

// Add this to your studentCourseController.js or create a new controller

// Add this function to your existing studentCourseController.js

const getCourseSchedule = async (req, res) => {
  const { course_id } = req.params;
  const { student_id } = req.query;
  
  if (!course_id) {
      return res.status(400).json({
          success: false,
          message: 'Course ID is required'
      });
  }
  
  try {
      // Get all schedules for all sections of this course
      const [schedules] = await db.promise().query(
          `SELECT 
              cs.id,
              cs.day_of_week,
              cs.start_time,
              cs.end_time,
              cs.room,
              cs.building,
              sec.section_code,
              sec.seats,
              sec.id as section_id,
              u.name as instructor_name,
              u.id as instructor_id,
              CASE WHEN sc.id IS NULL THEN 0 ELSE 1 END AS is_in_cart,
              CASE WHEN ce.id IS NULL THEN 0 ELSE 1 END AS is_enrolled
           FROM course_schedule cs
           JOIN course_sections sec ON cs.section_id = sec.id
           LEFT JOIN instructors i ON sec.instructor_id = i.user_id
           LEFT JOIN users u ON i.user_id = u.id
           LEFT JOIN shopping_cart sc 
             ON sc.section_id = sec.id
            AND sc.course_id = sec.course_id
            AND (? IS NOT NULL AND sc.student_id = ?)
           LEFT JOIN course_enrollments ce
            ON ce.section_id = sec.id
            AND ce.student_id = ?
           WHERE sec.course_id = ?
           ORDER BY 
               FIELD(cs.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
               cs.start_time`,
          [student_id || null, student_id ||  null, student_id || null, course_id]
      );
      
      // Group schedules by section to show available sections
      const sections = {};
      schedules.forEach(schedule => {
          if (!sections[schedule.section_code]) {
              sections[schedule.section_code] = {
                  section_code: schedule.section_code,
                  instructor: schedule.instructor_name || 'TBA',
                  instructor_id: schedule.instructor_id,
                  seats: schedule.seats,
                  schedules: []
              };
          }
          sections[schedule.section_code].schedules.push({
              day_of_week: schedule.day_of_week,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              room: schedule.room,
              building: schedule.building
          });
      });
      
      return res.status(200).json({
          success: true,
          data: schedules, // Raw schedules for combining on frontend
          sections: Object.values(sections) // Optional: grouped by section
      });
      
  } catch (error) {
      console.error('Error fetching course schedule:', error);
      return res.status(500).json({
          success: false,
          message: 'Server error',
          error: error.message
      });
  }
};

const addToCart = async (req, res) => {
  const { student_id, section_id, course_id } = req.body;

  if (!student_id || !section_id || !course_id) {
    return res.status(400).json({
      success: false,
      message: 'student_id, course_id, and section_id are required'
    });
  }

  try {

    const [sectionCheck] = await db.promise().query(
      `SELECT seats FROM course_sections WHERE id = ?`,
      [section_id]
    );
    if (sectionCheck[0].seats <= 0) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    if (sectionCheck[0].seats <= 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot add to cart: Section is full'
      });
    }

    // 1. Prevent exact duplicate (same section twice)
    const [existing] = await db.promise().query(
      `SELECT * FROM shopping_cart 
       WHERE student_id = ? 
       AND course_id = ? 
       AND section_id = ?`,
      [student_id, course_id, section_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This section is already in cart'
      });
    }

    // 2. Insert (allow multiple sections per course)
    await db.promise().query(
      `INSERT INTO shopping_cart 
       (student_id, course_id, section_id, created_at)
       VALUES (?, ?, ?, NOW())`,
      [student_id, course_id, section_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Section added to cart successfully'
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getStudentCart = async (req, res) => {
  const { student_id } = req.params;

  if (!student_id) {
    return res.status(400).json({
      success: false,
      message: 'student_id is required'
    });
  }

  try {
    const [rows] = await db.promise().query(
      `SELECT
          sc.id AS cart_id,
          sc.student_id,
          sc.course_id,
          sc.section_id,
          sc.created_at,
          c.name AS course_name,
          c.credits,
          sec.section_code,
          sec.seats,
          COALESCE(u.name, 'TBA') AS instructor_name,

          cs.day_of_week,
          cs.start_time,
          cs.end_time

       FROM shopping_cart sc
       JOIN courses c ON c.id = sc.course_id
       LEFT JOIN course_sections sec ON sec.id = sc.section_id
       LEFT JOIN instructors i ON sec.instructor_id = i.user_id
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN course_schedule cs ON cs.section_id = sec.id

       WHERE sc.student_id = ?
       ORDER BY sc.created_at DESC, cs.day_of_week, cs.start_time`,
      [student_id]
    );

    // ==============================
    // GROUP DATA PROPERLY (IMPORTANT)
    // ==============================
    const map = {};

    rows.forEach(row => {
      const key = `${row.course_id}-${row.section_id}`;

      if (!map[key]) {
        map[key] = {
          cart_id: row.cart_id,
          student_id: row.student_id,
          course_id: row.course_id,
          section_id: row.section_id,
          course_name: row.course_name,
          credits: row.credits,
          section_code: row.section_code,
          seats: row.seats,
          instructor_name: row.instructor_name,
          schedules: []
        };
      }

      if (row.day_of_week) {
        map[key].schedules.push({
          day: row.day_of_week,
          start: row.start_time,
          end: row.end_time
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: Object.values(map)
    });

  } catch (error) {
    console.error('Error fetching student cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const removeCartItem = async (req, res) => {
  const { student_id, section_id, course_id } = req.body;

  if (!student_id || !section_id || !course_id) {
    return res.status(400).json({
      success: false,
      message: 'student_id, section_id, and course_id are required'
    });
  }

  try {
    const [result] = await db.promise().query(
      `DELETE FROM shopping_cart
       WHERE student_id = ?
         AND section_id = ?
         AND course_id = ?`,
      [student_id, section_id, course_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const enrollCartItem = async (req, res) => {
  const { student_id, section_id, course_id } = req.body;

  if (!student_id || !section_id || !course_id) {
    return res.status(400).json({
      success: false,
      message: 'student_id, section_id, and course_id are required'
    });
  }

  const connection = db.promise();

  try {
    await connection.beginTransaction();

    // 1. Check if item exists in cart
    const [cartRows] = await connection.query(
      `SELECT id FROM shopping_cart
       WHERE student_id = ? AND section_id = ? AND course_id = ?`,
      [student_id, section_id, course_id]
    );

    if (cartRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Section not found in cart'
      });
    }

    // 2. Prevent duplicate section enrollment
    const [existingEnrollment] = await connection.query(
      `SELECT id FROM course_enrollments
       WHERE student_id = ? AND section_id = ?`,
      [student_id, section_id]
    );

    if (existingEnrollment.length > 0) {
      await connection.query(
        `DELETE FROM shopping_cart
         WHERE student_id = ? AND section_id = ? AND course_id = ?`,
        [student_id, section_id, course_id]
      );
      await connection.commit();
      return res.status(200).json({
        success: true,
        message: 'Already enrolled. Item removed from cart.'
      });
    }

    // 3. Prevent same course in different section
    const [existingCourse] = await connection.query(
      `SELECT ce.id
       FROM course_enrollments ce
       JOIN course_sections cs ON ce.section_id = cs.id
       WHERE ce.student_id = ? AND cs.course_id = ?`,
      [student_id, course_id]
    );

    if (existingCourse.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'You are already enrolled in another section of this course'
      });
    }

    // 4. Check capacity
    const [sectionRows] = await connection.query(
      `SELECT seats FROM course_sections WHERE id = ? FOR UPDATE`,
      [section_id]
    );

    if (sectionRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    const currentCapacity = Number(sectionRows[0].seats);

    if (currentCapacity <= 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Section is full (0 seats available)'
      });
    }

    // 5. Insert enrollment
    await connection.query(
      `INSERT INTO course_enrollments (student_id, section_id, enrolled_at)
       VALUES (?, ?, CURDATE())`,
      [student_id, section_id]
    );

    // 6. Decrease capacity
    await connection.query(
      `UPDATE course_sections SET seats = seats - 1 WHERE id = ?`,
      [section_id]
    );

    // 7. Remove from cart
    await connection.query(
      `DELETE FROM shopping_cart
       WHERE student_id = ? AND section_id = ? AND course_id = ?`,
      [student_id, section_id, course_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Enrolled successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Enroll cart item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getEnrolledCourses = async (req, res) => {
  const { student_id } = req.params;

  try {
    const [rows] = await db.promise().query(
      `SELECT 
          c.name AS course_name, 
          c.id AS course_id, 
          c.credits, 
          sec.section_code, 
          sec.id AS section_id
       FROM course_enrollments ce
       JOIN course_sections sec ON ce.section_id = sec.id
       JOIN courses c ON sec.course_id = c.id
       WHERE ce.student_id = ?`,
      [student_id]
    );

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const dropCourse = async (req, res) => {
  const { student_id, section_id } = req.body;

  if (!student_id || !section_id) {
    return res.status(400).json({
      success: false,
      message: 'student_id and section_id are required'
    });
  }

  const connection = db.promise();

  try {
    await connection.beginTransaction();

    // 1. Check if the enrollment exists
    const [enrollment] = await connection.query(
      `SELECT id FROM course_enrollments 
       WHERE student_id = ? AND section_id = ?`,
      [student_id, section_id]
    );

    if (enrollment.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Enrollment record not found.'
      });
    }

    // 2. Remove the enrollment record
    await connection.query(
      `DELETE FROM course_enrollments 
       WHERE student_id = ? AND section_id = ?`,
      [student_id, section_id]
    );

    // 3. Increase the section capacity back by 1
    const [currentSection] = await connection.query(
      `SELECT seats, seats FROM course_sections WHERE id = ? FOR UPDATE`,
      [section_id]
    );

    let newCapacity = currentSection[0].seats + 1;
    const maxCapacity = currentSection[0].seats;

    if (maxCapacity && newCapacity > maxCapacity) {
      newCapacity = maxCapacity; // Cap at max_capacity
    }

    await connection.query(
      `UPDATE course_sections SET seats = ? WHERE id = ?`,
      [newCapacity, section_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Course dropped successfully and seat restored.'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Drop course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const swapCourseWithCart = async (req, res) => {
  const { 
    student_id, 
    enrolled_section_id,    // Section to drop (currently enrolled)
    enrolled_course_id,     // Course being dropped
    cart_item_id            // The cart item to swap with (from shopping_cart)
  } = req.body;

  if (!student_id || !enrolled_section_id || !enrolled_course_id || !cart_item_id) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: student_id, enrolled_section_id, enrolled_course_id, cart_item_id'
    });
  }

  const connection = db.promise();

  try {
    await connection.beginTransaction();

    // 1. Get cart item details and lock it
    const [cartItem] = await connection.query(
      `SELECT sc.id, sc.section_id, sc.course_id, c.name as course_name
       FROM shopping_cart sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.id = ? AND sc.student_id = ?
       FOR UPDATE`,
      [cart_item_id, student_id]
    );

    if (cartItem.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    const new_section_id = cartItem[0].section_id;
    const new_course_id = cartItem[0].course_id;

    // 2. Prevent swapping to same course/section
    if (enrolled_section_id === new_section_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot swap to the same section'
      });
    }

    // 3. Verify student is enrolled in the course to drop
    const [enrollmentToDrop] = await connection.query(
      `SELECT id FROM course_enrollments 
       WHERE student_id = ? AND section_id = ?`,
      [student_id, enrolled_section_id]
    );

    if (enrollmentToDrop.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in the course you want to drop'
      });
    }

    // 4. Check if new section has capacity
    const [newSection] = await connection.query(
      `SELECT id, seats, course_id 
       FROM course_sections 
       WHERE id = ? FOR UPDATE`,
      [new_section_id]
    );

    if (newSection.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Target section not found'
      });
    }

    if (newSection[0].seats <= 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: `Cannot swap: ${cartItem[0].course_name} section is full`
      });
    }

    // 5. Check if student is already enrolled in the new course
    const isSameCourse = (enrolled_course_id === new_course_id);
    
    if (isSameCourse) {
      // For SAME course (section swap): Just check if already enrolled in THIS specific section
      const [alreadyInThisSection] = await connection.query(
        `SELECT id FROM course_enrollments 
         WHERE student_id = ? AND section_id = ?`,
        [student_id, new_section_id]
      );
      
      if (alreadyInThisSection.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'You are already enrolled in this section'
        });
      }
      // No need to check other sections - it's fine to swap sections of same course
    } else {
      // For DIFFERENT course: Check if already enrolled in any section of the new course
      const [alreadyEnrolled] = await connection.query(
        `SELECT ce.id 
         FROM course_enrollments ce
         JOIN course_sections cs ON ce.section_id = cs.id
         WHERE ce.student_id = ? AND cs.course_id = ?`,
        [student_id, new_course_id]
      );
      
      if (alreadyEnrolled.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'You are already enrolled in another section of this course'
        });
      }
    }

    // 6. Check for schedule conflicts with other enrolled courses (excluding the one being dropped)
    // Get new section's schedule
    const [newSchedule] = await connection.query(
      `SELECT day_of_week, start_time, end_time 
       FROM course_schedule WHERE section_id = ?`,
      [new_section_id]
    );

    // Get student's other enrolled courses (excluding the one being dropped)
    const [otherEnrollments] = await connection.query(
      `SELECT cs.id as section_id, csched.day_of_week, csched.start_time, csched.end_time
       FROM course_enrollments ce
       JOIN course_sections cs ON ce.section_id = cs.id
       JOIN course_schedule csched ON cs.id = csched.section_id
       WHERE ce.student_id = ? AND ce.section_id != ?`,
      [student_id, enrolled_section_id]
    );

    // Check for time conflicts
    const hasConflict = checkScheduleConflict(newSchedule, otherEnrollments);
    if (hasConflict) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Schedule conflict with another enrolled course'
      });
    }

    // 7. Check prerequisites for the new course
    const [prerequisites] = await connection.query(
      `SELECT prerequisite_id FROM course_prerequisites WHERE course_id = ?`,
      [new_course_id]
    );

    if (prerequisites.length > 0) {
      const prerequisiteIds = prerequisites.map(p => p.prerequisite_id);
      const placeholders = prerequisiteIds.map(() => '?').join(',');
      
      const [completedPrereqs] = await connection.query(
        `SELECT DISTINCT cs.course_id 
         FROM course_enrollments ce
         JOIN course_sections cs ON ce.section_id = cs.id
         WHERE ce.student_id = ? AND cs.course_id IN (${placeholders})`,
        [student_id, ...prerequisiteIds]
      );

      const completedIds = completedPrereqs.map(p => p.course_id);
      const missingPrereqs = prerequisiteIds.filter(id => !completedIds.includes(id));
      
      if (missingPrereqs.length > 0) {
        await connection.rollback();
        const [missingNames] = await connection.query(
          `SELECT name FROM courses WHERE id IN (?)`,
          [missingPrereqs]
        );
        return res.status(409).json({
          success: false,
          message: `Missing prerequisites: ${missingNames.map(p => p.name).join(', ')}`
        });
      }
    }

    // ========== PERFORM THE SWAP ==========

    // Drop the old course
    await connection.query(
      `DELETE FROM course_enrollments 
       WHERE student_id = ? AND section_id = ?`,
      [student_id, enrolled_section_id]
    );

    // Restore capacity to dropped section
    await connection.query(
      `UPDATE course_sections SET seats = seats + 1 WHERE id = ?`,
      [enrolled_section_id]
    );

    // Enroll in new course from cart
    await connection.query(
      `INSERT INTO course_enrollments (student_id, section_id, enrolled_at)
       VALUES (?, ?, CURDATE())`,
      [student_id, new_section_id]
    );

    // Decrease capacity of new section
    await connection.query(
      `UPDATE course_sections SET seats = seats - 1 WHERE id = ?`,
      [new_section_id]
    );

    // Remove the cart item (since it's now enrolled)
    await connection.query(
      `DELETE FROM shopping_cart WHERE id = ?`,
      [cart_item_id]
    );

    await connection.commit();

    // Get course names for response
    const [droppedCourse] = await connection.query(
      `SELECT c.name FROM course_sections cs 
       JOIN courses c ON cs.course_id = c.id 
       WHERE cs.id = ?`,
      [enrolled_section_id]
    );

    const swapType = isSameCourse ? 'section' : 'course';

    return res.status(200).json({
      success: true,
      message: isSameCourse 
        ? `Successfully changed section for ${droppedCourse[0].name}`
        : `Successfully swapped ${droppedCourse[0].name} for ${cartItem[0].course_name}`,
      data: {
        dropped_course: droppedCourse[0].name,
        enrolled_course: cartItem[0].course_name,
        swap_type: swapType
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Swap course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function for schedule conflict (same as before)
const checkScheduleConflict = (newSchedule, existingEnrollments) => {
  if (!newSchedule || newSchedule.length === 0) return false;
  
  for (const newSession of newSchedule) {
    for (const existing of existingEnrollments) {
      if (newSession.day_of_week !== existing.day_of_week) continue;
      
      const newStart = new Date(`1970-01-01T${newSession.start_time}`);
      const newEnd = new Date(`1970-01-01T${newSession.end_time}`);
      const existingStart = new Date(`1970-01-01T${existing.start_time}`);
      const existingEnd = new Date(`1970-01-01T${existing.end_time}`);
      
      if (newStart < existingEnd && newEnd > existingStart) {
        return true;
      }
    }
  }
  return false;
};

// Get enrolled courses for dropdown
const getEnrolledCoursesForSwap = async (req, res) => {
  const { student_id } = req.params;

  try {
    const [courses] = await db.promise().query(
      `SELECT 
          c.id as course_id,
          c.name as course_name,
          c.credits,
          sec.id as section_id,
          sec.section_code,
          COALESCE(u.name, 'TBA') as instructor_name,
          GROUP_CONCAT(
            CONCAT(cs.day_of_week, '|', cs.start_time, '|', cs.end_time)
            SEPARATOR '||'
          ) as schedule_data
       FROM course_enrollments ce
       JOIN course_sections sec ON ce.section_id = sec.id
       JOIN courses c ON sec.course_id = c.id
       LEFT JOIN instructors i ON sec.instructor_id = i.user_id
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN course_schedule cs ON sec.id = cs.section_id
       WHERE ce.student_id = ?
       GROUP BY sec.id
       ORDER BY c.name`,
      [student_id]
    );

    // Parse schedule data
    const parsedCourses = courses.map(course => {
      const schedules = [];
      if (course.schedule_data) {
        course.schedule_data.split('||').forEach(scheduleStr => {
          const [day, start, end] = scheduleStr.split('|');
          schedules.push({ day, start, end });
        });
      }
      return {
        ...course,
        schedules
      };
    });

    return res.status(200).json({
      success: true,
      data: parsedCourses
    });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get cart items for swap dropdown
const getCartItemsForSwap = async (req, res) => {
  const { student_id } = req.params;

  try {
    const [cartItems] = await db.promise().query(
      `SELECT 
          sc.id as cart_item_id,
          sc.course_id,
          c.name as course_name,
          c.credits,
          sc.section_id,
          sec.section_code,
          sec.seats,
          COALESCE(u.name, 'TBA') as instructor_name,
          GROUP_CONCAT(
            CONCAT(cs.day_of_week, '|', cs.start_time, '|', cs.end_time)
            SEPARATOR '||'
          ) as schedule_data
       FROM shopping_cart sc
       JOIN courses c ON sc.course_id = c.id
       JOIN course_sections sec ON sc.section_id = sec.id
       LEFT JOIN instructors i ON sec.instructor_id = i.user_id
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN course_schedule cs ON sec.id = cs.section_id
       WHERE sc.student_id = ?
       GROUP BY sc.id
       ORDER BY c.name`,
      [student_id]
    );

    // Parse schedule data
    const parsedItems = cartItems.map(item => {
      const schedules = [];
      if (item.schedule_data) {
        item.schedule_data.split('||').forEach(scheduleStr => {
          const [day, start, end] = scheduleStr.split('|');
          schedules.push({ day, start, end });
        });
      }
      return {
        ...item,
        schedules
      };
    });

    return res.status(200).json({
      success: true,
      data: parsedItems
    });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getCoursesForStudent,
  getCourseSchedule,
  addToCart,
  getStudentCart,
  removeCartItem,
  enrollCartItem,
  getEnrolledCourses,
  dropCourse,
  swapCourseWithCart,             
  getEnrolledCoursesForSwap,      
  getCartItemsForSwap  
};