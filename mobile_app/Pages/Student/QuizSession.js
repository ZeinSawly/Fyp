import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

const DIFFICULTY_COLORS = {
  easy: { bg: '#F0FFF4', text: '#15803D', border: '#86EFAC' },
  medium: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  hard: { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' },
};

const STYLE_LABELS = {
  'code-reading': 'Code Reading',
  'debugging': 'Debugging',
  'tradeoff': 'Tradeoff',
  'scenario': 'Scenario',
  'conceptual': 'Conceptual',
};

// Time limits per difficulty (seconds)
const TIME_LIMITS = {
  easy: 60,
  medium: 90,
  hard: 120,
};

const getTimeLimit = (difficulty) => TIME_LIMITS[difficulty] || TIME_LIMITS.medium;

// Format seconds as M:SS
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function QuizSession({ navigation, route }) {
  const { student, session } = route.params;
  const questions = session.questions || [];
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [completing, setCompleting] = useState(false);

  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);
  const timerRef = useRef(null);
  const submittingRef = useRef(false);  // prevents double-submit

  const [scoresSoFar, setScoresSoFar] = useState({
    correctCount: 0,
    totalReasoningScore: 0,
    totalScore: 0,
  });

  const scrollRef = useRef(null);
  const currentQuestion = questions[currentIndex];
  const totalTimeForQuestion = currentQuestion ? getTimeLimit(currentQuestion.difficulty) : 90;
  const progressPct = ((currentIndex + (feedback ? 1 : 0)) / totalQuestions) * 100;

  // Start/reset timer when question changes
  useEffect(() => {
    if (!currentQuestion || feedback) {
      // No timer when showing feedback
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // New question — reset timer
    const limit = getTimeLimit(currentQuestion.difficulty);
    setSecondsLeft(limit);
    setTimeExpired(false);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Time's up
          clearInterval(timerRef.current);
          timerRef.current = null;
          setTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, feedback]);

  // Auto-submit when time expires
  useEffect(() => {
    if (timeExpired && !submittingRef.current && !feedback) {
      submittingRef.current = true;
      handleSubmit(true);  // pass autoSubmit flag
    }
  }, [timeExpired]);

  const handleSubmit = async (autoSubmit = false) => {
    // If manual submit, do validation
    if (!autoSubmit) {
      if (!selectedAnswer) {
        Alert.alert('Pick an answer', 'Please select one of the options first.');
        return;
      }
      if (!explanation.trim() || explanation.trim().length < 10) {
        Alert.alert(
          'Explanation required',
          'Please explain WHY you chose this answer in at least a sentence.'
        );
        return;
      }
    }

    // Stop the timer immediately on submit attempt
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/quiz/submit-answer', {
        session_id: session.session_id,
        question_index: currentQuestion.index,
        // If auto-submitted with no answer, send "(no answer)" placeholder
        student_answer: selectedAnswer || '(no answer)',
        student_explanation: explanation.trim() || (autoSubmit ? '(time expired - no explanation)' : ''),
      });

      if (res.data.success) {
        const result = res.data.data;
        setFeedback({
          ...result,
          auto_submitted: autoSubmit,
        });

        setScoresSoFar(prev => ({
          correctCount: prev.correctCount + (result.is_correct ? 1 : 0),
          totalReasoningScore: prev.totalReasoningScore + result.reasoning_score,
          totalScore: prev.totalScore + result.total_score,
        }));

        setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
      } else {
        Alert.alert('Error', res.data.message || 'Submission failed');
        submittingRef.current = false;
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || err.message || 'Submission failed'
      );
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex >= totalQuestions - 1) {
      await completeQuiz();
      return;
    }

    setCurrentIndex(currentIndex + 1);
    setSelectedAnswer(null);
    setExplanation('');
    setFeedback(null);
    submittingRef.current = false;
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
  };

  const completeQuiz = async () => {
    setCompleting(true);
    try {
      const res = await api.post('/api/quiz/complete', {
        session_id: session.session_id,
      });

      if (res.data.success) {
        navigation.replace('QuizResults', {
          student,
          result: res.data.data,
          session_id: session.session_id,
        });
      } else {
        Alert.alert('Error', res.data.message || 'Failed to complete quiz');
        setCompleting(false);
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || err.message || 'Failed to complete quiz'
      );
      setCompleting(false);
    }
  };

  const handleExitConfirm = () => {
    Alert.alert(
      'Exit quiz?',
      'Your progress will be saved and you can resume later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => navigation.reset({
            index: 1,
            routes: [
              { name: 'StudentDashboard', params: { student } },
              { name: 'QuizIntro', params: { student } },
            ],
          }),
        },
      ]
    );
  };

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text>No questions available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const difficultyStyle = DIFFICULTY_COLORS[currentQuestion.difficulty] || DIFFICULTY_COLORS.medium;

  // Timer color based on percentage remaining
  const timerPct = (secondsLeft / totalTimeForQuestion) * 100;
  let timerColor = '#10B981'; // green
  if (timerPct < 50) timerColor = '#F59E0B'; // yellow
  if (timerPct < 25) timerColor = '#EF4444'; // red
  
  // Timer label
  const isUrgent = secondsLeft <= 10 && !feedback;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header with progress + timer */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleExitConfirm} style={styles.exitBtn}>
              <Ionicons name="close" size={26} color="#475569" />
            </TouchableOpacity>
            <Text style={styles.progressText}>
              Question {currentIndex + 1} of {totalQuestions}
            </Text>
            <View style={{ width: 30 }} />
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>

          {/* Timer (only shown when answering, not during feedback) */}
          {!feedback && (
            <View style={styles.timerContainer}>
              <View style={styles.timerRow}>
                <View style={styles.timerLabelWrap}>
                  <Ionicons 
                    name={isUrgent ? 'alarm' : 'time-outline'} 
                    size={16} 
                    color={timerColor} 
                  />
                  <Text style={[styles.timerLabel, { color: timerColor }]}>
                    {isUrgent ? 'Hurry!' : 'Time remaining'}
                  </Text>
                </View>
                <Text style={[styles.timerValue, { color: timerColor }]}>
                  {formatTime(secondsLeft)}
                </Text>
              </View>
              <View style={styles.timerBarBg}>
                <View
                  style={[
                    styles.timerBarFill,
                    {
                      width: `${timerPct}%`,
                      backgroundColor: timerColor,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question card */}
          <View style={styles.questionCard}>
            <View style={styles.chipRow}>
              <View style={[
                styles.chip,
                { backgroundColor: difficultyStyle.bg, borderColor: difficultyStyle.border }
              ]}>
                <Text style={[styles.chipText, { color: difficultyStyle.text }]}>
                  {currentQuestion.difficulty?.toUpperCase()}
                </Text>
              </View>
              {currentQuestion.style && (
                <View style={[styles.chip, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <Text style={[styles.chipText, { color: '#1E40AF' }]}>
                    {STYLE_LABELS[currentQuestion.style] || currentQuestion.style}
                  </Text>
                </View>
              )}
              {/* Show time limit as a chip */}
              <View style={[styles.chip, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
                <Text style={[styles.chipText, { color: '#475569' }]}>
                  ⏱ {formatTime(totalTimeForQuestion)}
                </Text>
              </View>
            </View>

            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          {/* Feedback (shown after submission) */}
          {feedback && (
            <View style={[
              styles.feedbackCard,
              { borderColor: feedback.is_correct ? '#86EFAC' : '#FCA5A5' }
            ]}>
              <View style={[
                styles.feedbackHeader,
                { backgroundColor: feedback.is_correct ? '#F0FFF4' : '#FEE2E2' }
              ]}>
                <Ionicons
                  name={feedback.is_correct ? 'checkmark-circle' : 'close-circle'}
                  size={26}
                  color={feedback.is_correct ? '#15803D' : '#B91C1C'}
                />
                <Text style={[
                  styles.feedbackTitle,
                  { color: feedback.is_correct ? '#15803D' : '#B91C1C' }
                ]}>
                  {feedback.is_correct ? 'Correct answer!' : 'Wrong answer'}
                </Text>
                {feedback.auto_submitted && (
                  <View style={styles.timeUpBadge}>
                    <Ionicons name="alarm" size={11} color="#B91C1C" />
                    <Text style={styles.timeUpText}>Time expired</Text>
                  </View>
                )}
              </View>

              <View style={styles.feedbackBody}>
                {!feedback.is_correct && (
                  <View style={styles.feedbackRow}>
                    <Text style={styles.feedbackLabel}>Correct answer:</Text>
                    <Text style={styles.feedbackValue}>{feedback.correct_answer}</Text>
                  </View>
                )}

                <View style={styles.feedbackRow}>
                  <Text style={styles.feedbackLabel}>Why:</Text>
                  <Text style={styles.feedbackText}>{feedback.correct_explanation}</Text>
                </View>

                <View style={styles.scoreBreakdown}>
                  <Text style={styles.scoreBreakdownTitle}>Your scoring</Text>

                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreRowLabel}>MCQ answer</Text>
                    <Text style={[
                      styles.scoreRowValue,
                      { color: feedback.is_correct ? '#15803D' : '#B91C1C' }
                    ]}>
                      {feedback.is_correct ? '1 / 1 pt' : '0 / 1 pt'}
                    </Text>
                  </View>

                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreRowLabel}>Reasoning quality</Text>
                    <Text style={[
                      styles.scoreRowValue,
                      {
                        color: feedback.reasoning_score >= 0.7
                          ? '#15803D'
                          : feedback.reasoning_score >= 0.4
                            ? '#B45309'
                            : '#B91C1C',
                      }
                    ]}>
                      {feedback.reasoning_score.toFixed(2)} / 1.00 pt
                    </Text>
                  </View>

                  <View style={[styles.scoreRow, styles.scoreRowTotal]}>
                    <Text style={styles.scoreRowLabelTotal}>Total</Text>
                    <Text style={styles.scoreRowValueTotal}>
                      {feedback.total_score.toFixed(2)} / 2.00 pts
                    </Text>
                  </View>
                </View>

                <View style={styles.reasoningFeedback}>
                  <Text style={styles.reasoningFeedbackLabel}>AI feedback on your reasoning:</Text>
                  <Text style={styles.reasoningFeedbackText}>{feedback.reasoning_feedback}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Options */}
          {!feedback && (
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const letter = String.fromCharCode(65 + idx);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                    onPress={() => setSelectedAnswer(option)}
                    activeOpacity={0.8}
                    disabled={timeExpired || submitting}
                  >
                    <View style={[
                      styles.optionLetter,
                      isSelected && styles.optionLetterSelected,
                    ]}>
                      <Text style={[
                        styles.optionLetterText,
                        isSelected && styles.optionLetterTextSelected,
                      ]}>
                        {letter}
                      </Text>
                    </View>
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Explanation input */}
          {!feedback && (
            <View style={styles.explanationCard}>
              <View style={styles.explanationHeader}>
                <Ionicons name="bulb-outline" size={20} color="#553C9A" />
                <Text style={styles.explanationTitle}>Explain your reasoning</Text>
              </View>
              <Text style={styles.explanationHelp}>
                Why did you pick this answer? Be specific — vague explanations score lower.
              </Text>
              <TextInput
                style={styles.explanationInput}
                multiline
                placeholder="e.g., I picked this because the for loop captures the variable by reference, so..."
                placeholderTextColor="#94A3B8"
                value={explanation}
                onChangeText={setExplanation}
                textAlignVertical="top"
                editable={!timeExpired && !submitting}
              />
              <Text style={styles.explanationCount}>
                {explanation.length} characters {explanation.length < 10 && '(minimum 10)'}
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer button */}
        <View style={styles.footer}>
          {!feedback ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                (!selectedAnswer || explanation.trim().length < 10 || submitting) && styles.actionButtonDisabled,
              ]}
              onPress={() => handleSubmit(false)}
              disabled={!selectedAnswer || explanation.trim().length < 10 || submitting}
            >
              <LinearGradient
                colors={
                  !selectedAnswer || explanation.trim().length < 10 || submitting
                    ? ['#CBD5E1', '#94A3B8']
                    : ['#1a365d', '#553C9A']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.actionText}>
                      {timeExpired ? 'Time up — auto-submitting...' : 'Evaluating...'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.actionText}>Submit Answer</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, completing && styles.actionButtonDisabled]}
              onPress={handleNext}
              disabled={completing}
            >
              <LinearGradient
                colors={completing ? ['#CBD5E1', '#94A3B8'] : ['#1a365d', '#553C9A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                {completing ? (
                  <>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.actionText}>Finalizing...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.actionText}>
                      {currentIndex >= totalQuestions - 1 ? 'Finish Quiz' : 'Next Question'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  exitBtn: { padding: 4 },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#553C9A',
    borderRadius: 3,
  },

  timerContainer: {
    marginTop: 2,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timerLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timerValue: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerBarBg: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  scrollContent: {
    padding: 16,
  },

  questionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  optionsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  optionCardSelected: {
    borderColor: '#553C9A',
    backgroundColor: '#FAF5FF',
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterSelected: {
    backgroundColor: '#553C9A',
  },
  optionLetterText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  optionLetterTextSelected: {
    color: '#FFF',
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 19,
  },
  optionTextSelected: {
    color: '#1E293B',
    fontWeight: '600',
  },

  explanationCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    elevation: 1,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  explanationHelp: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  explanationInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#1E293B',
    minHeight: 100,
  },
  explanationCount: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'right',
  },

  feedbackCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  timeUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  timeUpText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C',
  },
  feedbackBody: {
    padding: 14,
    gap: 12,
  },
  feedbackRow: {
    gap: 4,
  },
  feedbackLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  feedbackValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  feedbackText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },

  scoreBreakdown: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  scoreBreakdownTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  scoreRowLabel: {
    fontSize: 13,
    color: '#475569',
  },
  scoreRowValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreRowTotal: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  scoreRowLabelTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  scoreRowValueTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#553C9A',
  },

  reasoningFeedback: {
    backgroundColor: '#FAF5FF',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#553C9A',
  },
  reasoningFeedbackLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#553C9A',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reasoningFeedbackText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },

  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  actionButtonDisabled: {
    opacity: 0.9,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  actionText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});