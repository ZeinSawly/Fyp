const db = require('../config/db');
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOTAL_QUESTIONS = 10;

// ─── HELPER: Check if field is technical ───
const isTechField = (field) => {
  const techFields = [
    'computer science', 'software engineering', 'information technology',
    'cybersecurity', 'data science', 'networking', 'artificial intelligence',
    'web development', 'mobile development', 'cloud computing'
  ];
  return techFields.some(f => field.toLowerCase().includes(f));
};

// ─── HELPER: Get question types based on field ───
const getQuestionTypes = (field) => {
  if (isTechField(field)) {
    return `Generate exactly 4 questions, one of each type: mcq, output_prediction, spot_the_bug, scenario.
- mcq: theoretical knowledge question with 4 options (A/B/C/D)
- output_prediction: show a short code snippet, ask what it prints, 4 options (A/B/C/D)
- spot_the_bug: show buggy code with 4 lines labeled A/B/C/D, one line has the bug
- scenario: a real-world situation question with 4 options (A/B/C/D)`;
  } else {
    return `Generate exactly 4 questions of these types: 2 mcq, 1 case_study, 1 scenario.
- mcq: theoretical knowledge question relevant to ${field} with 4 options (A/B/C/D)
- case_study: a short real-world situation specific to ${field}, ask what the best approach is, 4 options (A/B/C/D)
- scenario: a professional decision-making question relevant to ${field}, 4 options (A/B/C/D)`;
  }
};

// ─── HELPER: Get difficulty from theta ───
const getDifficulty = (theta) => {
  if (theta < -1) return 1;
  if (theta > 1) return 3;
  return 2;
};

// ─── HELPER: Compute final score from option + explanation ───
const computeFinalScore = (optionCorrect, explanationScore) => {
  if (optionCorrect && explanationScore >= 7) return 10;
  if (optionCorrect && explanationScore >= 4) return 7;
  if (optionCorrect && explanationScore < 4)  return 5;
  if (!optionCorrect && explanationScore >= 7) return 4;
  if (!optionCorrect && explanationScore >= 4) return 2;
  return 0;
};

// ─── HELPER: Normalize theta (-3 to +3) → skill score (0-100) ───
const getFinalSkillScore = (theta) => {
  return Math.round(((parseFloat(theta) + 3) / 6) * 100);
};

// ─── GENERATE QUESTIONS via OpenAI ───
const generateQuestions = async (field, difficulty) => {
  const difficultyLabel = difficulty === 1 ? 'beginner' : difficulty === 2 ? 'intermediate' : 'advanced';
  const questionTypes = getQuestionTypes(field);

  const prompt = `
You are an expert quiz creator for a student career assessment system.

Generate exactly 4 questions for a ${difficultyLabel} student interested in ${field}.
${questionTypes}

Important rules:
- All questions must be directly relevant to ${field}
- Questions must match the ${difficultyLabel} level
- Every question must have exactly 4 options labeled A, B, C, D
- The answer must be one of: A, B, C, or D
- The explanation must clearly explain why the answer is correct

Respond ONLY with a valid JSON array. No markdown, no extra text, no backticks:
[
  {
    "type": "mcq",
    "difficulty": ${difficulty},
    "question": "...",
    "code": null,
    "code_lines": null,
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "answer": "A",
    "explanation": "Brief explanation of why this answer is correct"
  },
  {
    "type": "output_prediction",
    "difficulty": ${difficulty},
    "question": "What does this code output?",
    "code": "x = 5\nprint(x * 2)",
    "code_lines": null,
    "options": { "A": "5", "B": "10", "C": "25", "D": "Error" },
    "answer": "B",
    "explanation": "..."
  },
  {
    "type": "spot_the_bug",
    "difficulty": ${difficulty},
    "question": "Which line contains the bug?",
    "code": null,
    "code_lines": { "A": "def add(a, b):", "B": "    result = a - b", "C": "    return result", "D": "print(add(2, 3))" },
    "options": { "A": "Line A", "B": "Line B", "C": "Line C", "D": "Line D" },
    "answer": "B",
    "explanation": "..."
  },
  {
    "type": "scenario",
    "difficulty": ${difficulty},
    "question": "...",
    "code": null,
    "code_lines": null,
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "answer": "D",
    "explanation": "..."
  }
]`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 2000,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = response.choices[0].message.content.trim();
  const cleaned = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse OpenAI response:', cleaned);
    throw new Error('Invalid JSON from OpenAI');
  }
};

