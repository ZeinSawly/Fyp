import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { downloadPaymentReceipt } from '../../utils/receiptGenerator';
import api from '../../config/api';

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  card: 'Card',
  check: 'Check',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
};

const PAYMENT_METHOD_ICONS = {
  cash: 'cash-outline',
  card: 'card-outline',
  check: 'document-text-outline',
  bank_transfer: 'business-outline',
  other: 'ellipsis-horizontal-outline',
};

const PaymentHistory = ({ navigation, route }) => {
  const student = route?.params?.student;
  const studentId = student?.id;

  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | year strings
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (studentId) fetchPayments();
  }, [studentId]);

  useEffect(() => {
    applyFilter();
  }, [payments, filter]);

  const fetchPayments = async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const res = await api.get(`/api/students/${studentId}/payments`);

      if (res.data.success) {
        setPayments(res.data.data || []);
      } else {
        setError('Unable to load payment history.');
      }
    } catch (err) {
      console.log(err);
      setError('Unable to load payment history.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(
        payments.filter((p) => {
          const year = new Date(p.payment_date).getFullYear().toString();
          return year === filter;
        })
      );
    }
  };

  // Get unique years from payments for the filter dropdown
  const availableYears = [...new Set(
    payments.map(p => new Date(p.payment_date).getFullYear().toString())
  )].sort((a, b) => b.localeCompare(a));

  const filterLabel = filter === 'all' ? 'All Years' : filter;

  // Stats
  const totalPaid = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) =>
    `$${Number(amount || 0).toFixed(2)}`;

  const handleDownloadReceipt = async (payment) => {
    setDownloadingId(payment.id);
  
    try {
      await downloadPaymentReceipt(studentId, payment.id);
      // After share sheet closes, the user has saved or shared it. Nothing more to do.
    } catch (err) {
      console.error('Download receipt error:', err);
      Alert.alert(
        'Receipt Download Failed',
        err.message || 'Could not generate the receipt. Please try again.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const renderPaymentItem = (payment) => {
    const methodIcon = PAYMENT_METHOD_ICONS[payment.payment_method] || 'cash-outline';
    const methodLabel = PAYMENT_METHOD_LABELS[payment.payment_method] || 'Other';
    const isDownloading = downloadingId === payment.id;

    return (
      <View key={payment.id} style={styles.paymentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.refContainer}>
            <Text style={styles.refLabel}>RECEIPT</Text>
            <Text style={styles.refNumber}>
              {payment.reference_number || `Payment #${payment.id}`}
            </Text>
          </View>
          <View style={styles.amountChip}>
            <Text style={styles.amountText}>
              {formatCurrency(payment.amount)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={14} color="#718096" />
            <Text style={styles.detailLabel}>Paid for</Text>
            <Text style={styles.detailValue}>
              {payment.installment_number
                ? `Installment ${payment.installment_number} of ${payment.total_installments}`
                : payment.transaction_description}
            </Text>
          </View>

          {payment.semester_name && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color="#718096" />
              <Text style={styles.detailLabel}>Semester</Text>
              <Text style={styles.detailValue}>{payment.semester_name}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="calendar-clear-outline" size={14} color="#718096" />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {formatDate(payment.payment_date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name={methodIcon} size={14} color="#718096" />
            <Text style={styles.detailLabel}>Method</Text>
            <Text style={styles.detailValue}>{methodLabel}</Text>
          </View>

          {payment.recorded_by_name && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={14} color="#718096" />
              <Text style={styles.detailLabel}>Recorded by</Text>
              <Text style={styles.detailValue}>{payment.recorded_by_name}</Text>
            </View>
          )}

          {payment.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{payment.notes}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
          onPress={() => handleDownloadReceipt(payment)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="download-outline" size={16} color="#FFF" />
              <Text style={styles.downloadButtonText}>Download Receipt</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#edf2f7', '#f8fafc']} style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.header}>
          <View style={styles.headerActionRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.headerTitle}>Payment History</Text>
            <Text style={styles.headerSubtitle}>
              All your recorded payments
            </Text>
          </View>

          {student && (
            <View style={styles.studentChip}>
              <Ionicons
                name="person-circle-outline"
                size={18}
                color="#2b6cb0"
              />
              <Text style={styles.studentChipText}>
                {student.name} • {student.id}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* FILTER + SUMMARY */}
      <View style={styles.controlBar}>
        <TouchableOpacity
          style={styles.filterTrigger}
          onPress={() => setFilterModalOpen(true)}
        >
          <Ionicons name="filter-outline" size={16} color="#1E293B" />
          <Text style={styles.filterTriggerText}>{filterLabel}</Text>
          <Ionicons name="chevron-down" size={14} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} color="#2b6cb0" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchPayments(true)}
            />
          }
        >
          {/* SUMMARY CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Ionicons name="checkmark-done-outline" size={28} color="#2f855a" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.summaryLabel}>Total Paid</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totalPaid)}
                </Text>
                <Text style={styles.summaryHint}>
                  {filteredPayments.length} payment
                  {filteredPayments.length === 1 ? '' : 's'}
                  {filter !== 'all' ? ` · ${filter}` : ''}
                </Text>
              </View>
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* PAYMENTS LIST */}
          {filteredPayments.length === 0 && !error ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#cbd5e0" />
              <Text style={styles.emptyText}>
                {filter === 'all'
                  ? 'No payment records found'
                  : `No payments in ${filter}`}
              </Text>
            </View>
          ) : (
            filteredPayments.map(renderPaymentItem)
          )}
        </ScrollView>
      )}

      {/* FILTER MODAL */}
      <Modal
        transparent
        visible={filterModalOpen}
        animationType="fade"
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setFilter('all');
                setFilterModalOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  filter === 'all' && styles.dropdownItemTextActive,
                ]}
              >
                All Years
              </Text>
              {filter === 'all' && (
                <Ionicons name="checkmark" size={18} color="#2b6cb0" />
              )}
            </TouchableOpacity>

            {availableYears.map((year) => (
              <TouchableOpacity
                key={year}
                style={styles.dropdownItem}
                onPress={() => {
                  setFilter(year);
                  setFilterModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    year === filter && styles.dropdownItemTextActive,
                  ]}
                >
                  {year}
                </Text>
                {year === filter && (
                  <Ionicons name="checkmark" size={18} color="#2b6cb0" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 24,
    minHeight: 160,
  },
  headerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
  },
  titleBlock: {
    marginTop: 8,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: '#e2e8f0',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  studentChipText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },

  controlBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
    marginBottom: 20,
    elevation: 4,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#718096',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2f855a',
  },
  summaryHint: {
    fontSize: 11,
    color: '#A0AEC0',
    marginTop: 2,
  },

  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refContainer: {
    flex: 1,
  },
  refLabel: {
    fontSize: 9,
    color: '#A0AEC0',
    letterSpacing: 1,
    fontWeight: '700',
  },
  refNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a365d',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  amountChip: {
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  amountText: {
    color: '#22543D',
    fontWeight: '800',
    fontSize: 15,
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },

  detailsContainer: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    color: '#718096',
    fontSize: 12,
    width: 80,
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  notesContainer: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  notesLabel: {
    fontSize: 10,
    color: '#A0AEC0',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 2,
    fontStyle: 'italic',
  },

  downloadButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2b6cb0',
    paddingVertical: 12,
    borderRadius: 12,
  },
  downloadButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  downloadButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },

  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 8,
    color: '#A0AEC0',
  },
  errorText: {
    color: '#c53030',
    marginTop: 12,
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    width: 260,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1E293B',
  },
  dropdownItemTextActive: {
    color: '#2b6cb0',
    fontWeight: '700',
  },
});

export default PaymentHistory;