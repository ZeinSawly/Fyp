import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function QuizFeedback({ route, navigation }) {
  const {
    student, session_id, field_of_interest,
    result, questionNumber, total_questions,
    selectedOption, question
  } = route.params;

  const {
    optionCorrect, correctAnswer, questionExplanation,
    explanationScore, finalScore, feedback,
    questionsAnswered, done, skillScore, nextQuestion
  } = result;

  const getScoreColor = (score) => {
    if (score >= 8) return '#2f855a';
    if (score >= 5) return '#d97706';
    return '#c53030';
  };

  const getScoreLabel = (score) => {
    if (score === 10) return 'Perfect!';
    if (score >= 7) return 'Great!';
    if (score === 5) return 'Lucky guess';
    if (score >= 2) return 'Partial';
    return 'Incorrect';
  };

  const handleNext = () => {
    if (done) {
      navigation.navigate('QuizResults', {
        student,
        skillScore,
        field_of_interest,
        questionsAnswered,
      });
    } else {
      navigation.navigate('QuizScreen', {
        student,
        session_id,
        question: nextQuestion,
        question_number: questionNumber + 1,
        total_questions,
        field_of_interest,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <LinearGradient
        colors={optionCorrect ? ['#2f855a', '#38a169'] : ['#c53030', '#e53e3e']}
        style={styles.header}
      >
        <View style={styles.resultIconCircle}>
          <Ionicons
            name={optionCorrect ? 'checkmark-circle' : 'close-circle'}
            size={50}
            color="#FFF"
          />
        </View>
        <Text style={styles.resultTitle}>
          {optionCorrect ? 'Correct Answer!' : 'Wrong Answer'}
        </Text>
        <Text style={styles.resultSub}>
          Question {questionNumber} of {total_questions}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Score breakdown */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardTitle}>Score Breakdown</Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Answer</Text>
              <View style={[styles.scoreCircle, { borderColor: optionCorrect ? '#2f855a' : '#c53030' }]}>
                <Ionicons
                  name={optionCorrect ? 'checkmark' : 'close'}
                  size={20}
                  color={optionCorrect ? '#2f855a' : '#c53030'}
                />
              </View>
            </View>

            <View style={styles.scoreDivider} />

            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Explanation</Text>
              <View style={[styles.scoreCircle, { borderColor: getScoreColor(explanationScore) }]}>
                <Text style={[styles.scoreCircleText, { color: getScoreColor(explanationScore) }]}>
                  {explanationScore}/10
                </Text>
              </View>
            </View>

            <View style={styles.scoreDivider} />

            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Final</Text>
              <View style={[styles.scoreCircle, { borderColor: getScoreColor(finalScore) }]}>
                <Text style={[styles.scoreCircleText, { color: getScoreColor(finalScore) }]}>
                  {finalScore}/10
                </Text>
              </View>
              <Text style={[styles.scoreLabel, { color: getScoreColor(finalScore) }]}>
                {getScoreLabel(finalScore)}
              </Text>
            </View>
          </View>
        </View>

        {/* Correct answer */}
        {!optionCorrect && (
          <View style={styles.correctAnswerCard}>
            <Ionicons name="checkmark-circle" size={20} color="#2f855a" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.correctAnswerLabel}>Correct Answer</Text>
              <Text style={styles.correctAnswerText}>
                {correctAnswer} — {question.options[correctAnswer]}
              </Text>
            </View>
          </View>
        )}

        {/* AI Feedback on explanation */}
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="chatbubble-outline" size={18} color="#2b6cb0" />
            <Text style={styles.feedbackTitle}>Feedback on your explanation</Text>
          </View>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>

        {/* Question explanation */}
        {questionExplanation && (
          <View style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <Ionicons name="bulb-outline" size={18} color="#d97706" />
              <Text style={styles.explanationTitle}>Why this is the answer</Text>
            </View>
            <Text style={styles.explanationText}>{questionExplanation}</Text>
          </View>
        )}

        {/* Your answer vs correct */}
        <View style={styles.answersCard}>
          <View style={styles.answerRow}>
            <View style={[styles.answerBadge, { backgroundColor: optionCorrect ? '#C6F6D5' : '#FEE2E2' }]}>
              <Text style={[styles.answerBadgeText, { color: optionCorrect ? '#2f855a' : '#c53030' }]}>
                Your answer: {selectedOption}
              </Text>
            </View>
          </View>
          {!optionCorrect && (
            <View style={styles.answerRow}>
              <View style={[styles.answerBadge, { backgroundColor: '#C6F6D5' }]}>
                <Text style={[styles.answerBadgeText, { color: '#2f855a' }]}>
                  Correct: {correctAnswer}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(questionsAnswered / total_questions) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {questionsAnswered} of {total_questions} questions completed
          </Text>
        </View>

        {/* Next button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.nextGradient}>
            <Text style={styles.nextText}>
              {done ? 'View Results' : 'Next Question'}
            </Text>
            <Ionicons name={done ? 'trophy-outline' : 'arrow-forward'} size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
  resultIconCircle: { marginBottom: 12 },
  resultTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  resultSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  scoreCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 14,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
  },
  scoreCardTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  scoreItem: { alignItems: 'center', gap: 8 },
  scoreItemLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  scoreCircle: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center',
  },
  scoreCircleText: { fontSize: 13, fontWeight: '800' },
  scoreLabel: { fontSize: 11, fontWeight: '700' },
  scoreDivider: { width: 1, height: 60, backgroundColor: '#E2E8F0' },
  correctAnswerCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#C6F6D5',
    borderRadius: 14, padding: 14, marginBottom: 14,
  },
  correctAnswerLabel: { fontSize: 11, fontWeight: '700', color: '#2f855a', textTransform: 'uppercase' },
  correctAnswerText: { fontSize: 14, fontWeight: '600', color: '#1a202c', marginTop: 2 },
  feedbackCard: {
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14,
    marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#2b6cb0',
  },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  feedbackTitle: { fontSize: 13, fontWeight: '700', color: '#1a365d' },
  feedbackText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  explanationCard: {
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14,
    marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#d97706',
  },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  explanationTitle: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  explanationText: { fontSize: 13, color: '#78350f', lineHeight: 20 },
  answersCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    marginBottom: 14, gap: 8, elevation: 2,
  },
  answerRow: { flexDirection: 'row' },
  answerBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  answerBadgeText: { fontSize: 13, fontWeight: '700' },
  progressCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 20, elevation: 2 },
  progressBar: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#2b6cb0', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#64748B', textAlign: 'center', fontWeight: '600' },
  nextButton: { borderRadius: 16, overflow: 'hidden' },
  nextGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 10,
  },
  nextText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});