const express = require('express');
const router = express.Router();
const { startQuiz, submitAnswer, getQuizResults, getQuizHistory } = require('../controllers/quizController');

router.post('/start', startQuiz);
router.post('/answer', submitAnswer);
router.get('/results/:student_id', getQuizResults);
router.get('/history/:student_id', getQuizHistory);

module.exports = router;