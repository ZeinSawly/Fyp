import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import api from '../../config/api';

import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StudentSchedule({navigation, route}) {
  const { student } = route.params;

  const [selectedDay, setSelectedDay] = useState('Mon');
  const [scheduleData, setScheduleData] = useState({});

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  useFocusEffect(
    useCallback(() => {
      api
        .get(`/api/students/${student.id}/schedule`)
        .then(res => setScheduleData(res.data))
        .catch(err => console.log('Error fetching schedule', err));
    }, [student.id])
  );

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={{ width: 28 }} /> 
      </View>

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {scheduleData[selectedDay]?.length > 0 ? (
          scheduleData[selectedDay].map((item, index) => (
            <View key={index} style={styles.classCard}>
              <View style={[styles.colorStrip, { backgroundColor: item.color }]} />
              <View style={styles.cardInfo}>
                <Text style={styles.timeText}>{item.time}</Text>
                <Text style={styles.courseText}>{item.course}</Text>
                <View style={styles.roomRow}>
                  <Ionicons name="location-outline" size={14} color="#94A3B8" />
                  <Text style={styles.roomText}>{item.room}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-vertical" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={80} color="#E2E8F0" />
            <Text style={styles.emptyText}>No classes scheduled for today.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
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
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  activeDayButton: {
    backgroundColor: '#1a365d',
  },
  dayText: {
    fontWeight: '700',
    color: '#94A3B8',
  },
  activeDayText: {
    color: '#FFF',
  },
  scrollContent: {
    padding: 20,
  },
  classCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    flexDirection: 'row',
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  colorStrip: {
    width: 6,
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    padding: 15,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  courseText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },
  moreButton: {
    justifyContent: 'center',
    paddingRight: 10,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    color: '#94A3B8',
    fontSize: 16,
  },
});