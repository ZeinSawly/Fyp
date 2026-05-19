import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, FlatList,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function GradeComponents({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [components, setComponents] = useState([]);
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [maxGrade, setMaxGrade] = useState('');
  const [weight, setWeight] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/api/admin/courses');
      if (res.data.success) setCourses(res.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load courses');
    }
  };

  const fetchComponents = async (course) => {
    setSelectedCourse(course);
    setCourseModalVisible(false);
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/grade-component/${course.id}`);
      if (res.data.success) setComponents(res.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const totalWeight = components.reduce((sum, c) => sum + parseFloat(c.weight), 0);

  const handleAdd = async () => {
    if (!selectedCourse || !name || !maxGrade || !weight) {
      Alert.alert('Validation Error', 'Please fill all fields and select a course.');
      return;
    }

    if (parseFloat(weight) <= 0 || parseFloat(maxGrade) <= 0) {
      Alert.alert('Validation Error', 'Grade and weight must be greater than 0.');
      return;
    }

    setAdding(true);
    try {
      await api.post('/api/admin/grade-component', {
        course_id: selectedCourse.id,
        name,
        max_grade: parseFloat(maxGrade),
        weight: parseFloat(weight),
      });

      Alert.alert('Success', 'Grade component added!');
      setName('');
      setMaxGrade('');
      setWeight('');
      fetchComponents(selectedCourse);

    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add component');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (component) => {
    Alert.alert(
      'Delete Component',
      `Are you sure you want to delete "${component.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/admin/grade-component/${component.id}`);
              fetchComponents(selectedCourse);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete component');
            }
          }
        }
      ]
    );
  };

  const getWeightColor = () => {
    if (totalWeight === 100) return '#2f855a';
    if (totalWeight > 100) return '#c53030';
    return '#d97706';
  };

  return (
    <LinearGradient colors={['#edf2f7', '#f8fafc']} style={styles.container}>

      {/* Header */}
      <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.gradientHeaderTitle}>Grade Components</Text>
            <Text style={styles.gradientHeaderSubtitle}>Set up grading structure per course</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Course selector */}
          <TouchableOpacity style={styles.courseSelector} onPress={() => setCourseModalVisible(true)}>
            <Text style={selectedCourse ? styles.courseSelectorSelected : styles.courseSelectorPlaceholder}>
              {selectedCourse ? selectedCourse.name : 'Select a course'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#718096" />
          </TouchableOpacity>

          {selectedCourse && (
            <>
              {/* Weight tracker */}
              <View style={styles.weightTracker}>
                <View style={styles.weightBar}>
                  <View style={[
                    styles.weightFill,
                    {
                      width: `${Math.min(totalWeight, 100)}%`,
                      backgroundColor: getWeightColor()
                    }
                  ]} />
                </View>
                <Text style={[styles.weightText, { color: getWeightColor() }]}>
                  {totalWeight}% / 100% used
                </Text>
              </View>

              {/* Existing components */}
              {loading ? (
                <ActivityIndicator size="large" color="#2b6cb0" style={{ marginTop: 20 }} />
              ) : (
                <View style={styles.componentsList}>
                  {components.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="document-outline" size={40} color="#CBD5E1" />
                      <Text style={styles.emptyText}>No components yet</Text>
                    </View>
                  ) : (
                    components.map((comp, index) => (
                      <View key={index} style={styles.componentCard}>
                        <View style={styles.componentLeft}>
                          <Text style={styles.componentName}>{comp.name}</Text>
                          <Text style={styles.componentMeta}>
                            Max: {comp.max_grade} pts • Weight: {comp.weight}%
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDelete(comp)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF5350" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Add new component form */}
              {totalWeight < 100 && (
                <View style={styles.form}>
                  <Text style={styles.formTitle}>Add Component</Text>

                  <Text style={styles.inputLabel}>Component Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Midterm, Final Exam, Classwork"
                    placeholderTextColor="#a0aec0"
                    value={name}
                    onChangeText={setName}
                  />

                  <View style={styles.inputRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Max Grade</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 100"
                        placeholderTextColor="#a0aec0"
                        value={maxGrade}
                        onChangeText={setMaxGrade}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.inputLabel}>Weight (%)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={`Max ${100 - totalWeight}%`}
                        placeholderTextColor="#a0aec0"
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.addButton, adding && { opacity: 0.6 }]}
                    onPress={handleAdd}
                    disabled={adding}
                  >
                    <LinearGradient colors={['#2b6cb0', '#4299e1']} style={styles.addGradient}>
                      {adding
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Ionicons name="add-circle-outline" size={20} color="#fff" />
                      }
                      <Text style={styles.addText}>
                        {adding ? 'Adding...' : 'Add Component'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {totalWeight === 100 && (
                <View style={styles.completeBanner}>
                  <Ionicons name="checkmark-circle" size={22} color="#2f855a" />
                  <Text style={styles.completeText}>
                    Grade structure complete! Total weight = 100%
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Course Modal */}
      <Modal animationType="slide" transparent visible={courseModalVisible} onRequestClose={() => setCourseModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Course</Text>
              <TouchableOpacity onPress={() => setCourseModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={courses}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => fetchComponents(item)}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  <Text style={styles.modalItemId}>{item.id}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientHeader: {
    paddingTop: 70,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    position: 'absolute', left: 0,
  },
  headerTextContainer: { alignItems: 'center', paddingHorizontal: 50 },
  gradientHeaderTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  gradientHeaderSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6, textAlign: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  courseSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 14, borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 16, elevation: 2,
  },
  courseSelectorPlaceholder: { color: '#a0aec0', fontSize: 15 },
  courseSelectorSelected: { color: '#2d3748', fontSize: 15, fontWeight: '600', flex: 1 },
  weightTracker: { marginBottom: 16 },
  weightBar: {
    height: 8, backgroundColor: '#E2E8F0', borderRadius: 4,
    overflow: 'hidden', marginBottom: 6,
  },
  weightFill: { height: '100%', borderRadius: 4 },
  weightText: { fontSize: 13, fontWeight: '600' },
  componentsList: { marginBottom: 20 },
  componentCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
  },
  componentLeft: { flex: 1 },
  componentName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  componentMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { color: '#94A3B8', marginTop: 8, fontSize: 14 },
  form: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10,
  },
  formTitle: { fontSize: 16, fontWeight: '800', color: '#1a365d', marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#4a5568', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    backgroundColor: '#f8fafc', color: '#2d3748', marginBottom: 14,
  },
  inputRow: { flexDirection: 'row' },
  addButton: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  addGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8,
  },
  addText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  completeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#C6F6D5', padding: 16, borderRadius: 14, marginTop: 16,
  },
  completeText: { color: '#2f855a', fontWeight: '700', fontSize: 14, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%', minHeight: '30%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a365d' },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, paddingHorizontal: 20,
  },
  modalItemText: { fontSize: 15, color: '#2d3748', fontWeight: '600' },
  modalItemId: { fontSize: 12, color: '#94A3B8' },
  separator: { height: 1, backgroundColor: '#E2E8F0', marginLeft: 20 },
});