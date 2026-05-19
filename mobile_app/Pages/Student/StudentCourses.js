import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator, Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';


export default function StudentCourses({ route, navigation }) {
  const { student } = route.params;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseType, setCourseType] = useState('major'); 

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = () => {
    setLoading(true);

    api.get(`/api/students/${student.id}/courses`)
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

  // 🔥 FILTER LOGIC
  const filteredCourses = courses.filter(course => course.type === courseType);

  const handleCoursePress = (course) => {
    navigation.navigate('CourseDetails', { course, student });
  };

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

          {item.status === 'completed' ? (
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
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

        {/* TITLE */}
        <Text style={styles.sectionTitle}>Courses</Text>

        {/* 🔥 TYPE TABS */}
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
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.id}
            renderItem={renderCourse}
          />
        )}

      </View>
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

  headerTitle: {
    fontSize: 18,
    fontWeight: '800'
  },

  subHeader: {
    fontSize: 12,
    color: '#64748B'
  },

  container: {
    flex: 1,
    padding: 20
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10
  },

  /* 🔥 NEW TABS */
  typeTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16
  },

  typeTabBtn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 10
  },

  activeTypeTab: {
    backgroundColor: '#2b6cb0'
  },

  typeTabText: {
    color: '#64748B',
    fontWeight: '700'
  },

  activeTypeTabText: {
    color: '#FFF'
  },

  courseCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12
  },

  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  courseTitle: {
    fontSize: 16,
    fontWeight: '800'
  },

  courseDetails: {
    fontSize: 12,
    color: '#64748B'
  }
});