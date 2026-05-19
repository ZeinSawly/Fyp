import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function QuizResults({ route, navigation }) {
  const { student, skillScore, field_of_interest, questionsAnswered, responses } = route.params;
  const [expandedIndex, setExpandedIndex] = useState(null);

  const { timeUp } = route.params;


  const getScoreColor = (score) => {
    if (score >= 75) return '#2f855a';
    if (score >= 50) return '#d97706';
    return '#c53030';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  };

  const getScoreMessage = (score) => {
    if (score >= 85) return `You demonstrated strong knowledge and reasoning skills in ${field_of_interest}.`;
    if (score >= 70) return `You showed good understanding of ${field_of_interest} with room to improve.`;
    if (score >= 50) return `You have a basic understanding of ${field_of_interest}. Keep practicing!`;
    return `You may need to build more foundational knowledge in ${field_of_interest}.`;
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'mcq': return 'MCQ';
      case 'output_prediction': return 'Output';
      case 'spot_the_bug': return 'Bug';
      case 'scenario': return 'Scenario';
      case 'case_study': return 'Case Study';
      default: return type;
    }
  };

  const getFinalScoreColor = (score) => {
    if (score >= 8) return '#2f855a';
    if (score >= 5) return '#d97706';
    return '#c53030';
  };

  const correctCount = responses?.filter(r => r.optionCorrect).length || 0;
  const wrongCount = (responses?.length || 0) - correctCount;
  const scoreColor = getScoreColor(skillScore);

  const renderResponse = ({ item, index }) => {
    const isExpanded = expandedIndex === index;

    return (
      <TouchableOpacity
        style={[
          styles.responseCard,
          { borderLeftColor: item.optionCorrect ? '#2f855a' : '#c53030' }
        ]}
        onPress={() => setExpandedIndex(isExpanded ? null : index)}
        activeOpacity={0.7}
      >
        {/* Response header */}
        <View style={styles.responseHeader}>
          <View style={styles.responseHeaderLeft}>
            <View style={[
              styles.responseNumberCircle,
              { backgroundColor: item.optionCorrect ? '#C6F6D5' : '#FEE2E2' }
            ]}>
              <Text style={[
                styles.responseNumber,
                { color: item.optionCorrect ? '#2f855a' : '#c53030' }
              ]}>
                {item.questionNumber}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.responseQuestion} numberOfLines={isExpanded ? undefined : 2}>
                {item.questionText}
              </Text>
              <View style={styles.responseMetaRow}>
                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>{getTypeLabel(item.type)}</Text>
                </View>
                <Text style={styles.difficultyText}>
                  {item.difficulty === 1 ? '● Easy' : item.difficulty === 2 ? '●● Medium' : '●●● Hard'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.responseHeaderRight}>
            <View style={[
              styles.scoreCircleSmall,
              { borderColor: getFinalScoreColor(item.finalScore) }
            ]}>
              <Text style={[
                styles.scoreCircleSmallText,
                { color: getFinalScoreColor(item.finalScore) }
              ]}>
                {item.finalScore}/10
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#94A3B8"
              style={{ marginTop: 6 }}
            />
          </View>
        </View>

        {/* Expanded details */}
        {isExpanded && (
          <View style={styles.responseDetails}>
            <View style={styles.detailsDivider} />

            {/* Code block */}
            {item.code && (
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{item.code}</Text>
              </View>
            )}

            {/* Code lines */}
            {item.code_lines && (
              <View style={styles.codeBlock}>
                {Object.entries(item.code_lines).map(([key, line]) => (
                  <View key={key} style={styles.codeLine}>
                    <Text style={styles.codeLineLabel}>{key}.</Text>
                    <Text style={styles.codeLineText}>{line}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Options */}
            {Object.entries(item.options).map(([key, value]) => {
              const isSelected = key === item.selectedOption;
              const isCorrect = key === item.correctAnswer;
              let bgColor = '#F8FAFC';
              let borderColor = '#E2E8F0';
              let textColor = '#1E293B';

              if (isCorrect) { bgColor = '#C6F6D5'; borderColor = '#2f855a'; textColor = '#2f855a'; }
              else if (isSelected && !isCorrect) { bgColor = '#FEE2E2'; borderColor = '#c53030'; textColor = '#c53030'; }

              return (
                <View key={key} style={[styles.optionRow, { backgroundColor: bgColor, borderColor }]}>
                  <Text style={[styles.optionKey, { color: textColor }]}>{key}.</Text>
                  <Text style={[styles.optionValue, { color: textColor }]}>{value}</Text>
                  {isCorrect && <Ionicons name="checkmark-circle" size={16} color="#2f855a" />}
                  {isSelected && !isCorrect && <Ionicons name="close-circle" size={16} color="#c53030" />}
                </View>
              );
            })}

            {/* Your answer vs correct */}
            <View style={styles.answerSummary}>
              <View style={[styles.answerPill, { backgroundColor: item.optionCorrect ? '#C6F6D5' : '#FEE2E2' }]}>
                <Text style={[styles.answerPillText, { color: item.optionCorrect ? '#2f855a' : '#c53030' }]}>
                  Your answer: {item.selectedOption} {item.optionCorrect ? '✓' : '✗'}
                </Text>
              </View>
              {!item.optionCorrect && (
                <View style={[styles.answerPill, { backgroundColor: '#C6F6D5' }]}>
                  <Text style={[styles.answerPillText, { color: '#2f855a' }]}>
                    Correct: {item.correctAnswer} ✓
                  </Text>
                </View>
              )}
            </View>

            {/* Student explanation */}
            <View style={styles.explanationSection}>
              <Text style={styles.explanationSectionTitle}>Your explanation:</Text>
              <Text style={styles.explanationSectionText}>{item.explanation}</Text>
            </View>

            {/* AI Feedback */}
            <View style={styles.feedbackSection}>
              <View style={styles.feedbackSectionHeader}>
                <Ionicons name="chatbubble-outline" size={14} color="#2b6cb0" />
                <Text style={styles.feedbackSectionTitle}>AI Feedback</Text>
                <View style={[styles.expScorePill, { backgroundColor: getFinalScoreColor(item.explanationScore) + '20' }]}>
                  <Text style={[styles.expScoreText, { color: getFinalScoreColor(item.explanationScore) }]}>
                    Explanation: {item.explanationScore}/10
                  </Text>
                </View>
              </View>
              <Text style={styles.feedbackSectionText}>{item.feedback}</Text>
            </View>

            {/* Why this answer */}
            {item.questionExplanation && (
              <View style={styles.whySection}>
                <View style={styles.whySectionHeader}>
                  <Ionicons name="bulb-outline" size={14} color="#d97706" />
                  <Text style={styles.whySectionTitle}>Why this is the answer</Text>
                </View>
                <Text style={styles.whySectionText}>{item.questionExplanation}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.header}>
        <Text style={styles.headerTitle}>Quiz Complete!</Text>
        <Text style={styles.headerSub}>{field_of_interest}</Text>
      </LinearGradient>

      <FlatList
        data={responses}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderResponse}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Score circle */}
            <View style={styles.scoreSection}>
              <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
                <Text style={[styles.scoreNumber, { color: scoreColor }]}>{skillScore}</Text>
                <Text style={[styles.scoreOutOf, { color: scoreColor }]}>/100</Text>
              </View>
              <Text style={[styles.scoreLabel, { color: scoreColor }]}>
                {getScoreLabel(skillScore)}
              </Text>
              <Text style={styles.scoreMessage}>{getScoreMessage(skillScore)}</Text>
              {timeUp && (
              <View style={styles.timeUpBanner}>
                <Ionicons name="time-outline" size={18} color="#c53030" />
                <Text style={styles.timeUpText}>
                  Quiz ended — time ran out before all questions were answered
                </Text>
              </View>
            )}
            </View>

            {/* Summary stats */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={22} color="#2f855a" />
                <Text style={[styles.summaryValue, { color: '#2f855a' }]}>{correctCount}</Text>
                <Text style={styles.summaryLabel}>Correct</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Ionicons name="close-circle" size={22} color="#c53030" />
                <Text style={[styles.summaryValue, { color: '#c53030' }]}>{wrongCount}</Text>
                <Text style={styles.summaryLabel}>Wrong</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Ionicons name="star" size={22} color={scoreColor} />
                <Text style={[styles.summaryValue, { color: scoreColor }]}>{skillScore}</Text>
                <Text style={styles.summaryLabel}>Skill Score</Text>
              </View>
            </View>

            {/* Score bar */}
            <View style={styles.scoreBarCard}>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${skillScore}%`, backgroundColor: scoreColor }]} />
              </View>
              <View style={styles.scoreBarLabels}>
                <Text style={[styles.scoreBarLabel, { color: '#c53030' }]}>Needs Work</Text>
                <Text style={[styles.scoreBarLabel, { color: '#d97706' }]}>Average</Text>
                <Text style={[styles.scoreBarLabel, { color: '#2f855a' }]}>Excellent</Text>
              </View>
            </View>

            <Text style={styles.breakdownTitle}>Question Breakdown</Text>
            <Text style={styles.breakdownHint}>Tap any question to see details</Text>
          </>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('StudentDashboard', { student })}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.buttonGradient}>
                <Ionicons name="home-outline" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('QuizIntro', { student })}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={20} color="#2b6cb0" />
              <Text style={styles.secondaryButtonText}>Retake Quiz</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  listContent: { padding: 16, paddingBottom: 20 },

  // Score section
  scoreSection: { alignItems: 'center', marginBottom: 20 },
  scoreCircle: {
    width: 130, height: 130, borderRadius: 65, borderWidth: 6,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF',
    marginBottom: 12, elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12,
  },
  scoreNumber: { fontSize: 44, fontWeight: '800' },
  scoreOutOf: { fontSize: 14, fontWeight: '600' },
  scoreLabel: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  scoreMessage: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  timeUpBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12,
    marginTop: 10, borderLeftWidth: 4, borderLeftColor: '#c53030',
  },
  timeUpText: { flex: 1, fontSize: 13, color: '#c53030', fontWeight: '600' },
  // Summary card
  summaryCard: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 18,
    padding: 20, marginBottom: 14, justifyContent: 'space-around',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
  },
  summaryItem: { alignItems: 'center', gap: 6 },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  summaryDivider: { width: 1, backgroundColor: '#E2E8F0' },

  // Score bar
  scoreBarCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 16,
    marginBottom: 20, elevation: 3,
  },
  scoreBar: { height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  scoreBarFill: { height: '100%', borderRadius: 5 },
  scoreBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreBarLabel: { fontSize: 10, fontWeight: '600' },

  // Breakdown
  breakdownTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  breakdownHint: { fontSize: 12, color: '#94A3B8', marginBottom: 12 },

  // Response card
  responseCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    marginBottom: 10, borderLeftWidth: 4, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
  },
  responseHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  responseHeaderLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  responseNumberCircle: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  responseNumber: { fontSize: 13, fontWeight: '800' },
  responseQuestion: { fontSize: 13, fontWeight: '600', color: '#1E293B', lineHeight: 18, flex: 1 },
  responseMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typePill: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typePillText: { fontSize: 10, fontWeight: '700', color: '#2b6cb0' },
  difficultyText: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  responseHeaderRight: { alignItems: 'center', marginLeft: 8 },
  scoreCircleSmall: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  scoreCircleSmallText: { fontSize: 11, fontWeight: '800' },

  // Expanded details
  responseDetails: { marginTop: 10 },
  detailsDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  codeBlock: { backgroundColor: '#1E293B', borderRadius: 10, padding: 12, marginBottom: 10 },
  codeText: { fontFamily: 'monospace', fontSize: 12, color: '#E2E8F0', lineHeight: 18 },
  codeLine: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  codeLineLabel: { fontSize: 12, fontWeight: '700', color: '#FFA726', fontFamily: 'monospace', minWidth: 18 },
  codeLineText: { fontSize: 12, color: '#E2E8F0', fontFamily: 'monospace', flex: 1 },

  // Options
  optionRow: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderRadius: 8, borderWidth: 1, marginBottom: 6, gap: 8,
  },
  optionKey: { fontSize: 13, fontWeight: '800', minWidth: 20 },
  optionValue: { flex: 1, fontSize: 13 },

  // Answer summary
  answerSummary: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  answerPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  answerPillText: { fontSize: 12, fontWeight: '700' },

  // Explanation
  explanationSection: {
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, marginBottom: 8,
  },
  explanationSectionTitle: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4, textTransform: 'uppercase' },
  explanationSectionText: { fontSize: 13, color: '#475569', lineHeight: 18 },

  // AI Feedback
  feedbackSection: {
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 10,
    marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#2b6cb0',
  },
  feedbackSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  feedbackSectionTitle: { fontSize: 11, fontWeight: '700', color: '#1a365d', flex: 1 },
  expScorePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  expScoreText: { fontSize: 10, fontWeight: '700' },
  feedbackSectionText: { fontSize: 12, color: '#475569', lineHeight: 18 },

  // Why answer
  whySection: {
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10,
    borderLeftWidth: 3, borderLeftColor: '#d97706',
  },
  whySectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  whySectionTitle: { fontSize: 11, fontWeight: '700', color: '#92400e' },
  whySectionText: { fontSize: 12, color: '#78350f', lineHeight: 18 },

  // Footer
  footer: { marginTop: 20, gap: 12 },
  primaryButton: { borderRadius: 16, overflow: 'hidden' },
  buttonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 10,
  },
  primaryButtonText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  secondaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 16, gap: 8,
    borderWidth: 2, borderColor: '#2b6cb0',
  },
  secondaryButtonText: { color: '#2b6cb0', fontWeight: '800', fontSize: 16 },
});