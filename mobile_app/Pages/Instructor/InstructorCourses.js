import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function InstructorCourses({ route, navigation }) {
  const { instructor } = route.params;
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get(`/api/instructors/${instructor.id}/courses`);
      if (res.data.success) {
        setCourses(res.data.data);
      } else {
        Alert.alert('Error', res.data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch courses');
    } finally {
      setLoading(false);
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

  const renderCourse = ({ item }) => (
    <View style={styles.card}>
      {/* Course Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.courseName}>{item.course_name}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        </View>
        <Text style={styles.courseMeta}>
          {item.course_id} • Section {item.section_code} • {item.credits} credits
        </Text>
      </View>

      {/* Schedule */}
      {item.schedules.length > 0 && (
        <View style={styles.scheduleContainer}>
          {item.schedules.map((s, index) => (
            <View key={index} style={styles.scheduleRow}>
              <View style={styles.dayBadge}>
                <Text style={styles.dayText}>{s.day.slice(0, 3)}</Text>
              </View>
              <Text style={styles.scheduleTime}>
                {formatTime(s.start)} - {formatTime(s.end)}
              </Text>
              <Text style={styles.scheduleRoom}>
                {s.room ? `${s.room}${s.building ? ', ' + s.building : ''}` : 'TBD'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Capacity */}
      <View style={styles.capacityRow}>
        <Ionicons name="people-outline" size={14} color="#64748B" />
        <Text style={styles.capacityText}>Capacity: {item.capacity}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>My Courses</Text>
          <Text style={styles.headerSub}>{instructor.department}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2b6cb0" />
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => `${item.course_id}-${item.section_id}`}
          renderItem={renderCourse}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={50} color="#CBD5E1" />
              <Text style={styles.emptyText}>No courses assigned yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  headerSub: { fontSize: 12, color: '#64748B' },
  listContent: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { marginBottom: 12 },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseName: { fontSize: 16, fontWeight: '800', color: '#1E293B', flex: 1 },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  typeText: { fontSize: 11, fontWeight: '700', color: '#2b6cb0', textTransform: 'capitalize' },
  courseMeta: { fontSize: 12, color: '#64748B' },
  scheduleContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 8,
    marginBottom: 10,
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayBadge: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
  },
  dayText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  scheduleTime: { fontSize: 13, fontWeight: '600', color: '#1E293B', flex: 1 },
  scheduleRoom: { fontSize: 12, color: '#64748B' },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  capacityText: { fontSize: 12, color: '#64748B' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 12, color: '#94A3B8', fontSize: 15 },
});