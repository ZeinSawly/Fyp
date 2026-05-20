import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, 
  RefreshControl, TouchableOpacity, Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

const STATUS_STYLES = {
  paid: { bg: '#c6f6d5', text: '#2f855a', label: 'Paid' },
  pending: { bg: '#feebc8', text: '#9c4221', label: 'Pending' },
  overdue: { bg: '#fed7d7', text: '#c53030', label: 'Overdue' },
  partial: { bg: '#bee3f8', text: '#2c5282', label: 'Partial' },
};

const FinancialAccount = ({ navigation, route }) => {
  const student = route?.params?.student;
  const studentId = student?.id;

  const [semesters, setSemesters] = useState([]);
  const [grandTotals, setGrandTotals] = useState({
    total_charged: 0,
    total_discount: 0,
    total_paid: 0,
    total_outstanding: 0,
    total_overdue: 0,
  });

  const [semesterOptions, setSemesterOptions] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [expandedItems, setExpandedItems] = useState({});  // { itemId: true }

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load list of semesters the student has financials in
  useEffect(() => {
    if (!studentId) return;
    api.get(`/api/students/${studentId}/financial-semesters`)
      .then((res) => {
        if (res.data.success) setSemesterOptions(res.data.data || []);
      })
      .catch((err) => console.log('Failed to load semester options', err));
  }, [studentId]);

  // Load financial data whenever the semester filter changes
  useEffect(() => {
    if (studentId) fetchFinancials();
  }, [studentId, selectedSemesterId]);

  const fetchFinancials = async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const url = selectedSemesterId
        ? `/api/students/${studentId}/financial-summary?semester_id=${selectedSemesterId}`
        : `/api/students/${studentId}/financial-summary`;

      const res = await api.get(url);
      
      if (res.data.success) {
        setSemesters(res.data.data.semesters || []);
        setGrandTotals(res.data.data.grand_totals || {});
      }
    } catch (err) {
      console.log(err);
      setError('Unable to load financial data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`;

  const toggleExpand = (itemId) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const StatusBadge = ({ status }) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
    return (
      <View style={[styles.statusPill, { backgroundColor: style.bg }]}>
        <Text style={[styles.statusText, { color: style.text }]}>
          {style.label}
        </Text>
      </View>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'tuition': return 'school-outline';
      case 'registration': return 'document-text-outline';
      case 'insurance': return 'shield-checkmark-outline';
      case 'lost_id': return 'card-outline';
      case 'late_payment': return 'warning-outline';
      default: return 'cash-outline';
    }
  };

  const renderInstallment = (installment, parentDiscount) => (
    <View key={installment.id} style={styles.installmentRow}>
      <View style={styles.installmentLeft}>
        <View style={styles.installmentNumberBubble}>
          <Text style={styles.installmentNumberText}>
            {installment.installment_number}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.installmentTitle}>
            Installment {installment.installment_number} of {installment.total_installments}
          </Text>
          <Text style={styles.installmentDate}>
            Due {formatDate(installment.due_date)}
          </Text>
          {installment.amount_paid > 0 && installment.status !== 'paid' && (
            <Text style={styles.partialText}>
              {formatCurrency(installment.amount_paid)} of {formatCurrency(installment.amount)} paid
            </Text>
          )}
        </View>
      </View>

      <View style={styles.installmentRight}>
        <Text style={styles.installmentAmount}>
          {formatCurrency(installment.amount)}
        </Text>
        <StatusBadge status={installment.status} />
      </View>
    </View>
  );

  const renderTransactionItem = (item) => {
    const isExpanded = expandedItems[item.id] || false;
    const hasDiscount = item.discount_amount > 0;

    return (
      <View key={item.id} style={styles.itemCard}>
        <TouchableOpacity
          onPress={() => item.has_installments && toggleExpand(item.id)}
          activeOpacity={item.has_installments ? 0.7 : 1}
        >
          <View style={styles.itemHeader}>
            <View style={styles.itemHeaderLeft}>
              <Ionicons 
                name={getTypeIcon(item.type)} 
                size={22} 
                color="#2b6cb0" 
              />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.itemTitle}>{item.description}</Text>
                {item.has_installments && (
                  <Text style={styles.itemSubtitle}>
                    {item.installments.length} installments
                  </Text>
                )}
                {!item.has_installments && item.due_date && (
                  <Text style={styles.itemSubtitle}>
                    Due {formatDate(item.due_date)}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.itemHeaderRight}>
              <Text style={styles.itemAmount}>
                {formatCurrency(item.amount)}
              </Text>
              {!item.has_installments && (
                <StatusBadge status={item.status} />
              )}
              {item.has_installments && (
                <Ionicons 
                  name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={18} 
                  color="#718096" 
                  style={{ marginTop: 4 }}
                />
              )}
            </View>
          </View>

          {hasDiscount && (
            <View style={styles.discountRow}>
              <Ionicons name="pricetag-outline" size={14} color="#2f855a" />
              <Text style={styles.discountText}>
                Original {formatCurrency(item.original_amount)} · Saved {formatCurrency(item.discount_amount)}
              </Text>
            </View>
          )}

          {!item.has_installments && item.amount_paid > 0 && item.status !== 'paid' && (
            <Text style={styles.partialText}>
              {formatCurrency(item.amount_paid)} of {formatCurrency(item.amount)} paid
            </Text>
          )}
        </TouchableOpacity>

        {item.has_installments && isExpanded && (
          <View style={styles.installmentsContainer}>
            {item.installments.map((inst) => renderInstallment(inst))}
          </View>
        )}
      </View>
    );
  };

  const renderSemesterGroup = (semester) => (
    <View key={semester.semester_id || 'general'} style={styles.semesterSection}>
      <View style={styles.semesterHeader}>
        <Text style={styles.semesterTitle}>{semester.semester_name}</Text>
        {semester.academic_year && (
          <Text style={styles.semesterAY}>{semester.academic_year}</Text>
        )}
      </View>

      {/* Per-semester totals */}
      <View style={styles.semesterTotalsCard}>
        <View style={styles.totalsRow}>
          <Text style={styles.totalLabel}>Total Charged</Text>
          <Text style={styles.totalValue}>{formatCurrency(semester.totals.total_charged)}</Text>
        </View>
        {semester.totals.total_discount > 0 && (
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>Discounts</Text>
            <Text style={[styles.totalValue, { color: '#2f855a' }]}>
              -{formatCurrency(semester.totals.total_discount)}
            </Text>
          </View>
        )}
        <View style={styles.totalsRow}>
          <Text style={styles.totalLabel}>Paid</Text>
          <Text style={[styles.totalValue, { color: '#2f855a' }]}>
            {formatCurrency(semester.totals.total_paid)}
          </Text>
        </View>
        <View style={[styles.totalsRow, styles.totalsRowHighlight]}>
          <Text style={styles.totalLabelStrong}>Outstanding</Text>
          <Text style={[
            styles.totalValueStrong,
            { color: semester.totals.total_outstanding > 0 ? '#c53030' : '#2f855a' }
          ]}>
            {formatCurrency(semester.totals.total_outstanding)}
          </Text>
        </View>
        {semester.totals.total_overdue > 0 && (
          <View style={styles.overdueBanner}>
            <Ionicons name="alert-circle" size={16} color="#c53030" />
            <Text style={styles.overdueText}>
              {formatCurrency(semester.totals.total_overdue)} overdue
            </Text>
          </View>
        )}
      </View>

      {/* Items list */}
      {semester.items.map(renderTransactionItem)}
    </View>
  );

  const selectedSemesterLabel = selectedSemesterId
    ? (semesterOptions.find((s) => s.id === selectedSemesterId)?.name || 'Semester')
    : 'All Semesters';

  return (
    <LinearGradient colors={['#edf2f7', '#f8fafc']} style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.header}>
          <View style={styles.backRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.headerTitle}>Financial Account</Text>
            <Text style={styles.headerSubtitle}>Track your university payments</Text>
          </View>

          {student && (
            <View style={styles.studentChip}>
              <Ionicons name="person-circle-outline" size={18} color="#2b6cb0" />
              <Text style={styles.studentChipText}>
                {student.name} • {student.id}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* FILTER + GRAND TOTALS */}
      <View style={styles.controlBar}>
        <TouchableOpacity 
          style={styles.dropdownTrigger}
          onPress={() => setDropdownOpen(true)}
        >
          <Ionicons name="filter-outline" size={16} color="#1E293B" />
          <Text style={styles.dropdownTriggerText}>{selectedSemesterLabel}</Text>
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
              onRefresh={() => fetchFinancials(true)} 
            />
          }
        >
          {/* GRAND TOTALS BANNER */}
          <View style={styles.grandTotalCard}>
            <View style={styles.grandTotalCol}>
              <Text style={styles.grandTotalLabel}>Outstanding</Text>
              <Text style={[styles.grandTotalValue, { color: '#c53030' }]}>
                {formatCurrency(grandTotals.total_outstanding)}
              </Text>
            </View>
            <View style={styles.grandTotalDivider} />
            <View style={styles.grandTotalCol}>
              <Text style={styles.grandTotalLabel}>Paid</Text>
              <Text style={[styles.grandTotalValue, { color: '#2f855a' }]}>
                {formatCurrency(grandTotals.total_paid)}
              </Text>
            </View>
          </View>

          {grandTotals.total_overdue > 0 && (
            <View style={styles.overdueGlobalBanner}>
              <Ionicons name="alert-circle" size={20} color="#c53030" />
              <Text style={styles.overdueGlobalText}>
                You have {formatCurrency(grandTotals.total_overdue)} in overdue payments. 
                Please visit the finance office.
              </Text>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          {semesters.length === 0 && !error ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#cbd5e0" />
              <Text style={styles.emptyText}>No financial records found</Text>
            </View>
          ) : (
            semesters.map(renderSemesterGroup)
          )}

          <View style={styles.payInfoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#2b6cb0" />
            <Text style={styles.payInfoText}>
              Payments are processed in person at the Finance Office, Building A.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* SEMESTER FILTER MODAL */}
      <Modal 
        transparent 
        visible={dropdownOpen} 
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setDropdownOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedSemesterId(null);
                setDropdownOpen(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                selectedSemesterId === null && styles.dropdownItemTextActive
              ]}>
                All Semesters
              </Text>
              {selectedSemesterId === null && (
                <Ionicons name="checkmark" size={18} color="#2b6cb0" />
              )}
            </TouchableOpacity>

            {semesterOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedSemesterId(opt.id);
                  setDropdownOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  opt.id === selectedSemesterId && styles.dropdownItemTextActive
                ]}>
                  {opt.name}
                </Text>
                {opt.id === selectedSemesterId && (
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
  headerWrapper: { borderBottomLeftRadius: 25, borderBottomRightRadius: 25, overflow: 'hidden' },
  header: { paddingTop: 52, paddingBottom: 28, paddingHorizontal: 24, minHeight: 160 },
  backRow: { height: 40, justifyContent: 'center' },
  titleBlock: { marginTop: 8, alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center' },
  headerSubtitle: { marginTop: 4, fontSize: 14, color: '#e2e8f0', textAlign: 'center' },
  studentChip: {
    flexDirection: 'row', alignItems: 'center', marginTop: 14,
    backgroundColor: '#e2e8f0', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  studentChipText: { marginLeft: 6, fontSize: 12, fontWeight: '600' },

  controlBar: {
    flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
  },
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  dropdownTriggerText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  grandTotalCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18,
    padding: 18, marginTop: 12, elevation: 4,
  },
  grandTotalCol: { flex: 1, alignItems: 'center' },
  grandTotalDivider: { width: 1, backgroundColor: '#E2E8F0' },
  grandTotalLabel: { fontSize: 12, color: '#718096', marginBottom: 4 },
  grandTotalValue: { fontSize: 22, fontWeight: '800' },

  overdueGlobalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fed7d7', padding: 12, borderRadius: 12, marginTop: 12,
  },
  overdueGlobalText: { flex: 1, color: '#742a2a', fontSize: 12, fontWeight: '600' },

  semesterSection: { marginTop: 20 },
  semesterHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  semesterTitle: { fontSize: 17, fontWeight: '800', color: '#1a365d' },
  semesterAY: { fontSize: 12, color: '#718096', fontWeight: '600' },

  semesterTotalsCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2,
  },
  totalsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsRowHighlight: {
    borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 6, paddingTop: 8,
  },
  totalLabel: { color: '#718096', fontSize: 13 },
  totalValue: { fontWeight: '600', fontSize: 13 },
  totalLabelStrong: { color: '#1a365d', fontWeight: '700', fontSize: 14 },
  totalValueStrong: { fontWeight: '800', fontSize: 15 },
  overdueBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: '#fed7d7', padding: 8, borderRadius: 8,
  },
  overdueText: { color: '#c53030', fontSize: 12, fontWeight: '700' },

  itemCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 8, elevation: 2 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  itemHeaderLeft: { flexDirection: 'row', flex: 1, alignItems: 'flex-start' },
  itemHeaderRight: { alignItems: 'flex-end' },
  itemTitle: { fontWeight: '700', fontSize: 14, color: '#1a365d' },
  itemSubtitle: { fontSize: 12, color: '#718096', marginTop: 2 },
  itemAmount: { fontWeight: '800', color: '#2b6cb0', fontSize: 15, marginBottom: 4 },

  discountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F4F8',
  },
  discountText: { fontSize: 11, color: '#2f855a', fontWeight: '600' },

  partialText: { fontSize: 11, color: '#2c5282', marginTop: 4, fontStyle: 'italic' },

  installmentsContainer: {
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F4F8',
  },
  installmentRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F7FAFC',
  },
  installmentLeft: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  installmentNumberBubble: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#EBF8FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  installmentNumberText: { color: '#2b6cb0', fontWeight: '800', fontSize: 12 },
  installmentTitle: { fontSize: 13, fontWeight: '600', color: '#1a365d' },
  installmentDate: { fontSize: 11, color: '#718096', marginTop: 2 },
  installmentRight: { alignItems: 'flex-end' },
  installmentAmount: { fontWeight: '700', color: '#1a365d', marginBottom: 4 },

  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '800' },

  payInfoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EBF8FF', padding: 14, borderRadius: 12, marginTop: 16,
  },
  payInfoText: { flex: 1, color: '#2c5282', fontSize: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 8, color: '#a0aec0' },
  errorText: { color: '#c53030', marginTop: 12, textAlign: 'center' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  dropdownMenu: {
    width: 260, backgroundColor: '#FFF', borderRadius: 12, paddingVertical: 8,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  dropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
  },
  dropdownItemText: { fontSize: 14, color: '#1E293B' },
  dropdownItemTextActive: { color: '#2b6cb0', fontWeight: '700' },
});

export default FinancialAccount;