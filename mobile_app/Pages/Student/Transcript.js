import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

const STATUS_CONFIG = {
  passed: { label: 'Passed', color: '#15803D', bg: '#F0FFF4' },
  failed: { label: 'Failed', color: '#B91C1C', bg: '#FEE2E2' },
  withdrawn: { label: 'Withdrawn', color: '#6B7280', bg: '#F1F5F9' },
  in_progress: { label: 'In Progress', color: '#1E40AF', bg: '#EFF6FF' },
  incomplete: { label: 'Incomplete', color: '#B45309', bg: '#FFFBEB' },
};

const LETTER_COLORS = {
  'A+': '#15803D', 'A': '#15803D', 'A-': '#15803D',
  'B+': '#1E40AF', 'B': '#1E40AF', 'B-': '#1E40AF',
  'C+': '#B45309', 'C': '#B45309', 'C-': '#B45309',
  'D+': '#A16207', 'D': '#A16207', 'D-': '#A16207',
  'F': '#B91C1C',
  'W': '#6B7280',
};

const STANDING_CONFIG = {
  "Dean's List": { color: '#15803D', icon: 'trophy' },
  'Honors': { color: '#15803D', icon: 'medal' },
  'Good Standing': { color: '#1E40AF', icon: 'checkmark-circle' },
  'Academic Probation': { color: '#B91C1C', icon: 'warning' },
};

