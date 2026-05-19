import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function StudentGrades({ route, navigation }) {
  const { student } = route.params;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const res = await api.get(`/api/students/${student.id}/grades`);
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (components) => {
    let total = 0;
    let totalWeight = 0;

    components.forEach(comp => {
      if (comp.grade !== null) {
        const percentage = (comp.grade / comp.max_grade) * comp.weight;
        total += percentage;
        totalWeight += parseFloat(comp.weight);
      }
    });

    return { total: total.toFixed(1), totalWeight };
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 85) return '#2f855a';
    if (percentage >= 70) return '#d97706';
    if (percentage >= 60) return '#dd6b20';
    return '#c53030';
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    return 'F';
  };

  const toggleCourse = (courseId) => {
    setExpandedCourse(prev => prev === courseId ? null : courseId);
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>My Grades</Text>
          <Text style={styles.headerSub}>Academic performance</Text>
        </View>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2b6cb0" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {courses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No grades yet</Text>
              <Text style={styles.emptyText}>Your grades will appear here once your instructor submits them</Text>
            </View>
          ) : (
            courses.map((course, index) => {
              const { total, totalWeight } = calculateTotal(course.components);
              const isExpanded = expandedCourse === course.course_id;
              const hasGrades = course.components.some(c => c.grade !== null);
              const gradeColor = hasGrades ? getGradeColor(parseFloat(total)) : '#94A3B8';
              const gradeLetter = hasGrades ? getGradeLetter(parseFloat(total)) : '-';

              return (
                <View key={index} style={styles.courseCard}>

                  {/* Course header — tap to expand */}
                  <TouchableOpacity
                    style={styles.courseHeader}
                    onPress={() => toggleCourse(course.course_id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.courseHeaderLeft}>
                      <Text style={styles.courseName}>{course.course_name}</Text>
                      <Text style={styles.courseMeta}>
                        {course.course_id} • Sec {course.section_code}
                      </Text>
                      {hasGrades && (
                        <Text style={styles.courseProgress}>
                          {totalWeight}% of grade recorded
                        </Text>
                      )}
                    </View>

                    <View style={styles.courseHeaderRight}>
                      <View style={[styles.gradeCircle, { borderColor: gradeColor }]}>
                        <Text style={[styles.gradeLetter, { color: gradeColor }]}>
                          {gradeLetter}
                        </Text>
                        <Text style={[styles.gradeTotal, { color: gradeColor }]}>
                          {hasGrades ? `${total}%` : 'N/A'}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#94A3B8"
                        style={{ marginTop: 8 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded components */}
                  {isExpanded && (
                    <View style={styles.componentsList}>
                      <View style={styles.componentsDivider} />

                      {course.components.length === 0 ? (
                        <Text style={styles.noComponents}>
                          No grade components set up yet
                        </Text>
                      ) : (
                        course.components.map((comp, cIndex) => {
                          const percentage = comp.grade !== null
                            ? ((comp.grade / comp.max_grade) * 100).toFixed(1)
                            : null;
                          const compColor = percentage
                            ? getGradeColor(parseFloat(percentage))
                            : '#94A3B8';

                          return (
                            <View key={cIndex} style={styles.componentRow}>
                              <View style={styles.componentLeft}>
                                <Text style={styles.componentName}>{comp.component_name}</Text>
                                <Text style={styles.componentWeight}>
                                  Weight: {comp.weight}% • Max: {comp.max_grade}
                                </Text>
                              </View>

                              <View style={styles.componentRight}>
                                {comp.grade !== null ? (
                                  <>
                                    <Text style={[styles.componentGrade, { color: compColor }]}>
                                      {comp.grade}/{comp.max_grade}
                                    </Text>
                                    <Text style={[styles.componentPercentage, { color: compColor }]}>
                                      {percentage}%
                                    </Text>
                                  </>
                                ) : (
                                  <Text style={styles.notGraded}>Not graded</Text>
                                )}
                              </View>
                            </View>
                          );
                        })
                      )}

                      {/* Progress bar */}
                      {hasGrades && (
                        <View style={styles.progressSection}>
                          <View style={styles.progressBar}>
                            <View style={[
                              styles.progressFill,
                              {
                                width: `${Math.min(parseFloat(total), 100)}%`,
                                backgroundColor: gradeColor
                              }
                            ]} />
                          </View>
                          <Text style={[styles.progressText, { color: gradeColor }]}>
                            Current total: {total}%
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8 },
  courseCard: {
    backgroundColor: '#FFF', borderRadius: 18, marginBottom: 14,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  courseHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  courseHeaderLeft: { flex: 1, marginRight: 12 },
  courseName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  courseMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  courseProgress: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  courseHeaderRight: { alignItems: 'center' },
  gradeCircle: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 3, justifyContent: 'center', alignItems: 'center',
  },
  gradeLetter: { fontSize: 18, fontWeight: '800' },
  gradeTotal: { fontSize: 10, fontWeight: '600' },
  componentsList: { paddingHorizontal: 16, paddingBottom: 16 },
  componentsDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  noComponents: { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingVertical: 10 },
  componentRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  componentLeft: { flex: 1 },
  componentName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  componentWeight: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  componentRight: { alignItems: 'flex-end' },
  componentGrade: { fontSize: 15, fontWeight: '800' },
  componentPercentage: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  notGraded: { fontSize: 12, color: '#CBD5E1', fontWeight: '600' },
  progressSection: { marginTop: 14 },
  progressBar: {
    height: 6, backgroundColor: '#E2E8F0',
    borderRadius: 3, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
});