// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { getStudentSchedule } = require('../controllers/studScheduleController');
const { getFinancialSummary } = require('../controllers/studentFinancialController');
const {getCoursesForStudent, getCourseSchedule, addToCart, getStudentCart, removeCartItem, enrollCartItem, dropCourse, getEnrolledCourses, swapCourseWithCart, getEnrolledCoursesForSwap, getCartItemsForSwap, getCurrentSemester, } = require('../controllers/studentCourseController');
const { getStudentAttendance, getStudentAbsenceDetails } = require('../controllers/attendanceController');
const { getStudentGrades } = require('../controllers/gradeController');


// ========== SEMESTER ROUTES ==========
router.get('/current-semester', getCurrentSemester);

// ========== SCHEDULE ROUTES ==========
router.get('/:student_id/schedule', getStudentSchedule);

// ========== FINANCIAL ROUTES ==========
router.get('/:id/financial-summary', getFinancialSummary);

// ========== COURSE ROUTES ==========
router.get('/:student_id/courses', getCoursesForStudent);
router.get('/course/:course_id/schedule', getCourseSchedule);
router.get('/:student_id/enrolled-courses', getEnrolledCourses);

// ========== SHOPPING CART ROUTES ==========
router.post('/cart/add', addToCart);
router.get('/:student_id/cart', getStudentCart);
router.delete('/cart/remove', removeCartItem);
router.post('/cart/enroll', enrollCartItem);

// ========== DROP COURSE ROUTE ==========
router.delete('/drop-course', dropCourse);

// ========== SWAP COURSE ROUTES ==========
router.post('/swap-with-cart', swapCourseWithCart);
router.get('/:student_id/enrolled-courses/swap', getEnrolledCoursesForSwap);
router.get('/:student_id/cart-items/swap', getCartItemsForSwap);

// ========== ATTENDANCE ROUTES ==========
router.get('/:student_id/attendance', getStudentAttendance);
router.get('/:student_id/attendance/:section_id', getStudentAbsenceDetails);

// ========== GRADES ROUTES ==========
router.get('/:student_id/grades', getStudentGrades);


module.exports = router;
