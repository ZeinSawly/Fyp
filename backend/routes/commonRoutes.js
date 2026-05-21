const express = require('express');
const router = express.Router();

const { getCurrentSemester, getAllSemesters } = require('../controllers/commonController');

router.get('/current-semester', getCurrentSemester);
router.get('/semesters', getAllSemesters);

module.exports = router;