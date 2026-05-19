import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function StudentAttendance({ route, navigation }) {
  const { student } = route.params;

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [absences, setAbsences] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAbsences, setLoadingAbsences] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get(`/api/students/${student.id}/attendance`);
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchAbsences = async (course) => {
    setSelectedCourse(course);
    setDropdownVisible(false);
    setLoadingAbsences(true);
    setAbsences([]);
    try {
      const res = await api.get(
        `/api/students/${student.id}/attendance/${course.section_id}`
      );
      if (res.data.success) {
        setAbsences(res.data.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load absences');
    } finally {
      setLoadingAbsences(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const getAbsenceColor = (count) => {
    if (count === 0) return '#2f855a';
    if (count <= 3) return '#d97706';
    return '#c53030';
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <Text style={styles.headerSub}>Track your absences</Text>
        </View>
        <View style={{ width: 28 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {loadingCourses ? (
          <ActivityIndicator size="large" color="#2b6cb0" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Absence summary cards */}
            <Text style={styles.sectionTitle}>Absence Summary</Text>
            <View style={styles.summaryGrid}>
              {courses.map((course, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.summaryCard}
                  onPress={() => fetchAbsences(course)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.absenceCircle,
                    { borderColor: getAbsenceColor(course.total_absences) }
                  ]}>
                    <Text style={[
                      styles.absenceCount,
                      { color: getAbsenceColor(course.total_absences) }
                    ]}>
                      {course.total_absences}
                    </Text>
                  </View>
                  <Text style={styles.summaryCourseName} numberOfLines={2}>
                    {course.course_name}
                  </Text>
                  <Text style={styles.summarySectionCode}>
                    Sec {course.section_code}
                  </Text>
                  <Text style={[
                    styles.summaryStatus,
                    { color: getAbsenceColor(course.total_absences) }
                  ]}>
                    {course.total_absences === 0
                      ? 'Perfect'
                      : course.total_absences <= 3
                        ? 'Warning'
                        : 'Critical'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Dropdown course selector */}
            <Text style={styles.sectionTitle}>Absence Details</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setDropdownVisible(true)}
            >
              <Text style={selectedCourse ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                {selectedCourse ? `${selectedCourse.course_name} — Sec ${selectedCourse.section_code}` : 'Select a course'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#718096" />
            </TouchableOpacity>

            {/* Absence records */}
            {loadingAbsences ? (
              <ActivityIndicator size="large" color="#2b6cb0" style={{ marginTop: 20 }} />
            ) : selectedCourse ? (
              absences.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle-outline" size={50} color="#2f855a" />
                  <Text style={styles.emptyTitle}>No absences!</Text>
                  <Text style={styles.emptyText}>
                    You have perfect attendance in {selectedCourse.course_name}
                  </Text>
                </View>
              ) : (
                <View style={styles.absenceList}>
                  <Text style={styles.absenceListTitle}>
                    {absences.length} absence{absences.length > 1 ? 's' : ''} in {selectedCourse.course_name}
                  </Text>
                  {absences.map((absence, index) => (
                    <View key={index} style={styles.absenceCard}>
                      <View style={styles.absenceLeft}>
                        <View style={styles.absenceIconCircle}>
                          <Ionicons name="close-circle" size={20} color="#c53030" />
                        </View>
                        <View>
                          <Text style={styles.absenceDate}>
                            {formatDate(absence.date)}
                          </Text>
                          <Text style={styles.absenceTime}>
                            {formatTime(absence.start_time)} - {formatTime(absence.end_time)}
                          </Text>
                          {absence.room && (
                            <Text style={styles.absenceRoom}>
                              {absence.room}{absence.building ? `, ${absence.building}` : ''}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.absentBadge}>
                        <Text style={styles.absentBadgeText}>Absent</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={dropdownVisible}
        onRequestClose={() => setDropdownVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Course</Text>
              <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                <Ionicons name="close" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={courses}
              keyExtractor={(item) => item.section_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => fetchAbsences(item)}
                >
                  <View style={styles.modalItemLeft}>
                    <Text style={styles.modalItemName}>{item.course_name}</Text>
                    <Text style={styles.modalItemSection}>Section {item.section_code}</Text>
                  </View>
                  <View style={[
                    styles.modalAbsenceBadge,
                    { backgroundColor: getAbsenceColor(item.total_absences) + '20' }
                  ]}>
                    <Text style={[
                      styles.modalAbsenceCount,
                      { color: getAbsenceColor(item.total_absences) }
                    ]}>
                      {item.total_absences} abs
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>

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
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 14,
    marginTop: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    width: '47%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  absenceCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  absenceCount: { fontSize: 22, fontWeight: '800' },
  summaryCourseName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 2,
  },
  summarySectionCode: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  summaryStatus: { fontSize: 11, fontWeight: '700' },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    elevation: 2,
  },
  dropdownPlaceholder: { color: '#a0aec0', fontSize: 15 },
  dropdownSelected: { color: '#2d3748', fontSize: 15, fontWeight: '600', flex: 1 },
  absenceList: { marginTop: 8 },
  absenceListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c53030',
    marginBottom: 12,
  },
  absenceCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#c53030',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  absenceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  absenceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  absenceDate: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  absenceTime: { fontSize: 12, color: '#64748B', marginTop: 2 },
  absenceRoom: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  absentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  absentBadgeText: { fontSize: 11, fontWeight: '700', color: '#c53030' },
  emptyState: { alignItems: 'center', marginTop: 30, padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#2f855a', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    minHeight: '30%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a365d' },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  modalItemLeft: { flex: 1 },
  modalItemName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  modalItemSection: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalAbsenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 10,
  },
  modalAbsenceCount: { fontSize: 12, fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#E2E8F0', marginLeft: 20 },
});