import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function DropCourse({ navigation, route }) {
  const { student } = route.params || {};
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const response = await api.get(`/api/students/${student.id}/enrolled-courses`);
      console.log('Full response:', response.data);

      if (response.data && response.data.success) {
        console.log('Courses data:', response.data.data);
        setEnrolledCourses(response.data.data);
      }
    } catch (error) {
      console.error('Error details:', error);
      Alert.alert('Error', 'Failed to fetch enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (course) => {
    Alert.alert(
      'Drop Course',
      `Are you sure you want to drop ${course.course_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Drop',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/students/drop-course`, {
                data: { student_id: student.id, section_id: course.section_id }
              });
              Alert.alert('Success', 'Course dropped successfully');
              fetchEnrolledCourses();
            } catch (error) {
              console.error('Drop error:', error);
              Alert.alert('Error', 'Could not drop the course');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseInfo}>
        <Text style={styles.courseName}>{item.course_name}</Text>
        <View style={styles.courseDetails}>
          <View style={styles.detailBadge}>
            <Ionicons name="code-outline" size={14} color="#64748B" />
            <Text style={styles.detailText}>{item.course_id}</Text>
          </View>
          <View style={styles.detailBadge}>
            <Ionicons name="book-outline" size={14} color="#64748B" />
            <Text style={styles.detailText}>Section {item.section_code}</Text>
          </View>
          <View style={styles.detailBadge}>
            <Ionicons name="star-outline" size={14} color="#64748B" />
            <Text style={styles.detailText}>{item.credits} Credits</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleDrop(item)} style={styles.dropButton}>
        <Ionicons name="trash-outline" size={22} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drop Course</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a365d" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={enrolledCourses}
          keyExtractor={(item) => item.course_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>You are not enrolled in any courses</Text>
              <Text style={styles.emptySubtext}>Go to Course Registration to add courses</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  listContainer: { padding: 16 },
  courseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  courseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  detailText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  dropButton: { 
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 16, 
    color: '#64748B', 
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 14,
  },
});