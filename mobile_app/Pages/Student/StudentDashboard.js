import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function StudentDashboard({navigation, route}) {
  
  const {student} = route.params;

  const quickAccessItems = [
    { name: 'calendar', color: '#5C6BC0', label: 'Schedule', screen: 'StudentSchedule' },
    { name: 'book', color: '#66BB6A', label: 'Courses', screen: 'StudentCourses' },
    { name: 'school', color: '#42A5F5', label: 'Manage Classes', screen: 'ManageClasses' },
    { name: 'person-circle-outline', color: '#AB47BC', label: 'Profile', screen: 'StudentProfile' },
    { name: 'wallet', color: '#FFA726', label: 'Financial Account', screen: 'FinancialAccount' },
    { name: 'ribbon-outline', color: '#8B5CF6', label: 'Grades', screen: 'StudentGrades' },
    { name: 'calendar-number-outline', color: '#EF5350', label: 'Attendance', screen: 'StudentAttendance' },
    { name: 'document-text-outline', color: '#0EA5E9', label: 'Transcript', screen: 'Transcript' },
    { name: 'bulb-outline', color: '#F59E0B', label: 'Career Quiz', screen: 'QuizIntro' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.card} >
          <View style={styles.topSection}>
            <View>
              <Text style={styles.nameText}>{student.name}</Text>
              <Text style={styles.idText}>{student.id}</Text>
            </View>
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={40} color="#BDC3C7" />
            </View>
          </View>
          
          <View style={styles.majorBadge}>
            <Text style={styles.majorText}>{student.major}</Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
            
          <View style={styles.statBox} activeOpacity={0.6}>
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="trending-up-outline" size={28} color="#1a3c6d" />
            </View>
            <Text style={styles.statValue}>{student.gpa}</Text>
            <Text style={styles.statLabel}>Current GPA</Text>
          </View>

          <View style={styles.statBox} activeOpacity={0.6}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="ribbon-outline" size={28} color="#2E7D32" />
            </View>
            <Text style={styles.statValue}>{student.completed_credits}/{student.total_credits}</Text>
            <Text style={styles.statLabel}>Credits Completed</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Quick Access</Text>
        
        <View style={styles.gridContainer}>

          {quickAccessItems.map((item, index) => (

            <View key={index} style={styles.gridWrapper}>
              <TouchableOpacity style={styles.gridItem} activeOpacity={0.6} 
              onPress={() => {
                  if (item.screen) {
                    navigation.navigate(item.screen, { student: student });
                  } else {
                    console.warn(`No screen defined for ${item.label}`);
                  }
                }}>
                <Ionicons name={item.name} size={30} color={item.color} />
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
    shadowColor: '#1a3c6d',
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
    color: '#D1D5DB',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    width: '47%',
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
    justifyContent: 'space-between',
  },
  gridWrapper: {
    width: '30%',
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
    lineHeight: 14,
  },
});