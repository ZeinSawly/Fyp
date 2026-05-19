import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function AddInstructor({ navigation }) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  useEffect(() => {
    const fetchDepartments = async() => {
      try {
        console.log('Fetching departments...');
        const response = await api.get(`/api/admin/departments`);
        console.log('Departments loaded:', response.data);
        setDepartments(response.data);
      } catch (error){
        console.error('Error fetching departments: ', error);
        Alert.alert('Error', 'Could not load department list');
      }
    };

    fetchDepartments();
  }, []);

  const isValidId = idString => /^\d+$/.test(idString);

  const isValidDate = dateString => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const handleSelectDepartment = (deptId, deptName) => {
    setDepartment(deptId);
    setDepartmentName(deptName);
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!name || !id || !password || !dob || !department) {
      Alert.alert('Validation Error', 'Please fill all fields.');
      return;
    }

    if (!isValidId(id)) {
      Alert.alert('Validation Error', 'Instructor ID must contain only numbers');
      return;
    }

    if (!isValidDate(dob)) {
      Alert.alert(
        'Validation Error',
        'Please enter Date of Birth in YYYY-MM-DD format (e.g., 2000-01-15)'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(
        `/api/admin/add-instructor`,
        { 
          id: parseInt(id), 
          name, 
          password, 
          dob, 
          department: parseInt(department) ,
          email,
          phone
        },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      Alert.alert('Success', res.data.message || 'Instructor added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('AdminDashboard'),
        },
      ]);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 400 && message?.includes('Instructor already exists')) {
        Alert.alert('Error', 'An instructor with this ID already exists.');
      } else if (status === 400 && message) {
        Alert.alert('Error', message);
      } else if (status === 500) {
        Alert.alert('Error', 'Server error. Please check your database connection and try again.');
      } else {
        Alert.alert('Error', message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#edf2f7', '#f8fafc']} style={styles.container}>
      <LinearGradient
        colors={['#1a365d', '#2b6cb0']}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.gradientHeaderTitle}>Add Instructor</Text>
            <Text style={styles.gradientHeaderSubtitle}>
              Create an instructor account
            </Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formHeader}>
            <Text style={styles.formHeaderTitle}>Instructor Information</Text>
            <Text style={styles.formHeaderSubtitle}>
              Fill in the details below to register a new instructor
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter instructor name"
                placeholderTextColor="#a0aec0"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Instructor ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter instructor ID (numbers only)"
                placeholderTextColor="#a0aec0"
                value={id}
                onChangeText={setId}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>University Email</Text>
              <TextInput
                style={styles.input}
                placeholder="instructor@ua.edu.lb"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#a0aec0"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="01-555-444"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#a0aec0"
                value={dob}
                onChangeText={setDob}
              />
            </View>

            {/* Department Selector with Modal */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Department</Text>
              <TouchableOpacity 
                style={styles.departmentSelector}
                onPress={() => setModalVisible(true)}
              >
                <Text style={department ? styles.selectedDeptText : styles.placeholderText}>
                  {departmentName || "Select Department"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#718096" />
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#2b6cb0', '#4299e1']}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="person-add-outline" size={22} color="#fff" />
                )}
                <Text style={styles.submitText}>
                  {loading ? 'Adding Instructor...' : 'Add Instructor'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Department Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Department</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={departments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectDepartment(item.id.toString(), item.name)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {department === item.id.toString() && (
                    <Ionicons name="checkmark" size={20} color="#2b6cb0" />
                  )}
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
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#1a365d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    position: 'relative',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
  },
  headerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
  },
  gradientHeaderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  gradientHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formHeader: {
    marginBottom: 20,
  },
  formHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a365d',
  },
  formHeaderSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputGroup: { 
    marginBottom: 16 
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    color: '#2d3748',
  },
  departmentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
  },
  placeholderText: {
    color: '#a0aec0',
    fontSize: 15,
  },
  selectedDeptText: {
    color: '#2d3748',
    fontSize: 15,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#2b6cb0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  modalItemText: {
    fontSize: 16,
    color: '#2d3748',
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginLeft: 20,
  },
});