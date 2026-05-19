import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Modal, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function MarkPayment({ navigation }) {
  const [studentId, setStudentId] = useState('');
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [searched, setSearched] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!studentId.trim()) {
      Alert.alert('Validation Error', 'Please enter a student ID.');
      return;
    }

    setLoadingPayments(true);
    setSearched(false);
    setPayments([]);

    try {
      const res = await api.get(`/api/admin/student-payments/${studentId.trim()}`);
      setPayments(res.data.data || []);
      setSearched(true);
    } catch (err) {
      const message = err.response?.data?.message || 'Student not found or server error.';
      Alert.alert('Error', message);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handlePaymentPress = (payment) => {
    setSelectedPayment(payment);
    setAmountPaid(payment.amount.toString());
    setPaymentDate(new Date().toISOString().split('T')[0]); // today's date
    setModalVisible(true);
  };

  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const handleMarkPaid = async () => {
    if (!amountPaid || !paymentDate) {
      Alert.alert('Validation Error', 'Please fill all fields.');
      return;
    }

    if (isNaN(parseFloat(amountPaid)) || parseFloat(amountPaid) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    if (!isValidDate(paymentDate)) {
      Alert.alert('Validation Error', 'Please enter date in YYYY-MM-DD format.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put('/api/admin/mark-payment-paid', {
        transaction_id: selectedPayment.id,
        amount_paid: parseFloat(amountPaid),
        payment_date: paymentDate,
      });

      Alert.alert('Success', res.data.message);
      setModalVisible(false);
      setSelectedPayment(null);
      setAmountPaid('');
      setPaymentDate('');

      // Refresh the list
      setPayments(prev => prev.filter(p => p.id !== selectedPayment.id));

    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const renderPayment = ({ item }) => (
    <TouchableOpacity style={styles.paymentCard} onPress={() => handlePaymentPress(item)} activeOpacity={0.7}>
      <View style={styles.paymentLeft}>
        <View style={styles.paymentIconCircle}>
          <Ionicons name="cash-outline" size={20} color="#2b6cb0" />
        </View>
        <View>
          <Text style={styles.paymentDescription}>{item.description}</Text>
          <Text style={styles.paymentType}>{item.type}</Text>
          <Text style={styles.paymentDue}>Due: {formatDate(item.due_date)}</Text>
        </View>
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.paymentAmount}>${Number(item.amount).toFixed(2)}</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#edf2f7', '#f8fafc']} style={styles.container}>

      {/* HEADER */}
      <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.gradientHeaderTitle}>Mark Payment</Text>
            <Text style={styles.gradientHeaderSubtitle}>Mark student payments as completed</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* SEARCH */}
          <View style={styles.searchCard}>
            <Text style={styles.searchLabel}>Student ID</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter student ID"
                placeholderTextColor="#a0aec0"
                value={studentId}
                onChangeText={setStudentId}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loadingPayments}>
                {loadingPayments
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Ionicons name="search" size={20} color="#fff" />
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* RESULTS */}
          {searched && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>
                {payments.length > 0
                  ? `${payments.length} Pending Payment(s)`
                  : 'No pending payments found'}
              </Text>

              {payments.length > 0 && (
                <Text style={styles.resultsHint}>Tap a payment to mark it as completed</Text>
              )}

              <FlatList
                data={payments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPayment}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="checkmark-done-circle-outline" size={50} color="#cbd5e0" />
                    <Text style={styles.emptyText}>All payments are completed!</Text>
                  </View>
                }
              />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* MARK PAID MODAL */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark as Paid</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>

            {selectedPayment && (
              <View style={styles.modalBody}>

                {/* Payment summary */}
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryDescription}>{selectedPayment.description}</Text>
                  <Text style={styles.summaryAmount}>Total Due: ${Number(selectedPayment.amount).toFixed(2)}</Text>
                </View>

                {/* Amount paid */}
                <Text style={styles.modalLabel}>Amount Paid ($)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter amount paid"
                  placeholderTextColor="#a0aec0"
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                  keyboardType="decimal-pad"
                />

                {/* Payment date */}
                <Text style={styles.modalLabel}>Payment Date</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#a0aec0"
                  value={paymentDate}
                  onChangeText={setPaymentDate}
                />

                {/* Confirm button */}
                <TouchableOpacity
                  style={[styles.confirmButton, submitting && { opacity: 0.6 }]}
                  onPress={handleMarkPaid}
                  disabled={submitting}
                >
                  <LinearGradient colors={['#2f855a', '#38a169']} style={styles.confirmGradient}>
                    {submitting
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    }
                    <Text style={styles.confirmText}>
                      {submitting ? 'Processing...' : 'Confirm Payment'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

              </View>
            )}
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
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 20,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    color: '#2d3748',
  },
  searchButton: {
    backgroundColor: '#2b6cb0',
    width: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsSection: { marginBottom: 20 },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a365d',
    marginBottom: 4,
  },
  resultsHint: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 16,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ebf8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentDescription: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    maxWidth: 180,
  },
  paymentType: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  paymentDue: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2b6cb0',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 30,
  },
  emptyText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 30,
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
  modalBody: { padding: 20 },
  summaryBox: {
    backgroundColor: '#ebf8ff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  summaryDescription: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a365d',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 13,
    color: '#2b6cb0',
    fontWeight: '600',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    color: '#2d3748',
    marginBottom: 16,
  },
  confirmButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});