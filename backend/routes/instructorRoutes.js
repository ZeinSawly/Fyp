const express = require('express');
const router = express.Router();
const { getInstructorCourses } = require('../controllers/instructorController');
const { getSectionStudents, getSectionSessions, submitAttendance, getAbsenceSummary, checkAttendanceExists } = require('../controllers/attendanceController');
const { getComponentsForInstructor, getStudentsWithGrades, submitGrades} = require('../controllers/gradeController');
const { 
    previewFinalization, 
    finalizeGrades 
  } = require('../controllers/finalizationController');

router.get('/:instructor_id/courses', getInstructorCourses);

router.get('/attendance/students', getSectionStudents);
router.get('/attendance/sessions', getSectionSessions);
router.post('/attendance/submit', submitAttendance);
router.get('/attendance/summary/:section_id', getAbsenceSummary);
router.get('/attendance/check', checkAttendanceExists);

router.get('/grades/components/:course_id', getComponentsForInstructor);
router.get('/grades/students', getStudentsWithGrades);
router.post('/grades/submit', submitGrades);

router.get('/grades/finalize/preview/:section_id', previewFinalization);
router.post('/grades/finalize/:section_id', finalizeGrades);

module.exports = router;