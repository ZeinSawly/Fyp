import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

const FinancialAccount = ({ navigation, route }) => {
  const student = route?.params?.student;
  const studentId = student?.id;

  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [totals, setTotals] = useState({
    total_outstanding: 0,
    total_paid: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FIXED HERE
  const [activeTab, setActiveTab] = useState('pending');

  const fetchFinancials = async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      setError(null);

      const res = await api.get(`/api/students/${studentId}/financial-summary`);

      setPending(res.data.pending || []);
      setCompleted(res.data.completed || []);
      setTotals(
        res.data.totals || {
          total_outstanding: 0,
          total_paid: 0,
        }
      );
    } catch (err) {
      console.log(err);
      setError('Unable to load financial data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchFinancials();
  }, [studentId]);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const renderPendingItem = (item) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="cash-outline" size={18} color="#2b6cb0" />
          <Text style={styles.cardTitle}>{item.description}</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Due Date</Text>
        <Text style={styles.cardValue}>{formatDate(item.due_date)}</Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Amount</Text>
        <Text style={styles.amountText}>
          ${Number(item.amount || 0).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const renderCompletedItem = (item) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="checkmark-circle" size={18} color="#2f855a" />
          <Text style={styles.cardTitle}>{item.description}</Text>
        </View>

        <View style={[styles.statusPill, styles.statusPaid]}>
          <Text style={[styles.statusText, styles.statusTextPaid]}>
            Paid
          </Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Payment Date</Text>
        <Text style={styles.cardValue}>
          {formatDate(item.payment_date)}
        </Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Amount</Text>
        <Text style={styles.amountText}>
          ${Number(item.amount || 0).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#edf2f7', '#f8fafc']} style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={['#1a365d', '#2b6cb0']}
          style={styles.header}
        >
          <View style={styles.backRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.headerTitle}>Financial Account</Text>
            <Text style={styles.headerSubtitle}>
              Track your university payments
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

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'pending' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'pending' && styles.tabTextActive,
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'completed' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'completed' && styles.tabTextActive,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
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
          {/* SUMMARY */}
          <View style={styles.summaryCard}>
            <Ionicons
              name={
                activeTab === 'pending'
                  ? 'wallet-outline'
                  : 'checkmark-done'
              }
              size={26}
              color={
                activeTab === 'pending' ? '#c53030' : '#2f855a'
              }
            />

            <View style={{ marginLeft: 10 }}>
              <Text style={styles.summaryLabel}>
                {activeTab === 'pending'
                  ? 'Outstanding Balance'
                  : 'Total Paid'}
              </Text>

              <Text
                style={[
                  styles.summaryValue,
                  activeTab === 'pending'
                    ? { color: '#c53030' }
                    : { color: '#2f855a' },
                ]}
              >
                $
                {activeTab === 'pending'
                  ? (totals.total_outstanding || 0).toFixed(2)
                  : (totals.total_paid || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* LIST */}
          <View style={styles.section}>
            {activeTab === 'pending' ? (
              pending.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="wallet-outline"
                    size={40}
                    color="#cbd5e0"
                  />
                  <Text style={styles.emptyText}>
                    No pending payments
                  </Text>
                </View>
              ) : (
                pending.map(renderPendingItem)
              )
            ) : completed.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="receipt-outline"
                  size={40}
                  color="#cbd5e0"
                />
                <Text style={styles.emptyText}>
                  No completed payments
                </Text>
              </View>
            ) : (
              completed.map(renderCompletedItem)
            )}
          </View>
        </ScrollView>
      )}
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
  backRow: {
    height: 40,
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  tabContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
  },
  tabButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    borderRadius: 999,
  },
  tabText: {
    fontWeight: '600',
    color: '#4a5568',
  },
  tabTextActive: {
    color: '#2b6cb0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#718096',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  section: {
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '600',
    marginLeft: 6,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  cardLabel: {
    color: '#718096',
  },
  cardValue: {
    fontWeight: '500',
  },
  amountText: {
    fontWeight: '700',
    color: '#2b6cb0',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusPaid: {
    backgroundColor: '#c6f6d5',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextPaid: {
    color: '#2f855a',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    marginTop: 8,
    color: '#a0aec0',
  },
  errorText: {
    color: '#c53030',
    marginBottom: 10,
  },
});

export default FinancialAccount;