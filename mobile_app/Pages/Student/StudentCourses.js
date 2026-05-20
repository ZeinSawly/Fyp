import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function StudentCourses({ route, navigation }) {
  const { student } = route.params;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseType, setCourseType] = useState('major');

  // Semester filter state
  const [currentSemester, setCurrentSemester] = useState(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null); // null = "All"
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch current semester once on mount
  useEffect(() => {
    api.get('/api/students/current-semester')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setCurrentSemester(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to load current semester', err));
  }, []);

  // Fetch courses whenever the semester filter changes
  useEffect(() => {
    fetchCourses();
  }, [selectedSemesterId]);

  const fetchCourses = () => {
    setLoading(true);

    const url = selectedSemesterId
      ? `/api/students/${student.id}/courses?semester_id=${selectedSemesterId}`
      : `/api/students/${student.id}/courses`;

    api.get(url)
      .then((res) => {
        if (res.data.success) {
          setCourses(res.data.data);
        } else {
          Alert.alert('Error', res.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        Alert.alert('Error', 'Failed to fetch courses');
      })
      .finally(() => setLoading(false));
  };

  const filteredCourses = courses.filter(course => course.type === courseType);

  const handleCoursePress = (course) => {
    navigation.navigate('CourseDetails', { course, student });
  };

  // Build dropdown options
  const semesterOptions = [
    { id: null, label: 'All Courses' },
    ...(currentSemester ? [{ id: currentSemester.id, label: currentSemester.name }] : [])
  ];

  const activeOption = semesterOptions.find(opt => opt.id === selectedSemesterId) || semesterOptions[0];

  const renderCourse = ({ item }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => handleCoursePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.courseContent}>
        <View style={styles.courseHeader}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle}>{item.name}</Text>
            <Text style={styles.courseDetails}>
              {item.id} • {item.credits} credits
            </Text>
          </View>

          {item.status === 'enrolled' ? (
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          ) : item.status === 'in_cart' ? (
            <Ionicons name="cart" size={22} color="#2b6cb0" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* HEADER */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#1E293B" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Courses Management</Text>
          <Text style={styles.subHeader}>{student.major}</Text>
        </View>

        <View style={{ width: 26 }} />
      </View>

      <View style={styles.container}>

        {/* TITLE + SEMESTER DROPDOWN */}
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Courses</Text>

          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setDropdownOpen(true)}
          >
            <Text style={styles.dropdownTriggerText}>{activeOption.label}</Text>
            <Ionicons name="chevron-down" size={16} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* TYPE TABS */}
        <View style={styles.typeTabsContainer}>
          {['major', 'elective'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeTabBtn,
                courseType === type && styles.activeTypeTab
              ]}
              onPress={() => setCourseType(type)}
            >
              <Text style={[
                styles.typeTabText,
                courseType === type && styles.activeTypeTabText
              ]}>
                {type === 'major' ? 'Major Courses' : 'Elective Courses'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CONTENT */}
        {loading ? (
          <ActivityIndicator size="large" color="#2b6cb0" />
        ) : filteredCourses.length === 0 ? (
          <Text style={styles.emptyText}>No courses available for this filter.</Text>
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.id}
            renderItem={renderCourse}
          />
        )}

      </View>

      {/* SEMESTER DROPDOWN MODAL */}
      <Modal
        transparent
        visible={dropdownOpen}
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            {semesterOptions.map((opt) => (
              <TouchableOpacity
                key={String(opt.id)}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedSemesterId(opt.id);
                  setDropdownOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  opt.id === selectedSemesterId && styles.dropdownItemTextActive
                ]}>
                  {opt.label}
                </Text>
                {opt.id === selectedSemesterId && (
                  <Ionicons name="checkmark" size={18} color="#2b6cb0" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },

  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0'
  },

  headerTitle: { fontSize: 18, fontWeight: '800' },
  subHeader: { fontSize: 12, color: '#64748B' },

  container: { flex: 1, padding: 20 },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },

  sectionTitle: { fontSize: 22, fontWeight: '800' },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6
  },

  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },

  typeTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16
  },

  typeTabBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  activeTypeTab: { backgroundColor: '#2b6cb0' },
  typeTabText: { color: '#64748B', fontWeight: '700' },
  activeTypeTabText: { color: '#FFF' },

  courseCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  courseTitle: { fontSize: 16, fontWeight: '800' },
  courseDetails: { fontSize: 12, color: '#64748B' },

  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 24,
    fontSize: 14
  },

  // Dropdown modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  dropdownMenu: {
    width: 240,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },

  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16
  },

  dropdownItemText: { fontSize: 14, color: '#1E293B' },
  dropdownItemTextActive: { color: '#2b6cb0', fontWeight: '700' }
});