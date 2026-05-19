import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, FlatList, TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function InstructorAttendance({ route, navigation }) {
  const { instructor } = route.params;

  const [step, setStep] = useState(1); // 1: select course, 2: select date+session, 3: mark attendance

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Step 1: Load instructor courses
  useEffect(() => {
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
    fetchCourses();
  }, []);

  // Step 2: Load sessions when date + section selected
  const fetchSessions = async () => {
    if (!selectedSection || !date) {
        console.log('Missing:', { selectedSection, date });
        return;
      }
      console.log('Fetching sessions for:', { section_id: selectedSection.section_id, date });

    if (!selectedSection || !date) return;
    setLoading(true);
    try {
      const res = await api.get('/api/instructors/attendance/sessions', {
        params: { section_id: selectedSection.section_id, date }
      });
      if (res.data.success && res.data.data.length > 0) {
        setSessions(res.data.data);
        setSelectedSession(null);
      } else {
        setSessions([]);
        Alert.alert(
            'No Sessions',
            'No classes scheduled for this date. Please select a day when this section has classes.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Load students when session selected
  const fetchStudents = async (session) => {
    setLoading(true);
    try {
        const check = await api.get('/api/instructors/attendance/check', {
            params: {
              section_id: selectedSection.section_id,
              schedule_id: session.schedule_id,
              date
            }
          });
      
          setAlreadySubmitted(check.data.exists);
          if (check.data.exists) {
            Alert.alert(
                'Attendance Already Submitted',
                'Attendance for this session has already been submitted. Please select a different session or date.'
            );
            return;
          }
      const res = await api.get('/api/instructors/attendance/students', {
        params: {
          section_id: selectedSection.section_id,
          schedule_id: session.schedule_id,
          date
        }
      });
      if (res.data.success) {
        setStudents(res.data.data);
        // Pre-fill existing attendance
        const existing = {};
        res.data.data.forEach(s => {
          existing[s.student_id] = s.attendance_status === 'not_marked' ? 'present' : s.attendance_status;
        });
        setAttendance(existing);
        setStep(3);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (student_id) => {
    setAttendance(prev => ({
      ...prev,
      [student_id]: prev[student_id] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const attendanceList = Object.entries(attendance).map(([student_id, status]) => ({
        student_id: parseInt(student_id),
        status
      }));

      await api.post('/api/instructors/attendance/submit', {
        section_id: selectedSection.section_id,
        schedule_id: selectedSession.schedule_id,
        date,
        attendance: attendanceList,
        recorded_by: instructor.id
      });

      Alert.alert('Success', 'Attendance submitted successfully!', [
        { text: 'OK', onPress: () => setStep(2) }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <Text style={styles.headerSub}>
            {step === 1 ? 'Select a course' : step === 2 ? 'Select session' : selectedCourse?.course_name}
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {/* Step indicators */}
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

        // STEP 1: Select course + section
        step === 1 ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>Select Course & Section</Text>
            {courses.map((course, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.courseCard,
                  selectedSection?.section_id === course.section_id && styles.courseCardSelected
                ]}
                onPress={() => {
                  setSelectedCourse(course);
                  setSelectedSection(course);
                }}
              >
                <View style={styles.courseCardLeft}>
                  <Text style={styles.courseName}>{course.course_name}</Text>
                  <Text style={styles.courseMeta}>
                    {course.course_id} • Section {course.section_code}
                  </Text>
                </View>
                {selectedSection?.section_id === course.section_id && (
                  <Ionicons name="checkmark-circle" size={24} color="#2b6cb0" />
                )}
              </TouchableOpacity>
            ))}

            {selectedSection && (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setStep(2)}
              >
                <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.nextGradient}>
                  <Text style={styles.nextText}>Next</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ScrollView>

        // STEP 2: Select date + session
        ) : step === 2 ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>Select Date & Session</Text>

            {/* Date input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <View style={styles.dateRow}>
                <TextInput
                  style={styles.dateInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#a0aec0"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={fetchSessions}>
                  <Ionicons name="search" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sessions */}
            {sessions.length > 0 && (
              <View>
                <Text style={styles.inputLabel}>Sessions on this day</Text>
                {sessions.map((session, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.sessionCard,
                      selectedSession?.schedule_id === session.schedule_id && styles.sessionCardSelected
                    ]}
                    onPress={() => setSelectedSession(session)}
                  >
                    <View style={styles.sessionLeft}>
                      <Ionicons name="time-outline" size={20} color="#2b6cb0" />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.sessionTime}>
                          {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </Text>
                        <Text style={styles.sessionRoom}>
                          {session.room || 'Room TBD'}
                          {session.building ? `, ${session.building}` : ''}
                        </Text>
                      </View>
                    </View>
                    {selectedSession?.schedule_id === session.schedule_id && (
                      <Ionicons name="checkmark-circle" size={24} color="#2b6cb0" />
                    )}
                  </TouchableOpacity>
                ))}

                {selectedSession && (
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={() => fetchStudents(selectedSession)}
                  >
                    <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.nextGradient}>
                      <Text style={styles.nextText}>Load Students</Text>
                      <Ionicons name="people-outline" size={18} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>

        // STEP 3: Mark attendance
        ) : (
          <View style={{ flex: 1 }}>
            {/* Summary bar */}
            <View style={styles.summaryBar}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryCount}>{presentCount}</Text>
                <Text style={styles.summaryLabel}>Present</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryCount, { color: '#EF5350' }]}>{absentCount}</Text>
                <Text style={styles.summaryLabel}>Absent</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryCount}>{students.length}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
            </View>

            <FlatList
              data={students}
              keyExtractor={(item) => item.student_id.toString()}
              contentContainerStyle={styles.scrollContent}
              renderItem={({ item }) => {
                const isPresent = attendance[item.student_id] === 'present';
                return (
                  <TouchableOpacity
                    style={[styles.studentCard, !isPresent && styles.studentCardAbsent]}
                    onPress={() => toggleAttendance(item.student_id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.studentLeft}>
                      <View style={[styles.studentAvatar, !isPresent && styles.studentAvatarAbsent]}>
                        <Ionicons name="person" size={20} color={isPresent ? '#2b6cb0' : '#EF5350'} />
                      </View>
                      <View>
                        <Text style={styles.studentName}>{item.student_name}</Text>
                        <Text style={styles.studentId}>ID: {item.student_id}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, !isPresent && styles.statusBadgeAbsent]}>
                      <Text style={[styles.statusText, !isPresent && styles.statusTextAbsent]}>
                        {isPresent ? 'Present' : 'Absent'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Submit button */}
            <View style={styles.submitContainer}>
            {alreadySubmitted ? (
                <View style={styles.alreadySubmittedBanner}>
                <Ionicons name="checkmark-circle" size={22} color="#2f855a" />
                <Text style={styles.alreadySubmittedText}>
                    Attendance already recorded for this session
                </Text>
                </View>
            ) : (
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
                    {submitting ? 'Submitting...' : 'Submit Attendance'}
                    </Text>
                </LinearGradient>
                </TouchableOpacity>
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#2b6cb0' },
  stepNum: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  stepNumActive: { color: '#FFF' },
  stepLine: { width: 50, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: '#2b6cb0' },
  scrollContent: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stepTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  courseCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  courseCardSelected: { borderColor: '#2b6cb0', backgroundColor: '#EFF6FF' },
  courseCardLeft: { flex: 1 },
  courseName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  courseMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#4a5568', marginBottom: 8 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: '#FFF',
    color: '#2d3748',
  },
  searchBtn: {
    backgroundColor: '#2b6cb0',
    width: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
  },
  sessionCardSelected: { borderColor: '#2b6cb0', backgroundColor: '#EFF6FF' },
  sessionLeft: { flexDirection: 'row', alignItems: 'center' },
  sessionTime: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  sessionRoom: { fontSize: 12, color: '#64748B', marginTop: 2 },
  nextButton: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: { alignItems: 'center' },
  summaryCount: { fontSize: 22, fontWeight: '800', color: '#2b6cb0' },
  summaryLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#E2E8F0' },
  studentCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  studentCardAbsent: { backgroundColor: '#FFF5F5' },
  studentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarAbsent: { backgroundColor: '#FEE2E2' },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  studentId: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: {
    backgroundColor: '#C6F6D5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeAbsent: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#2f855a' },
  statusTextAbsent: { color: '#C53030' },
  submitContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  submitButton: { borderRadius: 14, overflow: 'hidden' },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  alreadySubmittedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C6F6D5',
    padding: 16,
    borderRadius: 14,
    gap: 10,
  },
  alreadySubmittedText: {
    color: '#2f855a',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
});