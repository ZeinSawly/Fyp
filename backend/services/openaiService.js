const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model we'll use throughout. Cheaper than GPT-4, fast, and capable.
const MODEL = 'gpt-4o-mini';

// ============================================================
// Generate quiz questions for a given domain + language
// ============================================================
const generateQuizQuestions = async (domain, language, count = 15) => {
  const systemPrompt = `You are a senior technical interviewer at a top-tier tech company creating a RIGOROUS skills assessment for a computer science student. You must generate ${count} questions that genuinely discriminate between students with real practical experience and those who only memorized textbook concepts.

═══════════════════════════════════════════════════════════════
CORE PHILOSOPHY: Test SKILL, not memorization
═══════════════════════════════════════════════════════════════
A student who has only watched tutorials should struggle.
A student who has built real projects should succeed.

DO NOT generate questions that:
- Test trivia (e.g., "what year was X released", "what's the syntax for X")
- Test memorization of API names or library functions
- Have obvious answers from reading the question
- Rely on esoteric gotchas (e.g., "[] + [] === ''")
- Could be answered correctly by guessing

DO generate questions that test:
- Reading and reasoning about real code
- Finding subtle bugs and race conditions
- Understanding WHY things work the way they do
- Applying concepts to realistic scenarios
- Comparing tradeoffs between approaches
- Predicting runtime behavior in edge cases

═══════════════════════════════════════════════════════════════
QUESTION STYLE DISTRIBUTION (vary across the set):
═══════════════════════════════════════════════════════════════
- ~30% CODE-READING: Show meaningful code (5-20 lines). Ask what it outputs, what bug exists, or what edge case breaks it.
- ~25% DEBUGGING: Show buggy or suboptimal code. Ask which fix is correct, or what's wrong.
- ~20% TRADEOFF: Show two or three approaches. Ask which is better and why.
- ~15% SCENARIO: Describe a real-world situation. Ask which technical decision is best.
- ~10% DEEP CONCEPTUAL: Test understanding of WHY something works, not just THAT it works.

═══════════════════════════════════════════════════════════════
DIFFICULTY BREAKDOWN — ALL MUST BE NON-TRIVIAL:
═══════════════════════════════════════════════════════════════
- EASY (~${Math.floor(count * 0.3)} questions): Solid junior-developer level. Tests fundamentals applied to real code.
- MEDIUM (~${Math.floor(count * 0.4)} questions): Solid mid-level. Multi-step reasoning, subtle bugs, idiomatic patterns.
- HARD (~${Math.ceil(count * 0.3)} questions): Senior level. Race conditions, edge cases, performance implications.

═══════════════════════════════════════════════════════════════
MCQ DISTRACTORS (THE WRONG OPTIONS):
═══════════════════════════════════════════════════════════════
- All 4 options should look reasonable at first glance
- Wrong options should reflect common misconceptions, not gibberish
- Avoid making the right answer obviously longer/shorter/more technical

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT — RETURN ONLY VALID JSON, NO PROSE, NO MARKDOWN:
═══════════════════════════════════════════════════════════════
{
  "questions": [
    {
      "index": 0,
      "difficulty": "easy" | "medium" | "hard",
      "style": "code-reading" | "debugging" | "tradeoff" | "scenario" | "conceptual",
      "type": "mcq",
      "question": "Full question text. Include code blocks with \\n for newlines. NO markdown fences.",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correct_answer": "Exact text of the correct option (must match one of the options verbatim)",
      "topic": "short-topic-tag",
      "explanation_for_correct": "1-2 sentences explaining WHY this is the correct answer."
    }
  ]
}

Generate exactly ${count} questions.`;

  const userPrompt = `Generate ${count} skills assessment questions for:
Field: ${domain}
Language: ${language}

Return only the JSON.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  let raw = response.choices[0].message.content.trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error('OpenAI returned invalid JSON: ' + raw.slice(0, 200));
  }

  let questions;
  if (Array.isArray(parsed)) {
    questions = parsed;
  } else if (parsed.questions && Array.isArray(parsed.questions)) {
    questions = parsed.questions;
  } else {
    const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
    if (arrayKey) {
      questions = parsed[arrayKey];
    } else {
      throw new Error('OpenAI response did not contain a question array');
    }
  }

  if (questions.length < count) {
    throw new Error(`Expected ${count} questions, got ${questions.length}`);
  }

  return questions.slice(0, count).map((q, i) => ({
    index: i,
    difficulty: q.difficulty || 'medium',
    style: q.style || null,
    type: q.type || 'mcq',
    question: q.question,
    options: q.options || [],
    correct_answer: q.correct_answer,
    topic: q.topic || null,
    explanation_for_correct: q.explanation_for_correct || null,
  }));
};

// ============================================================
// Evaluate the quality of a student's explanation
// ============================================================
const evaluateReasoning = async ({
  question,
  options,
  correct_answer,
  correct_explanation,
  student_answer,
  student_explanation,
  is_correct,
  domain,
  language,
}) => {
  const systemPrompt = `You are an expert evaluator grading a student's REASONING on a technical skills test in ${domain} (${language}).

Your job: evaluate whether the student's explanation contains correct TECHNICAL CONTENT that demonstrates understanding of the answer.

═══════════════════════════════════════════════════════════════
HOW TO GRADE — FOCUS ON TECHNICAL CONTENT, NOT WORDING:
═══════════════════════════════════════════════════════════════

Step 1: Look at the student's explanation. Identify the TECHNICAL CLAIMS they're making.
Step 2: Compare those claims to the reference explanation.
Step 3: Score based on technical correctness, NOT based on confidence words or phrasing.

═══════════════════════════════════════════════════════════════
SCORING SCALE (0.0 to 1.0):
═══════════════════════════════════════════════════════════════
1.0 = Explanation contains the key technical mechanism. Aligns with the reference explanation. Demonstrates real understanding.

0.8 = Mostly accurate explanation. Mentions the right concept(s) but with minor gaps or imprecision.

0.6 = Partially correct. Right general idea but missing key details, OR mentions the correct concept among some incorrect ideas.

0.4 = Weak. Touches on the topic but the reasoning is mostly wrong or very vague.

0.2 = Very weak. Explanation contradicts the answer, OR shows no real technical content (just confidence words).

0.0 = No explanation, gibberish, completely off-topic, or explicit admission of guessing with no supporting reasoning.

═══════════════════════════════════════════════════════════════
EXAMPLES:
═══════════════════════════════════════════════════════════════

Reference: "The variable 'i' is captured by reference, so by the time setTimeout fires, the loop has finished and i = 5."

Student says: "i is captured by reference and the loop finishes before setTimeout runs"
→ Score: 1.0 (matches reference)

Student says: "It's because of variable scoping in the loop"
→ Score: 0.6 (right concept but vague)

Student says: "I traced through the code and realized the for loop captures i by reference, so all setTimeouts see the final value of i which is 5"
→ Score: 1.0 (DON'T penalize the meta-language "I traced through" — focus on the TECHNICAL content that follows)

Student says: "Because async stuff happens at the end"
→ Score: 0.4 (right intuition, technically vague)

Student says: "I just know it"
→ Score: 0.0 (no technical content at all)

Student says: "It seemed right because it's the most common option"
→ Score: 0.0 (admits to guessing, no technical reasoning)

Student says: (empty)
→ Score: 0.0

═══════════════════════════════════════════════════════════════
KEY PRINCIPLE:
═══════════════════════════════════════════════════════════════

DO NOT treat phrases like "I traced through" / "I think" / "I worked it out" as red flags. These are normal ways students describe their thinking. What matters is whether the TECHNICAL EXPLANATION that follows is correct.

ONLY score very low (0.0-0.2) when:
- The student gives NO technical content (just "I guessed", "I know it", or empty)
- OR the student's explanation directly contradicts the chosen answer
- OR the student explicitly admits they don't know

If a student gives ANY correct technical reasoning, they get AT LEAST 0.4.
If a student's explanation correctly identifies the mechanism, they get AT LEAST 0.8.

═══════════════════════════════════════════════════════════════
WRONG ANSWER + REASONING:
═══════════════════════════════════════════════════════════════

If the student picked the wrong MCQ but their explanation shows partial understanding of the underlying concept (even if applied wrong), award up to 0.5.

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT — RETURN ONLY VALID JSON:
═══════════════════════════════════════════════════════════════
{
  "score": 0.85,
  "feedback": "Brief 1-sentence reason for the score, focused on the TECHNICAL content (not the phrasing)."
}`;

  const userPrompt = `Question:
${question}

Options:
${options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}

Correct answer: ${correct_answer}
Reference explanation (what a perfect answer would say): ${correct_explanation || 'Not provided'}

═══════════════════════════════════════
STUDENT SUBMISSION:
═══════════════════════════════════════
Student picked: ${student_answer}
MCQ result: ${is_correct ? 'CORRECT' : 'WRONG'}
Student's explanation: "${student_explanation || '(no explanation provided)'}"

Apply the scoring rubric. Focus on TECHNICAL CONTENT, not phrasing. Return only the JSON.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content.trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { score: 0, feedback: 'Could not evaluate explanation.' };
  }

  return {
    score: typeof parsed.score === 'number' ? Math.max(0, Math.min(1, parsed.score)) : 0,
    feedback: parsed.feedback || '',
  };
};

module.exports = {
  generateQuizQuestions,
  evaluateReasoning,
};