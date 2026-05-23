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
    getCoursesBySemester,
    getAvailablePrerequisites,
    getCoursePrerequisites,
    getCourseById,
    updateCourse,
} = require('../controllers/courseController');

const {
    getSemesters,
    createSemester,
    updateSemester,
    setCurrentSemester,
    deleteSemester
} = require('../controllers/semesterController');

const {
    getCurrentCreditPrices,
    getCreditPricingHistory,
    updateCreditPrice,
    getFeeTypes,
    createFeeType,
    updateFeeType,
    getFeePricingHistory,
    updateFeePrice,
    getDiscountTypes,
    createDiscountType,
    updateDiscountType,
    getStudentDiscounts,
    awardDiscount,
    cancelStudentDiscount,
    searchStudentsForDiscount,
  } = require('../controllers/pricingController');

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
// ============================================
// PREREQUISITES
// ============================================
router.get('/courses/prerequisites/available', getAvailablePrerequisites);
router.get('/courses/:course_id/prerequisites', getCoursePrerequisites);

// Courses by semester (for student enrollment)
router.get('/courses/by-semester', getCoursesBySemester);

// Course Sections (with semester)
router.get('/courses/:course_id/sections', getCourseSections);
router.post('/courses/sections/add', addCourseSection);

// Course Schedule
router.post('/courses/schedule/add', addCourseSchedule);
router.get('/sections/:section_id/schedule', getSectionSchedule);

// Edit Course
router.get('/courses/:course_id', getCourseById);
router.put('/courses/:course_id', updateCourse);

// ============================================
// GRADE COMPONENTS
// ============================================
router.get('/courses-for-dropdown', getAllCoursesForDropdown);
router.post('/grade-component', addGradeComponent);
router.get('/grade-component/:course_id', getCourseComponents);
router.delete('/grade-component/:component_id', deleteGradeComponent);

// Semester routes
router.get('/semesters', getSemesters);
router.post('/semesters', createSemester);
router.put('/semesters/:id', updateSemester);
router.put('/semesters/:id/set-current', setCurrentSemester);
router.delete('/semesters/:id', deleteSemester);

// ============================================
// CREDIT PRICING
// ============================================
router.get('/credit-pricing/current', getCurrentCreditPrices);
router.get('/credit-pricing/history', getCreditPricingHistory);
router.put('/credit-pricing', updateCreditPrice);


// ============================================
// FEE MANAGEMENT
// ============================================
router.get('/fee-types', getFeeTypes);
router.post('/fee-types', createFeeType);
router.put('/fee-types/:id', updateFeeType);
router.get('/fee-pricing/history', getFeePricingHistory);
router.put('/fee-pricing', updateFeePrice);


// ============================================
// DISCOUNT TYPES
// ============================================
router.get('/discount-types', getDiscountTypes);
router.post('/discount-types', createDiscountType);
router.put('/discount-types/:id', updateDiscountType);

// ============================================
// STUDENT DISCOUNTS (awards)
// ============================================
router.get('/student-discounts', getStudentDiscounts);
router.post('/student-discounts', awardDiscount);
router.put('/student-discounts/:id/cancel', cancelStudentDiscount);

// ============================================
// STUDENT SEARCH (for discount award)
// ============================================
router.get('/students/search', searchStudentsForDiscount);

module.exports = router;