// ─── HELPER: Get or generate question from cache ───
const getQuestion = async (field, difficulty, usedIds) => {
  const usedPlaceholders = usedIds.length > 0
    ? `AND id NOT IN (${usedIds.map(() => '?').join(',')})` : '';

  const queryParams = usedIds.length > 0
    ? [field, difficulty, ...usedIds]
    : [field, difficulty];

  const [cached] = await db.promise().query(
    `SELECT * FROM quiz_questions
     WHERE field = ? AND difficulty = ?
     ${usedPlaceholders}
     ORDER BY used_count ASC, RAND()
     LIMIT 1`,
    queryParams
  );

  if (cached.length > 0) {
    await db.promise().query(
      `UPDATE quiz_questions SET used_count = used_count + 1 WHERE id = ?`,
      [cached[0].id]
    );
    return cached[0];
  }

  // Cache miss — generate new batch from OpenAI
  console.log(`Cache miss for field=${field}, difficulty=${difficulty}. Generating from OpenAI...`);
  const questions = await generateQuestions(field, difficulty);

  // Save all generated questions to cache
  for (const q of questions) {
    await db.promise().query(
      `INSERT INTO quiz_questions
       (field, difficulty, type, question, code, code_lines, options, answer, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        field,
        difficulty,
        q.type,
        q.question,
        q.code || null,
        q.code_lines ? JSON.stringify(q.code_lines) : null,
        JSON.stringify(q.options),
        q.answer,
        q.explanation || null
      ]
    );
  }

  // Return the first unused question
  const [newQ] = await db.promise().query(
    `SELECT * FROM quiz_questions
     WHERE field = ? AND difficulty = ?
     ${usedPlaceholders}
     ORDER BY created_at DESC LIMIT 1`,
    queryParams
  );

  if (!newQ || newQ.length === 0) {
    throw new Error('Failed to retrieve generated question');
  }

  await db.promise().query(
    `UPDATE quiz_questions SET used_count = used_count + 1 WHERE id = ?`,
    [newQ[0].id]
  );

  return newQ[0];
};

// ─── EVALUATE EXPLANATION via OpenAI ───
const evaluateExplanation = async (question, chosenOption, explanation, correctAnswer) => {
  const prompt = `
You are evaluating a student's explanation for a quiz answer in a career assessment system.

Question: ${question}
Correct answer: ${correctAnswer}
Student chose: ${chosenOption}
Student explanation: "${explanation}"

Evaluate ONLY the quality of the explanation — does it show the student genuinely understands WHY the answer is what it is?
Ignore whether they chose the right option. Focus purely on the reasoning quality.

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "explanationScore": <integer 0-10>,
  "feedback": "<one concise sentence of constructive feedback>"
}

Scoring guide:
- 9-10: Clear, accurate reasoning demonstrating solid understanding
- 7-8: Good reasoning with minor gaps
- 5-6: Partial understanding, some correct reasoning
- 3-4: Vague or partially relevant explanation
- 0-2: No explanation, irrelevant, or completely wrong reasoning`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 150,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = response.choices[0].message.content.trim();
  const cleaned = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse explanation evaluation:', cleaned);
    return { explanationScore: 5, feedback: 'Could not evaluate explanation.' };
  }
};

// ═══════════════════════════════════════════════
// ENDPOINT 1: Start Quiz Session
// POST /api/quiz/start
// Body: { student_id, field_of_interest }
// ═══════════════════════════════════════════════
const startQuiz = async (req, res) => {
  const { student_id, field_of_interest } = req.body;

  if (!student_id || !field_of_interest) {
    return res.status(400).json({
      success: false,
      message: 'student_id and field_of_interest are required'
    });
  }

  try {
    // Cancel any existing active session for this student
    await db.promise().query(
      `UPDATE quiz_sessions SET status = 'completed'
       WHERE student_id = ? AND status = 'active'`,
      [student_id]
    );

    // Create new session
    const [result] = await db.promise().query(
      `INSERT INTO quiz_sessions (student_id, field_of_interest, theta, questions_answered, status)
       VALUES (?, ?, 0, 0, 'active')`,
      [student_id, field_of_interest]
    );

    const sessionId = result.insertId;

    // Get first question at medium difficulty (theta = 0 → difficulty = 2)
    const question = await getQuestion(field_of_interest, 2, []);

    return res.status(200).json({
      success: true,
      session_id: sessionId,
      question_number: 1,
      total_questions: TOTAL_QUESTIONS,
      question: {
        id: question.id,
        type: question.type,
        difficulty: question.difficulty,
        question: question.question,
        code: question.code || null,
        code_lines: typeof question.code_lines === 'string'
          ? JSON.parse(question.code_lines)
          : question.code_lines || null,
        options: typeof question.options === 'string'
          ? JSON.parse(question.options)
          : question.options,
      }
    });

  } catch (error) {
    console.error('Start quiz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start quiz',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════
// ENDPOINT 2: Submit Answer
// POST /api/quiz/answer
// Body: { session_id, question_id, selected_option, explanation }
// ═══════════════════════════════════════════════
const submitAnswer = async (req, res) => {
  const { session_id, question_id, selected_option, explanation } = req.body;

  if (!session_id || !question_id || !selected_option || !explanation) {
    return res.status(400).json({
      success: false,
      message: 'session_id, question_id, selected_option and explanation are required'
    });
  }

  try {
    // Get active session
    const [sessions] = await db.promise().query(
      `SELECT * FROM quiz_sessions WHERE id = ? AND status = 'active'`,
      [session_id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active quiz session found'
      });
    }

    const session = sessions[0];

    // Get question
    const [questions] = await db.promise().query(
      `SELECT * FROM quiz_questions WHERE id = ?`,
      [question_id]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const question = questions[0];
    const optionCorrect = selected_option.toUpperCase() === question.answer.toUpperCase();

    // Evaluate explanation via OpenAI
    const { explanationScore, feedback } = await evaluateExplanation(
      question.question,
      selected_option,
      explanation,
      question.answer
    );

    // Compute final score
    const finalScore = computeFinalScore(optionCorrect, explanationScore);

    // Update theta using normalized score
    const normalizedScore = (finalScore / 10) * 2 - 1; // maps 0-10 → -1 to +1
    const delta = normalizedScore * 0.3 * question.difficulty;
    const newTheta = Math.max(-3, Math.min(3, parseFloat(session.theta) + delta));
    const newQuestionsAnswered = session.questions_answered + 1;
    const isDone = newQuestionsAnswered >= TOTAL_QUESTIONS;

    // Save response
    await db.promise().query(
      `INSERT INTO quiz_responses
       (session_id, question_id, selected_option, student_explanation,
        option_correct, explanation_score, final_score, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session_id, question_id, selected_option, explanation,
        optionCorrect, explanationScore, finalScore, question.difficulty
      ]
    );

    // Get all used question IDs for this session
    const [usedRows] = await db.promise().query(
      `SELECT question_id FROM quiz_responses WHERE session_id = ?`,
      [session_id]
    );
    const usedIds = usedRows.map(r => r.question_id);

    let nextQuestion = null;
    let skillScore = null;

    if (isDone) {
      // Quiz complete
      skillScore = getFinalSkillScore(newTheta);

      await db.promise().query(
        `UPDATE quiz_sessions
         SET theta = ?, questions_answered = ?,
             status = 'completed', skill_score = ?, completed_at = NOW()
         WHERE id = ?`,
        [newTheta, newQuestionsAnswered, skillScore, session_id]
      );

    } else {
      // Update session and get next question
      await db.promise().query(
        `UPDATE quiz_sessions
         SET theta = ?, questions_answered = ?
         WHERE id = ?`,
        [newTheta, newQuestionsAnswered, session_id]
      );

      const nextDifficulty = getDifficulty(newTheta);
      const nextQ = await getQuestion(session.field_of_interest, nextDifficulty, usedIds);

      nextQuestion = {
        id: nextQ.id,
        type: nextQ.type,
        difficulty: nextQ.difficulty,
        question: nextQ.question,
        code: nextQ.code || null,
        code_lines: typeof nextQ.code_lines === 'string'
          ? JSON.parse(nextQ.code_lines)
          : nextQ.code_lines || null,
        options: typeof nextQ.options === 'string'
          ? JSON.parse(nextQ.options)
          : nextQ.options,
      };
    }

    return res.status(200).json({
      success: true,
      optionCorrect,
      correctAnswer: question.answer,
      questionExplanation: question.explanation,
      explanationScore,
      finalScore,
      feedback,
      questionsAnswered: newQuestionsAnswered,
      totalQuestions: TOTAL_QUESTIONS,
      currentTheta: newTheta,
      done: isDone,
      skillScore,
      nextQuestion,
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process answer',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════
// ENDPOINT 3: Get Quiz Results
// GET /api/quiz/results/:student_id
// ═══════════════════════════════════════════════
const getQuizResults = async (req, res) => {
  const { student_id } = req.params;

  try {
    const [sessions] = await db.promise().query(
      `SELECT * FROM quiz_sessions
       WHERE student_id = ? AND status = 'completed'
       ORDER BY completed_at DESC LIMIT 1`,
      [student_id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No completed quiz session found'
      });
    }

    const session = sessions[0];

    const [responses] = await db.promise().query(
      `SELECT
        qr.id,
        qr.selected_option,
        qr.student_explanation,
        qr.option_correct,
        qr.explanation_score,
        qr.final_score,
        qr.difficulty,
        qq.type,
        qq.question,
        qq.answer AS correct_answer,
        qq.explanation AS question_explanation
       FROM quiz_responses qr
       JOIN quiz_questions qq ON qr.question_id = qq.id
       WHERE qr.session_id = ?
       ORDER BY qr.created_at ASC`,
      [session.id]
    );

    return res.status(200).json({
      success: true,
      session: {
        id: session.id,
        field_of_interest: session.field_of_interest,
        skill_score: session.skill_score,
        theta: session.theta,
        questions_answered: session.questions_answered,
        started_at: session.started_at,
        completed_at: session.completed_at,
      },
      responses
    });

  } catch (error) {
    console.error('Get quiz results error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get quiz results',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════
// ENDPOINT 4: Get All Quiz Sessions for Student
// GET /api/quiz/history/:student_id
// ═══════════════════════════════════════════════
const getQuizHistory = async (req, res) => {
  const { student_id } = req.params;

  try {
    const [sessions] = await db.promise().query(
      `SELECT id, field_of_interest, skill_score, theta,
              questions_answered, status, started_at, completed_at
       FROM quiz_sessions
       WHERE student_id = ?
       ORDER BY started_at DESC`,
      [student_id]
    );

    return res.status(200).json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('Get quiz history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get quiz history',
      error: error.message
    });
  }
};

module.exports = { startQuiz, submitAnswer, getQuizResults, getQuizHistory };