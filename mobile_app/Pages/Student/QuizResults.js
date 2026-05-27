import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

const PROFICIENCY_CONFIG = {
  Beginner: { 
    color: '#94A3B8', 
    bg: '#F1F5F9',
    gradient: ['#94A3B8', '#64748B'],
    icon: 'seedling', 
    iconLib: 'sprout-outline',
    description: 'You\'re starting your journey. Practice fundamentals and code daily.',
    range: '0–29%'
  },
  Novice: { 
    color: '#F59E0B', 
    bg: '#FFFBEB',
    gradient: ['#F59E0B', '#D97706'],
    icon: 'flower-outline',
    iconLib: 'flower-outline',
    description: 'Foundational understanding present. Focus on real projects to deepen skills.',
    range: '30–49%'
  },
  Intermediate: { 
    color: '#3B82F6', 
    bg: '#EFF6FF',
    gradient: ['#3B82F6', '#2563EB'],
    icon: 'rocket-outline',
    iconLib: 'rocket-outline',
    description: 'Solid working knowledge. Time to tackle complex problems and contribute to projects.',
    range: '50–69%'
  },
  Advanced: { 
    color: '#10B981', 
    bg: '#F0FDF4',
    gradient: ['#10B981', '#059669'],
    icon: 'trophy-outline',
    iconLib: 'trophy-outline',
    description: 'Strong technical proficiency. Ready for senior-level challenges and mentorship roles.',
    range: '70–84%'
  },
  Expert: { 
    color: '#8B5CF6', 
    bg: '#FAF5FF',
    gradient: ['#8B5CF6', '#7C3AED'],
    icon: 'diamond-outline',
    iconLib: 'diamond-outline',
    description: 'Exceptional mastery. You demonstrate deep understanding and could lead technical initiatives.',
    range: '85–100%'
  },
};

