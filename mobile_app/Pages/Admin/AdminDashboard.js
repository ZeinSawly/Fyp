import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboard({ navigation, route }) {
  const admin = route?.params?.admin ?? { name: 'Administrator', id: 'ADMIN' };

  //  supports 3 tabs
  const [activeManageTab, setActiveManageTab] = useState('students'); // 'students' | 'instructors' | 'payments'

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/api/logout'); 
          } catch (err) {
            console.log('Logout notification failed', err.message);
          } finally {
            await AsyncStorage.removeItem('token'); 
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        },
      },
    ]);
  };
  
  const studentActions = [
    {
      icon: 'person-add',
      color: '#22c55e',
      label: 'Add Student',
      action: 'addStudent',
    },
    {
      icon: 'person-remove',
      color: '#ef4444',
      label: 'Remove Student',
      action: 'removeStudent',
    },
  ];

  const instructorActions = [
    {
      icon: 'person-add',
      color: '#3b82f6',
      label: 'Add Instructor',
      action: 'addInstructor',
    },
    {
      icon: 'person-remove',
      color: '#f97316',
      label: 'Remove Instructor',
      action: 'removeInstructor',
    },
  ];

  const paymentActions = [
    {
      icon: 'cash',
      color: '#22c55e',
      label: 'Add Payment',
      action: 'addPayment',
    },
    {
      icon: 'checkmark-circle',
      color: '#3b82f6',
      label: 'Mark Paid',
      action: 'markPayment',
    },
  ];

  //  dynamic switch
  const actionItems =
    activeManageTab === 'students'
      ? studentActions
      : activeManageTab === 'instructors'
      ? instructorActions
      : paymentActions;

  const handleActionPress = (item) => {
    switch (item.action) {
      case 'addStudent':
        navigation.navigate('AddStudent');
        break;
      case 'addInstructor':
        navigation.navigate('AddInstructor');
        break;
      case 'removeStudent':
        navigation.navigate('DeleteStudent');
        break;
      case 'removeInstructor':
          navigation.navigate('DeleteInstructor');
          break;
      case 'addPayment':
          navigation.navigate('AddPayment');
          break;
      case 'markPayment':
          navigation.navigate('MarkPayment');
          break;
      case 'gradeComponents':
          navigation.navigate('GradeComponents');
          break;
        default:
          console.log('Unknown action');
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <LinearGradient
          colors={['#1a365d', '#2b6cb0']}
          style={styles.card}
        >
          <View style={styles.topSection}>
            <View>
              <Text style={styles.nameText}>{admin.name}</Text>
              <Text style={styles.idText}>{admin.id}</Text>
            </View>
            <View style={styles.profileCircle}>
              <Ionicons name="shield-checkmark-outline" size={40} color="#E5E7EB" />
            </View>
          </View>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>System Administration</Text>
          </View>
        </LinearGradient>

        <TouchableOpacity 
          style={styles.profilePageButton} 
          onPress={() => navigation.navigate('AdminProfile', { admin })}
        >
          <Ionicons name="person-circle-outline" size={22} color="#1a365d" />
          <Text style={styles.profilePageButtonText}>View Admin Profile</Text>
          <Ionicons name="chevron-forward" size={18} color="#1a365d" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.profilePageButton} 
          onPress={() => navigation.navigate('GradeComponents', { admin })}
        >
          <Ionicons name="person-circle-outline" size={22} color="#1a365d" />
          <Text style={styles.profilePageButtonText}>Add Course Grading Components</Text>
          <Ionicons name="chevron-forward" size={18} color="#1a365d" />
        </TouchableOpacity>

        {/* 3 TABS  */}
        <View style={styles.manageTabs}>
          {/* STUDENTS */}
          <TouchableOpacity
            style={[
              styles.manageTab,
              activeManageTab === 'students' && styles.manageTabActive,
            ]}
            onPress={() => setActiveManageTab('students')}
          >
            <Ionicons
              name="people-outline"
              size={18}
              color={activeManageTab === 'students' ? '#1a365d' : '#64748b'}
            />
            <Text
              style={[
                styles.manageTabText,
                activeManageTab === 'students' && styles.manageTabTextActive,
              ]}
            >
              Students
            </Text>
          </TouchableOpacity>

          {/* INSTRUCTORS */}
          <TouchableOpacity
            style={[
              styles.manageTab,
              activeManageTab === 'instructors' && styles.manageTabActive,
            ]}
            onPress={() => setActiveManageTab('instructors')}
          >
            <Ionicons
              name="briefcase-outline"
              size={18}
              color={activeManageTab === 'instructors' ? '#1a365d' : '#64748b'}
            />
            <Text
              style={[
                styles.manageTabText,
                activeManageTab === 'instructors' && styles.manageTabTextActive,
              ]}
            >
              Instructors
            </Text>
          </TouchableOpacity>

          {/* PAYMENTS */}
          <TouchableOpacity
            style={[
              styles.manageTab,
              activeManageTab === 'payments' && styles.manageTabActive,
            ]}
            onPress={() => setActiveManageTab('payments')}
          >
            <Ionicons
              name="cash-outline"
              size={18}
              color={activeManageTab === 'payments' ? '#1a365d' : '#64748b'}
            />
            <Text
              style={[
                styles.manageTabText,
                activeManageTab === 'payments' && styles.manageTabTextActive,
              ]}
            >
              Payments
            </Text>
          </TouchableOpacity>
        </View>

        {/* GRID */}
        <View style={styles.gridContainer}>
          {actionItems.map((item, index) => (
            <View key={index} style={styles.gridWrapper}>
              <TouchableOpacity
                style={styles.gridItem}
                activeOpacity={0.7}
                onPress={() => handleActionPress(item)}
              >
                <Ionicons name={item.icon} size={30} color={item.color} />
              </TouchableOpacity>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingTop: 20 },

  card: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    marginBottom: 30,
    elevation: 8,
  },

  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  nameText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },

  idText: {
    color: '#D1D5DB',
    fontSize: 15,
  },

  profileCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  roleText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  profilePageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profilePageButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#1a365d',
  },

  manageTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginBottom: 18,
    padding: 6,
  },

  manageTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 999,
  },

  manageTabActive: {
    backgroundColor: '#FFF',
  },

  manageTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },

  manageTabTextActive: {
    color: '#1a365d',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  gridWrapper: {
    width: '47%',
    alignItems: 'center',
    marginBottom: 20,
  },

  gridItem: {
    width: '100%',
    aspectRatio: 1.4,
    backgroundColor: '#FFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  gridLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
});