import React, {useState, useEffect} from 'react';
import {  View,  Text,  StyleSheet,  SafeAreaView,  ScrollView,  TouchableOpacity, } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function InstructorDashboard({navigation, route}) {
  
  const [coursesCount, setCoursesCount] = useState(0);

  const { instructor } = route.params;

  const quickAccessItems = [
    { name: 'list-circle', color: '#66BB6A', label: 'Attendance', screen: 'InstructorAttendance' },
    { name: 'book', color: '#5C6BC0', label: 'Courses', screen: 'InstructorCourses' },
    { name: 'create', color: '#42A5F5', label: 'Grading', screen: 'InstructorGrading' },
    { name: 'calendar', color: '#FF7043', label: 'Schedule', screen: 'InstructorSchedule' },
    { name: 'person-circle', color: '#AB47BC', label: 'Profile', screen: 'InstructorProfile' },
  ];


  useEffect(() =>{
    const fetchCoursesCount = async () =>{
      try{
        const res = await api.get(`/api/instructors/${instructor.id}/courses`);

        if(res.data.success){
          setCoursesCount(res.data.data.length)
        }
      }catch (error) {
        console.log('Error fetching courses:', error);
      }
    };

    fetchCoursesCount();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <LinearGradient 
          colors={['#1a365d', '#2b6cb0']} 
          style={styles.card}
        >
          <View style={styles.topSection}>
            <View>
              <Text style={styles.nameText}>{instructor.name}</Text>
              <Text style={styles.idText}>{instructor.id}</Text>
            </View>
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={40} color="#BDC3C7" />
            </View>
          </View>
          
          <View style={styles.majorBadge}>
            <Text style={styles.majorText}>{instructor.department}</Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} activeOpacity={0.6}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="journal-outline" size={28} color="#0369a1" />
            </View>
            <Text style={styles.statValue}>{coursesCount}</Text>
            <Text style={styles.statLabel}>Active Courses</Text>
          </TouchableOpacity>

        </View>

        {/* --- INSTRUCTOR QUICK ACCESS --- */}
        <Text style={styles.sectionHeader}>Instructor Tools</Text>
        
        <View style={styles.gridContainer}>
          {quickAccessItems.map((item, index) => (
            <View key={index} style={styles.gridWrapper}>
              <TouchableOpacity style={styles.gridItem} activeOpacity={0.6}
              onPress={() => {
                  if (item.screen) {
                    navigation.navigate(item.screen, { instructor });
                  } else {
                    console.warn(`No screen defined for ${item.label}`);
                  }
                }}
                >  
                <Ionicons name={item.name} size={32} color={item.color} />
              </TouchableOpacity>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
  },
  card: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  idText: {
    color: '#E2E8F0',
    fontSize: 15,
    marginTop: 2,
  },
  profileCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  majorBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  majorText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statBox: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 18,
    color: '#1E293B',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gridWrapper: {
    width: '30%',
    marginRight: '3.3%', // This creates a slight gap so the 3rd item fits perfectly
    alignItems: 'center',
    marginBottom: 20,
  },
  gridItem: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  gridLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
});