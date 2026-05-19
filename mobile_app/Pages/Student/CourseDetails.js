import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function CourseDetails({ route, navigation }) {
  const { course, student } = route?.params || {};
  const [schedules, setSchedules] = useState([]);
  const [combinedSchedules, setCombinedSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCartSection, setAddingToCartSection] = useState(null);
  const [cartSectionIds, setCartSectionIds] = useState(new Set());
  const [enrolledSectionIds, setEnrolledSectionIds] = useState(new Set()); // Add this state

  useEffect(() => {
    if (!course?.id || !student?.id) {
      setLoading(false);
      return;
    }
    fetchCourseSchedule();
  }, []);

  const fetchCourseSchedule = async () => {
    try {
      const response = await api.get(`/api/students/course/${course.id}/schedule`, {
        params: { student_id: student.id }
      })
      const data = response.data;
      
      if (data.success) {
        setSchedules(data.data);
        const combined = combineSessions(data.data);
        setCombinedSchedules(combined);
        
        // Get sections in cart
        const inCartSections = (data.data || [])
          .filter((item) => Number(item.is_in_cart) === 1)
          .map((item) => item.section_id)
          .filter(Boolean);
        setCartSectionIds(new Set(inCartSections));
        
        // ✅ Get sections the student is already enrolled in
        const enrolledSections = (data.data || [])
          .filter((item) => Number(item.is_enrolled) === 1)
          .map((item) => item.section_id)
          .filter(Boolean);
        setEnrolledSectionIds(new Set(enrolledSections));
      } else {
        setSchedules([]);
        setCombinedSchedules([]);
        setCartSectionIds(new Set());
        setEnrolledSectionIds(new Set());
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setSchedules([]);
      setCombinedSchedules([]);
      setCartSectionIds(new Set());
      setEnrolledSectionIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (section_id) => {
    if (!section_id) {
      Alert.alert('Error', 'Invalid section selected.');
      return;
    }

    setAddingToCartSection(section_id);
    try {
      const res = await api.post('/api/students/cart/add', {
        student_id: student.id,
        course_id: course.id,
        section_id: section_id,
      });
  
      const data = await res.data;
  
      if (data.success) {
        Alert.alert('Success', 'Course added to cart successfully!');
        setCartSectionIds((prev) => {
          const next = new Set(prev);
          next.add(section_id);
          return next;
        });
      } else {
        Alert.alert('Error', data.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Server error. Please try again later.');
    } finally {
      setAddingToCartSection(null);
    }
  };

  // Function to combine back-to-back sessions on the same day
  const combineSessions = (sessions) => {
    if (!sessions || sessions.length === 0) return [];
    
    // Group sessions by day
    const sessionsByDay = {};
    sessions.forEach(session => {
      if (!sessionsByDay[session.day_of_week]) {
        sessionsByDay[session.day_of_week] = [];
      }
      sessionsByDay[session.day_of_week].push(session);
    });
    
    const combined = [];
    
    for (const [day, daySessions] of Object.entries(sessionsByDay)) {
      // Sort by start time
      daySessions.sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      let currentBlock = {
        day_of_week: day,
        start_time: daySessions[0].start_time,
        end_time: daySessions[0].end_time,
        sessions: [daySessions[0]],
        room: daySessions[0].room,
        building: daySessions[0].building,
        instructor_name: daySessions[0].instructor_name || 'TBA',
        section_id: daySessions[0].section_id,
        section_code: daySessions[0].section_code,
        seats: daySessions[0].seats,
      };
      
      // Check for consecutive sessions
      for (let i = 1; i < daySessions.length; i++) {
        const prevSession = daySessions[i - 1];
        const currentSession = daySessions[i];
        
        // Calculate gap between sessions (in minutes)
        const prevEnd = new Date(`1970-01-01T${prevSession.end_time}`);
        const currentStart = new Date(`1970-01-01T${currentSession.start_time}`);
        const gapMinutes = (currentStart - prevEnd) / (1000 * 60);
        
        // If gap is 30 minutes or less, combine them (typical break time)
        if (gapMinutes <= 30 && currentSession.room === prevSession.room) {
          // Extend the current block to include this session
          currentBlock.end_time = currentSession.end_time;
          currentBlock.sessions.push(currentSession);
        } else {
          // Push the completed block and start a new one
          combined.push({ ...currentBlock });
          currentBlock = {
            day_of_week: day,
            start_time: currentSession.start_time,
            end_time: currentSession.end_time,
            sessions: [currentSession],
            room: currentSession.room,
            building: currentSession.building,
            instructor_name: currentSession.instructor_name || 'TBA',
            section_id: currentSession.section_id,
            section_code: currentSession.section_code,
            seats: currentSession.seats,
          };
        }
      }
      
      // Push the last block
      combined.push(currentBlock);
    }
    
    return combined;
  };

  const formatTimeRange = (start, end) => {
    const formatTime = (time) => {
      if (!time) return 'TBD';
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };
    
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const getDayColor = (day) => {
    const colors = {
      'Monday': '#FF6B6B',
      'Tuesday': '#4ECDC4',
      'Wednesday': '#45B7D1',
      'Thursday': '#96CEB4',
      'Friday': '#FFEEAD',
      'Saturday': '#D4A5A5',
      'Sunday': '#9B59B6'
    };
    return colors[day] || '#95A5A6';
  };

  const ScheduleCard = ({ schedule }) => {
    // Check if THIS specific section is enrolled
    const isThisSectionEnrolled = enrolledSectionIds.has(schedule.section_id);
    const isInCart = cartSectionIds.has(schedule.section_id);
    const isAddingThisSection = addingToCartSection === schedule.section_id;
    
    const isDisabled =
      isAddingThisSection ||
      isThisSectionEnrolled ||
      isInCart ||
      !schedule.section_id;

    let buttonText = 'Add';
    if (isThisSectionEnrolled) buttonText = 'Enrolled';
    else if (isInCart) buttonText = 'In Cart';
    else if (isAddingThisSection) buttonText = 'Adding...';

    return (
      <View style={styles.scheduleCard}>
        <View style={[styles.dayBadge, { backgroundColor: getDayColor(schedule.day_of_week) }]}>
          <Text style={styles.dayText}>{schedule.day_of_week.slice(0, 3)}</Text>
        </View>
        <View style={styles.scheduleDetails}>
          <Text style={styles.scheduleTime}>
            {formatTimeRange(schedule.start_time, schedule.end_time)}
          </Text>
          <Text style={styles.scheduleLocation}>
            {schedule.room && schedule.building 
              ? `${schedule.room}, ${schedule.building}`
              : schedule.room || schedule.building || 'Location TBD'}
          </Text>
          <View style={styles.instructorContainer}>
            <Ionicons name="person-outline" size={14} color="#64748B" />
            <Text style={styles.instructorName}>
              {schedule.instructor_name !== 'TBA' 
                ? `Instructor: ${schedule.instructor_name}` 
                : 'Instructor: To Be Assigned'}
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <Ionicons name="people-outline" size={14} color="#64748B" />
            <Text style={styles.sectionText}>
            Available Seats: {schedule.seats || 'N/A'}
            </Text>
          </View>
    
          {schedule.section_code && (
            <View style={styles.sectionContainer}>
              <Ionicons name="book-outline" size={14} color="#64748B" />
              <Text style={styles.sectionText}>
                Section: {schedule.section_code}
              </Text>
            </View>
          )}
          
          {schedule.sessions && schedule.sessions.length > 1 && (
            <View style={styles.breakInfo}>
              <Ionicons name="time-outline" size={12} color="#64748B" />
              <Text style={styles.breakText}>
                Includes {schedule.sessions.length} sessions with break
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addToCartButton, isDisabled && styles.addToCartButtonDisabled]}
          onPress={() => handleAddToCart(schedule.section_id)}
          disabled={isDisabled}
        >
          <Ionicons name="cart-outline" size={14} color="#FFF" />
          <Text style={styles.addToCartText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a365d" />
          <Text style={styles.loadingText}>Loading course details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!course || !student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Unable to load course details.</Text>
          <TouchableOpacity style={styles.viewCartButton} onPress={() => navigation.goBack()}>
            <Text style={styles.viewCartText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Course Info */}
        <View style={styles.courseInfoCard}>
          <View style={styles.courseCodeContainer}>
            <Text style={styles.courseCode}>{course.id}</Text>
            <View style={[
              styles.statusBadge,
              course.status === 'enrolled' && styles.enrolledStatus,
              course.status === 'in_cart' && styles.cartStatus,
              course.status === 'available' && styles.availableStatus
            ]}>
              <Text style={styles.statusText}>
                {course.status === 'enrolled' ? 'Enrolled' : 
                 course.status === 'in_cart' ? 'In Cart' : 'Available'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.courseName}>{course.name}</Text>
          <View style={styles.creditsContainer}>
            <Ionicons name="book-outline" size={16} color="#64748B" />
            <Text style={styles.creditsText}>{course.credits} Credits</Text>
          </View>
          
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.description}>
            {course.description || 'No description available for this course.'}
          </Text>
        </View>

        {/* Schedule Section - Combined Blocks */}
        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={22} color="#1a365d" />
            <Text style={styles.sectionTitle}>Class Schedule</Text>
          </View>
          
          {combinedSchedules.length > 0 ? (
            <View style={styles.scheduleList}>
              {combinedSchedules.map((schedule, index) => (
                <ScheduleCard key={index} schedule={schedule} />
              ))}
            </View>
          ) : (
            <View style={styles.noScheduleCard}>
              <Ionicons name="time-outline" size={40} color="#CBD5E1" />
              <Text style={styles.noScheduleText}>Schedule not available yet</Text>
              <Text style={styles.noScheduleSubtext}>Check back later for class times</Text>
            </View>
          )}
        </View>

        {/* Show warning if enrolled in a different section */}
        {enrolledSectionIds.size > 0 && combinedSchedules.length > 0 && (
          <View style={styles.warningCard}>
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              You are already enrolled in another section of this course. You can add a different section to your cart and then use the Swap feature to change sections.
            </Text>
          </View>
        )}
        
        {/* Add some bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  courseInfoCard: {
    backgroundColor: '#FFF',
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  courseCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C6BC0',
  },
  instructorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  instructorName: {
    fontSize: 13,
    color: '#5C6BC0',
    fontWeight: '500',
  },
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sectionText: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enrolledStatus: {
    backgroundColor: '#C8E6C9',
  },
  cartStatus: {
    backgroundColor: '#FFF3E0',
  },
  availableStatus: {
    backgroundColor: '#E3F2FD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  creditsText: {
    fontSize: 14,
    color: '#64748B',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  scheduleSection: {
    margin: 20,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  scheduleList: {
    gap: 12,
  },
  scheduleCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dayBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleDetails: {
    flex: 1,
    marginRight: 8,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  scheduleLocation: {
    fontSize: 12,
    color: '#64748B',
  },
  breakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  breakText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  addToCartButton: {
    backgroundColor: '#2b6cb0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 65,
    justifyContent: 'center',
  },
  addToCartButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noScheduleCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  noScheduleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
  },
  noScheduleSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  actionSection: {
    margin: 20,
    marginTop: 0,
  },
  inCartCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  inCartContent: {
    flex: 1,
  },
  inCartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  inCartText: {
    fontSize: 13,
    color: '#92400E',
  },
  viewCartButton: {
    backgroundColor: '#F59E0B',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewCartText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  enrolledCard: {
    backgroundColor: '#C8E6C9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  enrolledTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  enrolledText: {
    fontSize: 13,
    color: '#1B5E20',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    margin: 20,
    marginTop: 0,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
});