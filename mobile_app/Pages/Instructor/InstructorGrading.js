import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, FlatList, TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function InstructorGrading({ route, navigation }) {
  const { instructor } = route.params;

  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/instructors/${instructor.id}/courses`);
      if (res.data.success) setCourses(res.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchComponents = async (course) => {
    setSelectedCourse(course);
    setLoading(true);
    try {
      const res = await api.get(`/api/instructors/grades/components/${course.course_id}`);
      if (res.data.success) {
        if (res.data.data.length === 0) {
          Alert.alert('No Components', 'No grade components set up for this course yet. Ask your admin to set them up.');
          return;
        }
        setComponents(res.data.data);
        setStep(2);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (component) => {
    setSelectedComponent(component);
    setLoading(true);
    try {
      const res = await api.get('/api/instructors/grades/students', {
        params: {
          section_id: selectedCourse.section_id,
          component_id: component.id
        }
      });
      if (res.data.success) {
        setStudents(res.data.data);
        const existing = {};
        res.data.data.forEach(s => {
          existing[s.student_id] = s.grade !== null ? s.grade.toString() : '';
        });
        setGrades(existing);
        setStep(3);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all grades
    for (const [student_id, grade] of Object.entries(grades)) {
      if (grade === '') continue;
      const gradeNum = parseFloat(grade);
      if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > selectedComponent.max_grade) {
        Alert.alert('Validation Error', `Grade must be between 0 and ${selectedComponent.max_grade}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const gradesList = Object.entries(grades)
        .filter(([_, grade]) => grade !== '')
        .map(([student_id, grade]) => ({
          student_id: parseInt(student_id),
          grade: parseFloat(grade)
        }));

      await api.post('/api/instructors/grades/submit', {
        section_id: selectedCourse.section_id,
        component_id: selectedComponent.id,
        grades: gradesList,
        recorded_by: instructor.id
      });

      Alert.alert('Success', 'Grades submitted successfully!', [
        { text: 'OK', onPress: () => setStep(2) }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit grades');
    } finally {
      setSubmitting(false);
    }
  };

  const allGraded = students.length > 0 &&
    students.every(s => grades[s.student_id] !== '');

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Grading</Text>
          <Text style={styles.headerSub}>
            {step === 1 ? 'Select course' : step === 2 ? 'Select component' : selectedComponent?.name}
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map(s => (
          <View key={s} style={styles.stepRow}>
            <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
            </View>
            {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2b6cb0" />
        </View>
      ) : (

        // STEP 1: Select course
        step === 1 ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>Select Course</Text>
            {courses.map((course, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => fetchComponents(course)}
                activeOpacity={0.7}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>{course.course_name}</Text>
                  <Text style={styles.cardMeta}>
                    {course.course_id} • Section {course.section_code}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </ScrollView>

        // STEP 2: Select component
        ) : step === 2 ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>Select Grade Component</Text>
            <Text style={styles.stepSub}>{selectedCourse?.course_name}</Text>
            {components.map((comp, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => fetchStudents(comp)}
                activeOpacity={0.7}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>{comp.name}</Text>
                  <Text style={styles.cardMeta}>
                    Max: {comp.max_grade} pts • Weight: {comp.weight}%
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </ScrollView>

        // STEP 3: Enter grades
        ) : (
          <View style={{ flex: 1 }}>
            {/* Info bar */}
            <View style={styles.infoBar}>
              <Text style={styles.infoText}>
                {selectedCourse?.course_name} — {selectedComponent?.name}
              </Text>
              <Text style={styles.infoSub}>Max grade: {selectedComponent?.max_grade}</Text>
            </View>

            <FlatList
              data={students}
              keyExtractor={(item) => item.student_id.toString()}
              contentContainerStyle={styles.scrollContent}
              renderItem={({ item }) => (
                <View style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <View style={styles.studentAvatar}>
                      <Ionicons name="person" size={18} color="#2b6cb0" />
                    </View>
                    <View>
                      <Text style={styles.studentName}>{item.student_name}</Text>
                      <Text style={styles.studentId}>ID: {item.student_id}</Text>
                    </View>
                  </View>
                  <TextInput
                    style={[
                      styles.gradeInput,
                      grades[item.student_id] !== '' && styles.gradeInputFilled
                    ]}
                    placeholder={`/ ${selectedComponent?.max_grade}`}
                    placeholderTextColor="#a0aec0"
                    value={grades[item.student_id] || ''}
                    onChangeText={(val) =>
                      setGrades(prev => ({ ...prev, [item.student_id]: val }))
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              )}
            />

            {/* Submit */}
            <View style={styles.submitContainer}>
              {!allGraded && (
                <Text style={styles.gradingHint}>
                  {students.filter(s => grades[s.student_id] === '').length} student(s) not graded yet
                </Text>
              )}
              <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <LinearGradient colors={['#2f855a', '#38a169']} style={styles.submitGradient}>
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                  }
                  <Text style={styles.submitText}>
                    {submitting ? 'Submitting...' : 'Submit Grades'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )
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
  stepIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#2b6cb0' },
  stepNum: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  stepNumActive: { color: '#FFF' },
  stepLine: { width: 50, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: '#2b6cb0' },
  scrollContent: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stepTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  stepSub: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  card: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  cardMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  infoBar: {
    backgroundColor: '#EFF6FF', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#BFDBFE',
  },
  infoText: { fontSize: 14, fontWeight: '700', color: '#1a365d' },
  infoSub: { fontSize: 12, color: '#3b82f6', marginTop: 2 },
  studentCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
  },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  studentAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  studentId: { fontSize: 12, color: '#64748B', marginTop: 1 },
  gradeInput: {
    width: 80, borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 16, textAlign: 'center', backgroundColor: '#f8fafc', color: '#2d3748',
  },
  gradeInputFilled: { borderColor: '#2b6cb0', backgroundColor: '#EFF6FF' },
  submitContainer: {
    padding: 16, borderTopWidth: 1,
    borderTopColor: '#E2E8F0', backgroundColor: '#FFF',
  },
  gradingHint: { fontSize: 12, color: '#d97706', textAlign: 'center', marginBottom: 8 },
  submitButton: { borderRadius: 14, overflow: 'hidden' },
  submitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});