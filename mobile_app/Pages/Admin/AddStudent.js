import React, { useState, useEffect  } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,Platform,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import api from '../../config/api';

export default function AddStudent({ navigation, route }) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [majorId, setMajorId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [campus, setCampus] = useState('Baabda');
  const [campusOpen, setCampusOpen] = useState(false);
  const [campusItems, setCampusItems] = useState([
    { label: 'Baabda', value: 'Baabda' },
    { label: 'Nabi Ayla - Zahle', value: 'Nabi Ayla - Zahle' },
    { label: 'Mejdlaya', value: 'Mejdlaya' },
  ]);

  // Validate date format (YYYY-MM-DD)
  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  // Check if ID is numeric (adjust based on your ID format)
  const isValidId = (idString) => {
    return /^\d+$/.test(idString); // Only numbers
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!name || !id || !password || !dob || !enrollmentDate || !majorId) {
      Alert.alert('Validation Error', 'Please fill all fields.');
      return;
    }

    // Validate ID format
    if (!isValidId(id)) {
      Alert.alert('Validation Error', 'Student ID must contain only numbers');
      return;
    }

    // Validate date formats
    if (!isValidDate(dob)) {
      Alert.alert('Validation Error', 'Please enter Date of Birth in YYYY-MM-DD format (e.g., 2000-01-15)');
      return;
    }

    if (!isValidDate(enrollmentDate)) {
      Alert.alert('Validation Error', 'Please enter Enrollment Date in YYYY-MM-DD format (e.g., 2023-09-01)');
      return;
    }

    // Validate Major ID is numeric
    if (!isValidId(majorId)) {
      Alert.alert('Validation Error', 'Major ID must contain only numbers');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending data:', {
        name,
        id,
        password,
        dob,
        enrollment_date: enrollmentDate,
        major_id: majorId,
      });

      const res = await api.post( `/api/admin/add-student`, {
          name,
          id,
          password,
          dob,
          enrollment_date: enrollmentDate,
          major_id: majorId,
          email,
          phone, 
          campus,
        },
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      Alert.alert('Success', res.data.message || 'Student added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('AdminDashboard'),
        },
      ]);
    } catch (err) {
      // Avoid noisy logs on expected validation errors (e.g. 400 duplicate ID)
      // so the user only sees the Alert popup.
      const status = err?.response?.status;
      const shouldLog = status !== 400;
      if (shouldLog) console.error('AddStudent error:', err);
      
      if (err.code === 'ECONNABORTED') {
        Alert.alert('Error', 'Connection timeout. Please check your network.');
      } else if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (shouldLog) {
          console.error('Error response data:', err.response.data);
          console.error('Error response status:', err.response.status);
        }
        
        let errorMessage = err.response.data?.message || 'Database error occurred';
        
        // Handle specific error cases
        if (err.response.status === 400) {
          if (errorMessage.includes('Major does not exist')) {
            errorMessage = 'The Major ID you entered does not exist. Please check and try again.';
          } else if (errorMessage.includes('Student already exists')) {
            errorMessage = 'A student with this ID already exists.';
          }
        } else if (err.response.status === 500) {
          // Some constraint/transaction errors may still contain a useful message.
          if (errorMessage.includes('Student already exists')) {
            errorMessage = 'A student with this ID already exists.';
          } else if (errorMessage.includes('Duplicate') || errorMessage.includes('ER_DUP_ENTRY')) {
            errorMessage = 'A student with this ID already exists.';
          } else {
            errorMessage = 'Server error. Please check your database connection and try again.';
          }
        }
        
        Alert.alert('Error', errorMessage);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        Alert.alert('Error', 'No response from server. Please check if the server is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        Alert.alert('Error', err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMajors = async () => {
      const res = await api.get(`/api/admin/majors`);
  
      const formatted = res.data.map((m) => ({
        label: m.name,
        value: m.id,
      }));
  
      setItems(formatted);
    };
  
    fetchMajors();
  }, []);

  return (
    <LinearGradient colors={['#edf2f7', '#f8fafc']} style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#1a365d', '#2b6cb0']}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.gradientHeaderTitle}>Add New Student</Text>
            <Text style={styles.gradientHeaderSubtitle}>
              Create a new student account
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
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
        >
        {/* Form Section Header */}
        <View style={styles.formHeader}>
          <Text style={styles.formHeaderTitle}>Student Information</Text>
          <Text style={styles.formHeaderSubtitle}>
            Fill in the details below to register a new student
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter student's full name"
              placeholderTextColor="#a0aec0"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Student ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter student ID (numbers only)"
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
              placeholder="student@ua.edu.lb"
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
            <Text style={styles.inputLabel}>Campus</Text>
            <DropDownPicker
              open={campusOpen}
              value={campus}
              items={campusItems}
              setOpen={setCampusOpen}
              setValue={setCampus}
              setItems={setCampusItems}
              placeholder="Select Campus"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownBox}
              zIndex={2000} // Higher than Major dropdown to avoid overlap
              zIndexInverse={2000}
              listMode="SCROLLVIEW"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#a0aec0"
                value={dob}
                onChangeText={setDob}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Enrollment Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#a0aec0"
                value={enrollmentDate}
                onChangeText={setEnrollmentDate}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Major</Text>

            <DropDownPicker
              open={open}
              value={majorId}
              items={items}
              setOpen={setOpen}
              setValue={setMajorId}
              setItems={setItems}
              placeholder="Select Major"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownBox}
              zIndex={1000}
              zIndexInverse={3000}
              listMode="SCROLLVIEW"
            />
          
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={['#2b6cb0', '#4299e1']}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="add-circle-outline" size={22} color="#fff" />
              )}
              <Text style={styles.submitText}>
                {loading ? 'Adding Student...' : 'Add Student'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  
  gradientHeader: {
    paddingTop: 70,
    paddingBottom: 40,
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  
  gradientHeaderSubtitle: {
    fontSize: 14,
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
    marginBottom: 16,
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
  
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropdown: {
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  
  dropdownBox: {
    borderColor: '#e2e8f0',
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
  
  submitButtonDisabled: {
    opacity: 0.6,
  },
  
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
});