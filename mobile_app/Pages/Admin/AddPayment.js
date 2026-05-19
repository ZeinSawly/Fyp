import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Modal, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function AddPayment({ navigation }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState('tuition');
  const [majors, setMajors] = useState([]);
  const [majorId, setMajorId] = useState('');
  const [majorName, setMajorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);

  const paymentTypes = [
    { label: 'Tuition', value: 'tuition' },
    { label: 'Registration', value: 'registration' },
    { label: 'Library Fee', value: 'library' },
    { label: 'Lab Fee', value: 'lab' },
    { label: 'Other', value: 'other' },
  ];

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const res = await api.get('/api/admin/majors');
        setMajors(res.data);
      } catch (error) {
        Alert.alert('Error', 'Could not load majors');
      }
    };
    fetchMajors();
  }, []);

  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const handleSubmit = async () => {
    if (!majorId || !description || !amount || !dueDate) {
      Alert.alert('Validation Error', 'Please fill all fields.');
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    if (!isValidDate(dueDate)) {
      Alert.alert('Validation Error', 'Please enter due date in YYYY-MM-DD format.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/admin/add-payment', {
        major_id: majorId,
        type,
        description,
        due_date: dueDate,
        amount: parseFloat(amount),
      });

      Alert.alert(
        'Success',
        res.data.message,
        [{ text: 'OK', onPress: () => navigation.navigate('AdminDashboard') }]
      );
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#edf2f7', '#f8fafc']} style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.gradientHeaderTitle}>Add Payment</Text>
            <Text style={styles.gradientHeaderSubtitle}>Assign payment to a major</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.formHeader}>
            <Text style={styles.formHeaderTitle}>Payment Details</Text>
            <Text style={styles.formHeaderSubtitle}>
              This payment will be assigned to all students in the selected major
            </Text>
          </View>

          <View style={styles.form}>

            {/* MAJOR SELECTOR */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Major</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
                <Text style={majorId ? styles.selectedText : styles.placeholderText}>
                  {majorName || 'Select Major'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#718096" />
              </TouchableOpacity>
            </View>

            {/* PAYMENT TYPE SELECTOR */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Type</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setTypeModalVisible(true)}>
                <Text style={styles.selectedText}>
                  {paymentTypes.find(t => t.value === type)?.label || 'Tuition'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#718096" />
              </TouchableOpacity>
            </View>

            {/* DESCRIPTION */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. First Semester Tuition 2024-2025"
                placeholderTextColor="#a0aec0"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* AMOUNT */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2500.00"
                placeholderTextColor="#a0aec0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            {/* DUE DATE */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Due Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#a0aec0"
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>

            {/* SUBMIT */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient colors={['#2b6cb0', '#4299e1']} style={styles.submitGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="cash-outline" size={22} color="#fff" />
                )}
                <Text style={styles.submitText}>
                  {loading ? 'Adding Payment...' : 'Add Payment'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MAJOR MODAL */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Major</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={majors}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setMajorId(item.id);
                    setMajorName(item.name);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {majorId === item.id && <Ionicons name="checkmark" size={20} color="#2b6cb0" />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>

      {/* TYPE MODAL */}
      <Modal animationType="slide" transparent visible={typeModalVisible} onRequestClose={() => setTypeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Type</Text>
              <TouchableOpacity onPress={() => setTypeModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={paymentTypes}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setType(item.value);
                    setTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {type === item.value && <Ionicons name="checkmark" size={20} color="#2b6cb0" />}
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
  },
  headerTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  gradientHeaderTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  gradientHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    textAlign: 'center',
  },
  scrollContent: { padding: 20, paddingBottom: 40 },
  formHeader: { marginBottom: 20 },
  formHeaderTitle: { fontSize: 24, fontWeight: '800', color: '#1a365d' },
  formHeaderSubtitle: { fontSize: 14, color: '#718096', marginTop: 4 },
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
  inputGroup: { marginBottom: 16 },
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
  selector: {
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
  placeholderText: { color: '#a0aec0', fontSize: 15 },
  selectedText: { color: '#2d3748', fontSize: 15 },
  submitButton: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    minHeight: '30%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a365d' },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  modalItemText: { fontSize: 16, color: '#2d3748' },
  separator: { height: 1, backgroundColor: '#e2e8f0', marginLeft: 20 },
});