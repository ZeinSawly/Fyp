const express = require('express');
const router = express.Router();
const { 
    addStudent, 
    deactivateStudent, 
    lookupStudent, 
    addInstructor, 
    getDepartments, 
    lookupInstructor, 
    deactivateInstructor, 
    getMajors,
    addFinanceOfficer,
    lookupFinanceOfficer,
    deactivateFinanceOfficer
} = require('../controllers/adminController');

const { 
    addGradeComponent, 
    getCourseComponents, 
    deleteGradeComponent, 
    getAllCoursesForDropdown 
} = require('../controllers/gradeController');

const { 
    getAllCourses, 
    addCourse, 
    getCourseSections, 
    addCourseSection, 
    getAllInstructors, 
    addCourseSchedule, 
    getSectionSchedule, 
    getAllMajors,
    getStudentSchedule,
    getStudentEnrolledCourses,
    getAvailableCoursesForSemester
} = require('../controllers/courseController');

const { verifyToken } = require('../middlewares/authMiddleware');

// ============================================
// STUDENT MANAGEMENT
// ============================================
router.post('/add-student', addStudent);
router.post('/deactivate-student', deactivateStudent);
router.get('/lookup-student/:id', lookupStudent);

// ============================================
// INSTRUCTOR MANAGEMENT
// ============================================
router.post('/add-instructor', addInstructor);
router.get('/lookup-instructor/:id', lookupInstructor);
router.post('/deactivate-instructor', deactivateInstructor);
router.get('/instructors/all', getAllInstructors);

// ============================================
// FINANCE OFFICER MANAGEMENT
// ============================================
router.post('/add-finance-officer', addFinanceOfficer);
router.get('/lookup-finance-officer/:id', lookupFinanceOfficer);
router.post('/deactivate-finance-officer', deactivateFinanceOfficer);

// ============================================
// DEPARTMENTS & MAJORS
// ============================================
router.get('/departments', getDepartments);
router.get('/majors', getMajors);
router.get('/majors-list', getAllMajors);

// ============================================
// COURSE MANAGEMENT (ADMIN)
// ============================================

// Course Catalog
router.get('/courses', getAllCourses);
router.post('/courses/add', addCourse);

// Course Sections (with semester)
router.get('/courses/:course_id/sections', getCourseSections);
router.post('/courses/sections/add', addCourseSection);

// Course Schedule
router.post('/courses/schedule/add', addCourseSchedule);
router.get('/sections/:section_id/schedule', getSectionSchedule);

// ============================================
// GRADE COMPONENTS
// ============================================
router.get('/courses-for-dropdown', getAllCoursesForDropdown);
router.post('/grade-component', addGradeComponent);
router.get('/grade-component/:course_id', getCourseComponents);
router.delete('/grade-component/:component_id', deleteGradeComponent);

module.exports = router;