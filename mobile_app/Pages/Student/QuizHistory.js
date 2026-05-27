import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

const PROFICIENCY_COLORS = {
  Beginner: '#94A3B8',
  Novice: '#F59E0B',
  Intermediate: '#3B82F6',
  Advanced: '#10B981',
  Expert: '#8B5CF6',
};

const PROFICIENCY_BG = {
  Beginner: '#F1F5F9',
  Novice: '#FFFBEB',
  Intermediate: '#EFF6FF',
  Advanced: '#F0FDF4',
  Expert: '#FAF5FF',
};

export default function QuizHistory({ navigation, route }) {
  const student = route?.params?.student;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (student?.id) fetchSessions();
  }, [student?.id]);

  const fetchSessions = async (isPullToRefresh = false) => {
    if (isPullToRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get(`/api/quiz/sessions/${student.id}`);
      if (res.data.success) {
        setSessions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSessionTap = async (sessionItem) => {
    if (sessionItem.status !== 'completed') {
      // For in-progress sessions, allow resume by going to field selection
      navigation.navigate('QuizFieldSelection', { student });
      return;
    }

    // For completed sessions, fetch details and show results
    try {
      const res = await api.get(`/api/quiz/session/${sessionItem.id}`);
      if (res.data.success) {
        // Build a result object matching what QuizResults expects
        const result = {
          session_id: sessionItem.id,
          question_count: sessionItem.question_count,
          correct_count: sessionItem.correct_count,
          reasoning_avg: sessionItem.reasoning_avg,
          total_score: sessionItem.total_score,
          max_total: sessionItem.question_count * 2,
          score_percent: sessionItem.score_percent,
          proficiency_level: sessionItem.proficiency_level,
        };
        navigation.navigate('QuizResults', {
          student,
          result,
          session_id: sessionItem.id,
        });
      }
    } catch (err) {
      console.error('Failed to load session details', err);
    }
  };

  // Compute aggregate stats
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalAttempts = sessions.length;
  const averageScore = completedSessions.length > 0
    ? completedSessions.reduce((sum, s) => sum + Number(s.score_percent || 0), 0) / completedSessions.length
    : 0;
  const bestScore = completedSessions.length > 0
    ? Math.max(...completedSessions.map(s => Number(s.score_percent || 0)))
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#553C9A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <LinearGradient colors={['#1a365d', '#553C9A']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Quiz History</Text>
        <Text style={styles.subtitle}>
          {totalAttempts === 0
            ? 'No attempts yet'
            : `${totalAttempts} ${totalAttempts === 1 ? 'attempt' : 'attempts'} • ${completedSessions.length} completed`}
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchSessions(true)} />
        }
      >
        {/* Stats row (only if completed sessions exist) */}
        {completedSessions.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{averageScore.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Average Score</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#FAF5FF' }]}>
              <Text style={[styles.statValue, { color: '#553C9A' }]}>{bestScore.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Best Score</Text>
            </View>
          </View>
        )}

        {/* Empty state */}
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No quiz attempts yet</Text>
            <Text style={styles.emptyText}>
              Take your first Career Skills Assessment to see your history here.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('QuizFieldSelection', { student })}
            >
              <LinearGradient
                colors={['#1a365d', '#553C9A']}
                style={styles.emptyButtonGradient}
              >
                <Ionicons name="play" size={16} color="#FFF" />
                <Text style={styles.emptyButtonText}>Start Your First Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sessionsList}>
            {sessions.map((s) => {
              const isCompleted = s.status === 'completed';
              const profColor = PROFICIENCY_COLORS[s.proficiency_level] || '#94A3B8';
              const profBg = PROFICIENCY_BG[s.proficiency_level] || '#F1F5F9';

              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sessionCard, !isCompleted && styles.sessionCardInProgress]}
                  onPress={() => handleSessionTap(s)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionTitleBlock}>
                      <Text style={styles.sessionDomain}>
                        {s.domain_name || s.domain_code}
                      </Text>
                      <Text style={styles.sessionLanguage}>{s.language}</Text>
                    </View>

                    {isCompleted && s.proficiency_level && (
                      <View style={[styles.profBadge, { backgroundColor: profBg }]}>
                        <Text style={[styles.profBadgeText, { color: profColor }]}>
                          {s.proficiency_level}
                        </Text>
                      </View>
                    )}

                    {!isCompleted && (
                      <View style={[styles.profBadge, { backgroundColor: '#FFFBEB' }]}>
                        <Ionicons name="time" size={11} color="#D97706" />
                        <Text style={[styles.profBadgeText, { color: '#D97706', marginLeft: 4 }]}>
                          In Progress
                        </Text>
                      </View>
                    )}
                  </View>

                  {isCompleted && (
                    <View style={styles.scoreBar}>
                      <View style={styles.scoreBarBg}>
                        <View
                          style={[
                            styles.scoreBarFill,
                            {
                              width: `${Math.min(100, Number(s.score_percent || 0))}%`,
                              backgroundColor: profColor,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.scoreBarText, { color: profColor }]}>
                        {Number(s.score_percent || 0).toFixed(1)}%
                      </Text>
                    </View>
                  )}

                  <View style={styles.sessionMeta}>
                    {isCompleted && (
                      <View style={styles.metaItem}>
                        <Ionicons name="checkmark-circle-outline" size={13} color="#64748B" />
                        <Text style={styles.metaText}>
                          {s.correct_count}/{s.question_count} correct
                        </Text>
                      </View>
                    )}
                    {isCompleted && (
                      <View style={styles.metaItem}>
                        <Ionicons name="bulb-outline" size={13} color="#64748B" />
                        <Text style={styles.metaText}>
                          {Number(s.reasoning_avg || 0).toFixed(2)} reasoning
                        </Text>
                      </View>
                    )}
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color="#64748B" />
                      <Text style={styles.metaText}>
                        {formatDate(isCompleted ? s.completed_at : s.started_at)}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#CBD5E1"
                    style={styles.cardArrow}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action button — take new quiz */}
      {sessions.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.newQuizButton}
            onPress={() => navigation.navigate('QuizFieldSelection', { student })}
          >
            <LinearGradient
              colors={['#1a365d', '#553C9A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.newQuizGradient}
            >
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.newQuizText}>Take Another Quiz</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: { padding: 4 },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
  },

  scrollContent: {
    padding: 16,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  sessionsList: {
    gap: 10,
  },
  sessionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    position: 'relative',
  },
  sessionCardInProgress: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sessionTitleBlock: {
    flex: 1,
  },
  sessionDomain: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  sessionLanguage: {
    fontSize: 12,
    color: '#553C9A',
    fontWeight: '600',
    marginTop: 2,
  },
  profBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  profBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scoreBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreBarText: {
    fontSize: 12,
    fontWeight: '800',
    minWidth: 50,
    textAlign: 'right',
  },

  sessionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardArrow: {
    position: 'absolute',
    top: '50%',
    right: 12,
    marginTop: -9,
  },

  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  newQuizButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
  },
  newQuizGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  newQuizText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});