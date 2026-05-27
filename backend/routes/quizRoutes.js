const express = require('express');
const router = express.Router();

const {
  getDomains,
  startQuiz,
  submitAnswer,
  completeQuiz,
  getStudentSessions,
  getSessionDetails,
} = require('../controllers/quizController');

// Routes
router.get('/domains', getDomains);
router.post('/start', startQuiz);
router.post('/submit-answer', submitAnswer);
router.post('/complete', completeQuiz);
router.get('/sessions/:student_id', getStudentSessions);
router.get('/session/:session_id', getSessionDetails);

module.exports = router;