import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../config/api';

export default function InstructorSchedule({ navigation, route }) {
  const { instructor } = route.params;
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [scheduleData, setScheduleData] = useState({
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: []
  });
  const [loading, setLoading] = useState(true);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const colors = ['#1a365d', '#42A5F5', '#66BB6A', '#FF7043', '#AB47BC', '#EF5350', '#26C6DA', '#FFA726'];

  const dayMap = {
    'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed',
    'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat'
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  useFocusEffect(
    useCallback(() => {
      const fetchSchedule = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/api/instructors/${instructor.id}/courses`);

          if (res.data.success) {
            const grouped = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };
            const colorMap = {};
            let colorIndex = 0;

            res.data.data.forEach(course => {
              // Assign consistent color per course
              if (!colorMap[course.course_id]) {
                colorMap[course.course_id] = colors[colorIndex % colors.length];
                colorIndex++;
              }

              course.schedules.forEach(s => {
                const day = dayMap[s.day] || s.day.slice(0, 3);
                if (grouped[day]) {
                  grouped[day].push({
                    time: `${formatTime(s.start)} - ${formatTime(s.end)}`,
                    course: course.course_name,
                    code: course.course_id,
                    section: `Sec ${course.section_code}`,
                    room: s.room
                      ? (s.building ? `${s.room}, ${s.building}` : s.room)
                      : 'Room TBD',
                    type: course.type || 'Lecture',
                    color: colorMap[course.course_id],
                  });
                }
              });
            });

            // Sort each day by time
            Object.keys(grouped).forEach(day => {
              grouped[day].sort((a, b) => {
                const toMinutes = (time) => {
                  if (!time) return 0;
                  const [h, m] = time.split(':').map(Number);
                  return h * 60 + m;
                };
                return toMinutes(a.rawStart) - toMinutes(b.rawStart);
              });
            });

            setScheduleData(grouped);
          }
        } catch (error) {
          console.error('Error fetching instructor schedule:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchSchedule();
    }, [instructor.id])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teaching Schedule</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Day Picker */}
      <View style={styles.dayPicker}>
        {days.map((day) => (
          <TouchableOpacity
            key={day}
            onPress={() => setSelectedDay(day)}
            style={[styles.dayButton, selectedDay === day && styles.activeDayButton]}
          >
            <Text style={[styles.dayText, selectedDay === day && styles.activeDayText]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Schedule List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2b6cb0" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {scheduleData[selectedDay]?.length > 0 ? (
            scheduleData[selectedDay].map((item, index) => (
              <View key={index} style={styles.classCard}>
                <View style={[styles.typeIndicator, { backgroundColor: item.color }]}>
                  <Text style={styles.typeText}>{item.type}</Text>
                </View>

                <View style={styles.cardMain}>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text style={styles.timeLabel}>{item.time}</Text>
                  </View>

                  <Text style={styles.courseTitle}>{item.course}</Text>

                  <View style={styles.detailsRow}>
                    <View style={styles.detailTag}>
                      <Text style={styles.tagText}>{item.code}</Text>
                    </View>
                    <View style={styles.detailTag}>
                      <Text style={styles.tagText}>{item.section}</Text>
                    </View>
                  </View>

                  <View style={styles.footerRow}>
                    <View style={styles.locationInfo}>
                      <Ionicons name="location" size={16} color="#EF5350" />
                      <Text style={styles.locationText}>{item.room}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cafe-outline" size={80} color="#E2E8F0" />
              <Text style={styles.emptyText}>No classes today. Enjoy your break!</Text>
            </View>
          )}
        </ScrollView>
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
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  dayPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  dayButton: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  activeDayButton: { backgroundColor: '#1a365d' },
  dayText: { fontWeight: '700', color: '#94A3B8', fontSize: 12 },
  activeDayText: { color: '#FFF' },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  classCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  typeIndicator: { paddingVertical: 4, alignItems: 'center' },
  typeText: { color: '#FFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  cardMain: { padding: 16 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timeLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginLeft: 5 },
  courseTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
  detailsRow: { flexDirection: 'row', marginBottom: 15 },
  detailTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  tagText: { fontSize: 11, color: '#475569', fontWeight: '700' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  locationInfo: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginLeft: 5 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 15, color: '#94A3B8', fontSize: 16 },
});