export default function Transcript({ navigation, route }) {
  const student = route?.params?.student;
  const studentId = student?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (studentId) fetchTranscript();
  }, [studentId]);

  const fetchTranscript = async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await api.get(`/api/students/${studentId}/transcript`);
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError('Unable to load transcript');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Unable to load transcript');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatGPA = (gpa) => Number(gpa || 0).toFixed(2);

  const renderCourseRow = (course) => {
    const statusCfg = STATUS_CONFIG[course.status] || STATUS_CONFIG.in_progress;
    const letterColor = LETTER_COLORS[course.letter_grade] || '#64748B';

    return (
      <View key={`${course.course_id}-${course.section_code}`} style={styles.courseRow}>
        <View style={styles.courseRowLeft}>
          <Text style={styles.courseCode}>{course.course_id}</Text>
          <Text style={styles.courseName} numberOfLines={2}>
            {course.course_name}
          </Text>
          <Text style={styles.courseSection}>
            Section {course.section_code} · {course.course_credits} credits
          </Text>
        </View>

        <View style={styles.courseRowRight}>
          {course.letter_grade ? (
            <Text style={[styles.letterGrade, { color: letterColor }]}>
              {course.letter_grade}
            </Text>
          ) : (
            <Text style={styles.letterGradePending}>—</Text>
          )}
          {course.grade_points !== null && (
            <Text style={styles.gradePoints}>
              {Number(course.grade_points).toFixed(2)} pts
            </Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSemester = (sem) => (
    <View key={sem.semester_id || sem.semester_name} style={styles.semesterCard}>
      <View style={styles.semesterHeader}>
        <View>
          <Text style={styles.semesterName}>{sem.semester_name}</Text>
          {sem.academic_year && (
            <Text style={styles.semesterYear}>{sem.academic_year}</Text>
          )}
        </View>
        <View style={styles.semesterStats}>
          {sem.semester_gpa !== null && (
            <View style={styles.semesterGpaChip}>
              <Text style={styles.semesterGpaLabel}>SEM GPA</Text>
              <Text style={styles.semesterGpaValue}>{formatGPA(sem.semester_gpa)}</Text>
            </View>
          )}
          <View style={styles.creditsChip}>
            <Text style={styles.creditsChipLabel}>CREDITS</Text>
            <Text style={styles.creditsChipValue}>
              {sem.credits_earned} / {sem.credits_attempted}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.coursesList}>
        {sem.courses.map(renderCourseRow)}
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#edf2f7', '#f8fafc']} style={{ flex: 1 }}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2b6cb0" />
        </View>
      </LinearGradient>
    );
  }

  const standingCfg = STANDING_CONFIG[data?.academic?.academic_standing] || STANDING_CONFIG['Good Standing'];
  const progressPct = data?.academic?.credits_required > 0
    ? Math.min(100, (data.academic.completed_credits / data.academic.credits_required) * 100)
    : 0;

  return (
    <LinearGradient colors={['#edf2f7', '#f8fafc']} style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.header}>
          <View style={styles.backRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.headerTitle}>Academic Transcript</Text>
            <Text style={styles.headerSubtitle}>
              Your complete academic history
            </Text>
          </View>

          {data?.student && (
            <View style={styles.studentChip}>
              <Ionicons name="person-circle-outline" size={18} color="#2b6cb0" />
              <Text style={styles.studentChipText}>
                {data.student.name} · {data.student.id}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTranscript(true)}
          />
        }
      >
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* STUDENT INFO */}
        {data?.student && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Major</Text>
              <Text style={styles.infoValue}>{data.student.major_name || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{data.student.department_name || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Degree</Text>
              <Text style={styles.infoValue}>{data.student.degree_type || '—'}</Text>
            </View>
            {data.student.enrollment_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Enrolled Since</Text>
                <Text style={styles.infoValue}>
                  {new Date(data.student.enrollment_date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ACADEMIC SUMMARY (big GPA card) */}
        {data?.academic && (
          <LinearGradient
            colors={['#1a365d', '#276749']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gpaCard}
          >
            <View style={styles.gpaCardTop}>
              <View>
                <Text style={styles.gpaLabel}>CUMULATIVE GPA</Text>
                <Text style={styles.gpaValue}>{formatGPA(data.academic.cumulative_gpa)}</Text>
                <Text style={styles.gpaScale}>out of 4.00</Text>
              </View>
              <View style={[styles.standingBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name={standingCfg.icon} size={16} color="#FFF" />
                <Text style={styles.standingText}>{data.academic.academic_standing}</Text>
              </View>
            </View>

            <View style={styles.creditsProgress}>
              <View style={styles.creditsProgressRow}>
                <Text style={styles.creditsProgressLabel}>Credits earned</Text>
                <Text style={styles.creditsProgressValue}>
                  {data.academic.completed_credits} / {data.academic.credits_required || '?'}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.progressPct}>{progressPct.toFixed(1)}% complete</Text>
            </View>
          </LinearGradient>
        )}

        {/* QUICK STATS */}
        {data?.stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: '#F0FFF4' }]}>
              <Text style={[styles.statValue, { color: '#15803D' }]}>{data.stats.total_passed}</Text>
              <Text style={styles.statLabel}>Passed</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.statValue, { color: '#B91C1C' }]}>{data.stats.total_failed}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#F1F5F9' }]}>
              <Text style={[styles.statValue, { color: '#6B7280' }]}>{data.stats.total_withdrawn}</Text>
              <Text style={styles.statLabel}>Withdrawn</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.statValue, { color: '#1E40AF' }]}>{data.stats.total_in_progress}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
          </View>
        )}

        {/* SEMESTERS */}
        {data?.semesters && data.semesters.length > 0 ? (
          <View style={styles.semestersWrapper}>
            <Text style={styles.sectionHeader}>Course History</Text>
            {data.semesters.map(renderSemester)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#cbd5e0" />
            <Text style={styles.emptyText}>
              No academic records yet. Course completions will appear here after your instructor finalizes grades.
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerWrapper: {
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 24,
    minHeight: 160,
  },
  backRow: { height: 40 },
  titleBlock: { marginTop: 8, alignItems: 'center' },
  headerTitle: {
    fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 4, fontSize: 13, color: '#e2e8f0', textAlign: 'center',
  },
  studentChip: {
    flexDirection: 'row', alignItems: 'center', marginTop: 14,
    backgroundColor: '#e2e8f0', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  studentChipText: {
    marginLeft: 6, fontSize: 12, fontWeight: '600',
  },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  errorText: {
    color: '#c53030', marginTop: 12, textAlign: 'center',
    padding: 16, backgroundColor: '#FEE2E2', borderRadius: 12,
  },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: { color: '#64748B', fontSize: 12 },
  infoValue: { fontWeight: '600', fontSize: 13, color: '#1E293B', maxWidth: '60%', textAlign: 'right' },

  gpaCard: {
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
    elevation: 4,
  },
  gpaCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gpaLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  gpaValue: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -1,
  },
  gpaScale: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: -4,
  },
  standingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  standingText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    marginLeft: 4,
  },

  creditsProgress: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  creditsProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  creditsProgressLabel: {
    color: 'rgba(255,255,255,0.65)', fontSize: 12,
  },
  creditsProgressValue: {
    color: '#fff', fontWeight: '700', fontSize: 13,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9AE6B4',
    borderRadius: 4,
  },
  progressPct: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  semestersWrapper: {
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },

  semesterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  semesterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  semesterName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a365d',
  },
  semesterYear: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  semesterStats: {
    flexDirection: 'row',
    gap: 6,
  },
  semesterGpaChip: {
    backgroundColor: '#F0FFF4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  semesterGpaLabel: {
    fontSize: 8,
    color: '#15803D',
    fontWeight: '800',
    letterSpacing: 1,
  },
  semesterGpaValue: {
    fontSize: 16,
    color: '#15803D',
    fontWeight: '800',
  },
  creditsChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  creditsChipLabel: {
    fontSize: 8,
    color: '#1E40AF',
    fontWeight: '800',
    letterSpacing: 1,
  },
  creditsChipValue: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '800',
  },

  coursesList: { gap: 8 },
  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  courseRowLeft: { flex: 1, paddingRight: 12 },
  courseCode: {
    fontSize: 11,
    color: '#2b6cb0',
    fontWeight: '700',
  },
  courseName: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
    marginTop: 2,
  },
  courseSection: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  courseRowRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  letterGrade: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  letterGradePending: {
    fontSize: 18,
    color: '#CBD5E0',
  },
  gradePoints: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    padding: 24,
  },
  emptyText: {
    marginTop: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
});