export default function QuizResults({ navigation, route }) {
  const { student, result, session_id } = route.params || {};

  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  const proficiency = PROFICIENCY_CONFIG[result?.proficiency_level] || PROFICIENCY_CONFIG.Beginner;

  const loadDetails = async () => {
    if (details) {
      setShowAllAnswers(!showAllAnswers);
      return;
    }
    setLoadingDetails(true);
    try {
      const res = await api.get(`/api/quiz/session/${session_id}`);
      if (res.data.success) {
        setDetails(res.data.data);
        setShowAllAnswers(true);
      }
    } catch (err) {
      console.error('Failed to load details', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (!result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text>No results data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scorePercent = Number(result.score_percent || 0);
  const correctCount = Number(result.correct_count || 0);
  const totalQuestions = Number(result.question_count || 0);
  const reasoningAvg = Number(result.reasoning_avg || 0);
  const totalScore = Number(result.total_score || 0);
  const maxTotal = Number(result.max_total || (totalQuestions * 2));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero header */}
        <LinearGradient
          colors={proficiency.gradient}
          style={styles.heroCard}
        >
          <TouchableOpacity 
            onPress={() => navigation.reset({
              index: 1,
              routes: [
                { name: 'StudentDashboard', params: { student } },
                { name: 'QuizIntro', params: { student } },
              ],
            })}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.heroIcon}>
            <Ionicons name={proficiency.iconLib} size={42} color="#FFF" />
          </View>

          <Text style={styles.heroLabel}>YOUR PROFICIENCY LEVEL</Text>
          <Text style={styles.heroLevel}>{result.proficiency_level}</Text>
          <Text style={styles.heroRange}>{proficiency.range}</Text>

          {/* Score percentage */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreValue}>{scorePercent.toFixed(1)}%</Text>
            <Text style={styles.scoreLabel}>Overall Score</Text>
          </View>

          <Text style={styles.heroDescription}>{proficiency.description}</Text>
        </LinearGradient>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            <Text style={styles.statValue}>{correctCount}/{totalQuestions}</Text>
            <Text style={styles.statLabel}>Correct Answers</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="bulb" size={22} color="#553C9A" />
            <Text style={styles.statValue}>{reasoningAvg.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Avg Reasoning</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="trophy" size={22} color="#F59E0B" />
            <Text style={styles.statValue}>{totalScore.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="podium" size={22} color="#3B82F6" />
            <Text style={styles.statValue}>{maxTotal}</Text>
            <Text style={styles.statLabel}>Max Possible</Text>
          </View>
        </View>

        {/* Score breakdown explanation */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>How your score was calculated</Text>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownIcon}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            </View>
            <View style={styles.breakdownText}>
              <Text style={styles.breakdownLine}>
                <Text style={styles.breakdownBold}>MCQ answers: </Text>
                {correctCount} correct out of {totalQuestions} (1 point each)
              </Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownIcon}>
              <Ionicons name="bulb-outline" size={20} color="#553C9A" />
            </View>
            <View style={styles.breakdownText}>
              <Text style={styles.breakdownLine}>
                <Text style={styles.breakdownBold}>Reasoning quality: </Text>
                Average {reasoningAvg.toFixed(2)} out of 1.00 per question
              </Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownIcon}>
              <Ionicons name="calculator-outline" size={20} color="#F59E0B" />
            </View>
            <View style={styles.breakdownText}>
              <Text style={styles.breakdownLine}>
                <Text style={styles.breakdownBold}>Total: </Text>
                {totalScore.toFixed(2)} / {maxTotal.toFixed(0)} = {scorePercent.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Career recommendations placeholder */}
        <View style={styles.placeholderCard}>
          <View style={styles.placeholderIcon}>
            <Ionicons name="construct-outline" size={32} color="#553C9A" />
          </View>
          <Text style={styles.placeholderTitle}>Career Recommendations Coming Soon</Text>
          <Text style={styles.placeholderText}>
            We're training the AI model that will analyze your quiz performance alongside your academic record to suggest tailored Computer Science career paths.
          </Text>
          <View style={styles.placeholderTags}>
            <View style={styles.placeholderTag}>
              <Ionicons name="sync" size={12} color="#553C9A" />
              <Text style={styles.placeholderTagText}>In Development</Text>
            </View>
          </View>
        </View>

        {/* Review answers button */}
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={loadDetails}
        >
          <Ionicons name="document-text-outline" size={20} color="#475569" />
          <Text style={styles.reviewButtonText}>
            {showAllAnswers ? 'Hide answer review' : 'Review all answers'}
          </Text>
          {loadingDetails ? (
            <ActivityIndicator size="small" color="#475569" />
          ) : (
            <Ionicons 
              name={showAllAnswers ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#94A3B8" 
            />
          )}
        </TouchableOpacity>

        {/* All responses (expanded) */}
        {showAllAnswers && details?.responses && (
          <View style={styles.responsesContainer}>
            {details.responses.map((r, idx) => (
              <View key={r.id} style={styles.responseCard}>
                <View style={styles.responseHeader}>
                  <View style={styles.responseNum}>
                    <Text style={styles.responseNumText}>Q{idx + 1}</Text>
                  </View>
                  <View style={styles.responseHeaderRight}>
                    <View style={[
                      styles.responseBadge,
                      { backgroundColor: r.is_correct ? '#F0FDF4' : '#FEE2E2' }
                    ]}>
                      <Ionicons
                        name={r.is_correct ? 'checkmark' : 'close'}
                        size={12}
                        color={r.is_correct ? '#15803D' : '#B91C1C'}
                      />
                      <Text style={[
                        styles.responseBadgeText,
                        { color: r.is_correct ? '#15803D' : '#B91C1C' }
                      ]}>
                        {r.is_correct ? 'Correct' : 'Wrong'}
                      </Text>
                    </View>
                    <Text style={styles.responseScore}>
                      {Number(r.total_score).toFixed(2)} / 2.00
                    </Text>
                  </View>
                </View>

                <Text style={styles.responseQuestion}>{r.question_text}</Text>

                <View style={styles.responseAnswers}>
                  <View style={styles.responseAnswerRow}>
                    <Text style={styles.responseAnswerLabel}>Your answer:</Text>
                    <Text style={[
                      styles.responseAnswerText,
                      { color: r.is_correct ? '#15803D' : '#B91C1C' }
                    ]}>
                      {r.student_answer}
                    </Text>
                  </View>
                  {!r.is_correct && (
                    <View style={styles.responseAnswerRow}>
                      <Text style={styles.responseAnswerLabel}>Correct:</Text>
                      <Text style={[styles.responseAnswerText, { color: '#15803D' }]}>
                        {r.correct_answer}
                      </Text>
                    </View>
                  )}
                  <View style={styles.responseAnswerRow}>
                    <Text style={styles.responseAnswerLabel}>Reasoning:</Text>
                    <Text style={styles.responseAnswerText}>
                      {Number(r.reasoning_score).toFixed(2)} / 1.00
                    </Text>
                  </View>
                </View>

                {r.student_explanation && (
                  <View style={styles.responseExplanation}>
                    <Text style={styles.responseExplanationLabel}>Your explanation:</Text>
                    <Text style={styles.responseExplanationText}>"{r.student_explanation}"</Text>
                  </View>
                )}

                {r.reasoning_feedback && (
                  <View style={styles.responseFeedback}>
                    <Ionicons name="bulb-outline" size={14} color="#553C9A" />
                    <Text style={styles.responseFeedbackText}>{r.reasoning_feedback}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action footer */}
      <View style={styles.footer}>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.reset({
          index: 1,
          routes: [
            { name: 'StudentDashboard', params: { student } },
            { name: 'QuizIntro', params: { student } },
          ],
        })}
      >
          <Ionicons name="home-outline" size={18} color="#475569" />
          <Text style={styles.secondaryButtonText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.reset({
            index: 2,
            routes: [
              { name: 'StudentDashboard', params: { student } },
              { name: 'QuizIntro', params: { student } },
              { name: 'QuizFieldSelection', params: { student } },
            ],
          })}
        >
          <LinearGradient
            colors={['#1a365d', '#553C9A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButtonGradient}
          >
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.primaryButtonText}>Take Another Quiz</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scrollContent: {
    padding: 16,
  },

  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroLevel: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroRange: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scoreValue: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    fontStyle: 'italic',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  breakdownCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  breakdownIcon: {
    paddingTop: 2,
  },
  breakdownText: {
    flex: 1,
  },
  breakdownLine: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  breakdownBold: {
    color: '#1E293B',
    fontWeight: '700',
  },

  placeholderCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D8FD',
    marginBottom: 16,
  },
  placeholderIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#553C9A',
    marginBottom: 6,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: '#6B21A8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 12,
  },
  placeholderTags: {
    flexDirection: 'row',
    gap: 6,
  },
  placeholderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  placeholderTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#553C9A',
  },

  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  reviewButtonText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },

  responsesContainer: {
    marginTop: 12,
    gap: 12,
  },
  responseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  responseNum: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  responseNumText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  responseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  responseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  responseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  responseScore: {
    fontSize: 11,
    fontWeight: '800',
    color: '#553C9A',
  },
  responseQuestion: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 10,
  },
  responseAnswers: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    gap: 4,
    marginBottom: 8,
  },
  responseAnswerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  responseAnswerLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    width: 70,
  },
  responseAnswerText: {
    flex: 1,
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '600',
  },
  responseExplanation: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  responseExplanationLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 2,
  },
  responseExplanationText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
  },
  responseFeedback: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#553C9A',
  },
  responseFeedbackText: {
    flex: 1,
    fontSize: 11,
    color: '#553C9A',
    lineHeight: 16,
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});