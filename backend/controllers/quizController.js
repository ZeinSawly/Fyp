const db = require('../config/db');
const { generateQuizQuestions, evaluateReasoning } = require('../services/openaiService');

// ============================================================
// Helper: Compute proficiency level from percentage score
// ============================================================
const computeProficiencyLevel = (percent) => {
  if (percent >= 85) return 'Expert';
  if (percent >= 70) return 'Advanced';
  if (percent >= 50) return 'Intermediate';
  if (percent >= 30) return 'Novice';
  return 'Beginner';
};

// ============================================================
// GET /api/quiz/domains
// Returns all CS skill domains with their allowed languages
// ============================================================
const getDomains = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT id, major_id, code, name, description, allowed_languages, display_order
       FROM skill_domains
       WHERE active = 1
       ORDER BY display_order ASC, name ASC`
    );

    // Parse the JSON field
    const domains = rows.map(d => ({
      ...d,
      allowed_languages: typeof d.allowed_languages === 'string' 
        ? JSON.parse(d.allowed_languages) 
        : d.allowed_languages,
    }));

    return res.status(200).json({
      success: true,
      data: domains,
    });
  } catch (error) {
    console.error('Get domains error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ============================================================
// POST /api/quiz/start
// Creates a new quiz session, generates questions via OpenAI, saves them
// Body: { student_id, domain_code, language, question_count? }
// ============================================================
const startQuiz = async (req, res) => {
  const { student_id, domain_code, language, question_count = 15 } = req.body;

  if (!student_id || !domain_code || !language) {
    return res.status(400).json({
      success: false,
      message: 'student_id, domain_code, and language are required',
    });
  }

  try {
    // 1. Verify the domain exists and the language is allowed
    const [domainRows] = await db.promise().query(
      `SELECT id, name, allowed_languages 
       FROM skill_domains 
       WHERE code = ? AND active = 1`,
      [domain_code]
    );

    if (domainRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found',
      });
    }

    const domain = domainRows[0];
    const allowedLanguages = typeof domain.allowed_languages === 'string'
      ? JSON.parse(domain.allowed_languages)
      : domain.allowed_languages;

    if (!allowedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: `Language "${language}" is not allowed for domain "${domain.name}". Allowed: ${allowedLanguages.join(', ')}`,
      });
    }

    // 2. Check if the student already has an in-progress session for this domain+language
    //    If yes, return that one instead of creating a new one (resume)
    const [existingSessions] = await db.promise().query(
      `SELECT id, questions_json, started_at
       FROM quiz_sessions
       WHERE student_id = ? AND domain_code = ? AND language = ? AND status = 'in_progress'
       ORDER BY started_at DESC LIMIT 1`,
      [student_id, domain_code, language]
    );

    if (existingSessions.length > 0) {
      const existing = existingSessions[0];
      const questions = typeof existing.questions_json === 'string'
        ? JSON.parse(existing.questions_json)
        : existing.questions_json;

      return res.status(200).json({
        success: true,
        message: 'Resuming existing in-progress quiz',
        data: {
          session_id: existing.id,
          domain: domain.name,
          language,
          question_count: questions.length,
          // Strip correct_answer and explanation_for_correct before sending to client!
          questions: questions.map(q => ({
            index: q.index,
            difficulty: q.difficulty,
            style: q.style,
            type: q.type,
            question: q.question,
            options: q.options,
            topic: q.topic,
          })),
          resumed: true,
        },
      });
    }

    // 3. Generate fresh questions via OpenAI
    console.log(`Generating ${question_count} questions for ${domain.name} / ${language}...`);
    const questions = await generateQuizQuestions(domain.name, language, question_count);

    // 4. Create the quiz session in DB
    const [insertResult] = await db.promise().query(
      `INSERT INTO quiz_sessions 
        (student_id, domain_code, language, question_count, questions_json, status)
       VALUES (?, ?, ?, ?, ?, 'in_progress')`,
      [student_id, domain_code, language, questions.length, JSON.stringify(questions)]
    );

    const session_id = insertResult.insertId;

    // 5. Return questions to the client (WITHOUT the correct answers!)
    return res.status(201).json({
      success: true,
      message: 'Quiz session created',
      data: {
        session_id,
        domain: domain.name,
        language,
        question_count: questions.length,
        questions: questions.map(q => ({
          index: q.index,
          difficulty: q.difficulty,
          style: q.style,
          type: q.type,
          question: q.question,
          options: q.options,
          topic: q.topic,
          // NOTE: correct_answer and explanation_for_correct are intentionally OMITTED
        })),
        resumed: false,
      },
    });

  } catch (error) {
    console.error('Start quiz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start quiz: ' + error.message,
    });
  }
};

// ============================================================
// POST /api/quiz/submit-answer
// Submits a single answer + explanation, evaluates it
// Body: { session_id, question_index, student_answer, student_explanation }
// ============================================================
const submitAnswer = async (req, res) => {
  const { session_id, question_index, student_answer, student_explanation } = req.body;

  if (!session_id || question_index === undefined || !student_answer) {
    return res.status(400).json({
      success: false,
      message: 'session_id, question_index, and student_answer are required',
    });
  }

  try {
    // 1. Get the session and its questions
    const [sessionRows] = await db.promise().query(
      `SELECT id, student_id, domain_code, language, questions_json, status
       FROM quiz_sessions WHERE id = ?`,
      [session_id]
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const session = sessionRows[0];

    if (session.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'This quiz session is already completed or abandoned',
      });
    }

    const questions = typeof session.questions_json === 'string'
      ? JSON.parse(session.questions_json)
      : session.questions_json;

    const question = questions[question_index];
    if (!question) {
      return res.status(400).json({
        success: false,
        message: `Invalid question_index ${question_index}`,
      });
    }

    // 2. Check if this question was already answered (prevent re-submission)
    const [existingResponse] = await db.promise().query(
      `SELECT id FROM quiz_responses WHERE session_id = ? AND question_index = ?`,
      [session_id, question_index]
    );

    if (existingResponse.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already answered this question',
      });
    }

    // 3. Check MCQ correctness
    const is_correct = student_answer === question.correct_answer ? 1 : 0;

    // 4. Evaluate the explanation with GPT
    const reasoningEval = await evaluateReasoning({
      question: question.question,
      options: question.options,
      correct_answer: question.correct_answer,
      correct_explanation: question.explanation_for_correct,
      student_answer,
      student_explanation,
      is_correct: !!is_correct,
      domain: session.domain_code,
      language: session.language,
    });

    // 5. Compute total score for this question
    //    Max = 2.0 (1 for correct MCQ + 1 for perfect reasoning)
    const reasoning_score = reasoningEval.score;
    const total_score = (is_correct ? 1 : 0) + reasoning_score;

    // 6. Save the response
    await db.promise().query(
      `INSERT INTO quiz_responses
        (session_id, question_index, question_text, question_type, difficulty,
         correct_answer, student_answer, student_explanation,
         is_correct, reasoning_score, reasoning_feedback, total_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session_id,
        question_index,
        question.question,
        question.type || 'mcq',
        question.difficulty || 'medium',
        question.correct_answer,
        student_answer,
        student_explanation || null,
        is_correct,
        reasoning_score,
        reasoningEval.feedback,
        total_score,
      ]
    );

    return res.status(200).json({
      success: true,
      data: {
        question_index,
        is_correct: !!is_correct,
        reasoning_score,
        reasoning_feedback: reasoningEval.feedback,
        total_score,
        max_score: 2.0,
        // Show correct answer & explanation NOW so student learns from it
        correct_answer: question.correct_answer,
        correct_explanation: question.explanation_for_correct,
      },
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit answer: ' + error.message,
    });
  }
};

// ============================================================
// POST /api/quiz/complete
// Marks a session as completed, computes final aggregate scores
// Body: { session_id }
// ============================================================
const completeQuiz = async (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      message: 'session_id is required',
    });
  }

  try {
    // 1. Verify session exists and is in_progress
    const [sessionRows] = await db.promise().query(
      `SELECT id, student_id, question_count, status
       FROM quiz_sessions WHERE id = ?`,
      [session_id]
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const session = sessionRows[0];

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Session already completed',
      });
    }

    // 2. Compute aggregate scores from responses
    const [aggResult] = await db.promise().query(
      `SELECT 
          COUNT(*) AS responses_count,
          SUM(is_correct) AS correct_count,
          AVG(reasoning_score) AS reasoning_avg,
          SUM(total_score) AS total_score
       FROM quiz_responses
       WHERE session_id = ?`,
      [session_id]
    );

    const agg = aggResult[0];
    const responsesCount = Number(agg.responses_count || 0);

    if (responsesCount < session.question_count) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete: only ${responsesCount}/${session.question_count} questions answered`,
      });
    }

    // Max possible total = 2.0 × question_count
    const maxTotal = 2.0 * session.question_count;
    const totalScore = Number(agg.total_score || 0);
    const scorePercent = maxTotal > 0 ? (totalScore / maxTotal) * 100 : 0;
    const correctCount = Number(agg.correct_count || 0);
    const reasoningAvg = Number(agg.reasoning_avg || 0);
    const proficiencyLevel = computeProficiencyLevel(scorePercent);

    // 3. Update the session
    await db.promise().query(
      `UPDATE quiz_sessions SET
          status = 'completed',
          correct_count = ?,
          reasoning_avg = ?,
          total_score = ?,
          score_percent = ?,
          proficiency_level = ?,
          completed_at = NOW()
       WHERE id = ?`,
      [
        correctCount,
        reasoningAvg,
        totalScore,
        scorePercent,
        proficiencyLevel,
        session_id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Quiz completed',
      data: {
        session_id,
        question_count: session.question_count,
        correct_count: correctCount,
        reasoning_avg: Number(reasoningAvg.toFixed(2)),
        total_score: Number(totalScore.toFixed(2)),
        max_total: maxTotal,
        score_percent: Number(scorePercent.toFixed(2)),
        proficiency_level: proficiencyLevel,
      },
    });

  } catch (error) {
    console.error('Complete quiz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete quiz: ' + error.message,
    });
  }
};

// ============================================================
// GET /api/quiz/sessions/:student_id
// List all of a student's past quiz sessions
// ============================================================
const getStudentSessions = async (req, res) => {
  const { student_id } = req.params;

  if (!student_id) {
    return res.status(400).json({
      success: false,
      message: 'student_id is required',
    });
  }

  try {
    const [sessions] = await db.promise().query(
      `SELECT 
          qs.id,
          qs.domain_code,
          sd.name AS domain_name,
          qs.language,
          qs.question_count,
          qs.status,
          qs.correct_count,
          qs.reasoning_avg,
          qs.total_score,
          qs.score_percent,
          qs.proficiency_level,
          qs.started_at,
          qs.completed_at
       FROM quiz_sessions qs
       LEFT JOIN skill_domains sd ON qs.domain_code = sd.code
       WHERE qs.student_id = ?
       ORDER BY qs.started_at DESC`,
      [student_id]
    );

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ============================================================
// GET /api/quiz/session/:session_id
// Get one session's full details (for review)
// ============================================================
const getSessionDetails = async (req, res) => {
  const { session_id } = req.params;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      message: 'session_id is required',
    });
  }

  try {
    // Get session
    const [sessionRows] = await db.promise().query(
      `SELECT 
          qs.id,
          qs.student_id,
          qs.domain_code,
          sd.name AS domain_name,
          qs.language,
          qs.question_count,
          qs.status,
          qs.correct_count,
          qs.reasoning_avg,
          qs.total_score,
          qs.score_percent,
          qs.proficiency_level,
          qs.started_at,
          qs.completed_at
       FROM quiz_sessions qs
       LEFT JOIN skill_domains sd ON qs.domain_code = sd.code
       WHERE qs.id = ?`,
      [session_id]
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Get responses
    const [responses] = await db.promise().query(
      `SELECT 
          id, question_index, question_text, question_type, difficulty,
          correct_answer, student_answer, student_explanation,
          is_correct, reasoning_score, reasoning_feedback, total_score,
          answered_at
       FROM quiz_responses
       WHERE session_id = ?
       ORDER BY question_index ASC`,
      [session_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        session: sessionRows[0],
        responses,
      },
    });
  } catch (error) {
    console.error('Get session details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getDomains,
  startQuiz,
  submitAnswer,
  completeQuiz,
  getStudentSessions,
  getSessionDetails,
};