import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StudentProfile({navigation, route}) {
  
  const {student} = route.params;

  const handleLogout = async () => {
    // Trigger the confirmation dialog
    Alert.alert(
      'Log Out', // Alert Title
      'Are you sure you want to log out?', // Alert Message
      [
        { 
          text: 'Cancel', 
          style: 'cancel' // Does nothing and closes the alert
        },
        {
          text: 'Log Out',
          style: 'destructive', // Highlights the button in red on iOS
          onPress: async () => {
            try {
              // 1. Notify the backend via the route in authenticationRoutes.js
              await api.post('/api/logout'); 
            } catch (err) {
              console.log('Backend logout failed:', err.message);
            } finally {
              // 2. Clear the token from storage as seen in api.js logic
              await AsyncStorage.removeItem('token'); 
              
              // 3. Reset navigation to the Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        }
      ]
    );
  };

  const ProfileItem = ({ icon, label, value, color }) => (
    <View style={styles.infoRow}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.mainWrapper}>
      <SafeAreaView style={styles.topSafeArea} /> 
      
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          <LinearGradient colors={['#1a365d', '#2b6cb0']}  style={styles.headerGradient} >
            
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={28} color="#FFF" />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>Profile</Text>

              <View style={{ width: 28 }} />
            </View>

            <View style={styles.profileHeader}>

              <View style={styles.imageWrapper}>
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={60} color="#BDC3C7" />
                </View>
              </View>

              <Text style={styles.userName}>{student.name}</Text>
              <Text style={styles.userStatus}>{student.role}</Text>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.infoCard}>
              <ProfileItem 
                icon="finger-print-outline" 
                label="Student ID" 
                value={student.id} 
                color="#1a365d"
              />

              <View style={styles.divider} />

              <ProfileItem 
                icon="mail-outline" 
                label="University Email" 
                value={student.email}
                color="#5C6BC0"
              />

              <View style={styles.divider} />

              <ProfileItem 
                icon="call-outline" 
                label="Phone Number" 
                value={student.phone} 
                color="#66BB6A"
              />
            </View>

            <Text style={styles.sectionTitle}>Academic Status</Text>

            <View style={styles.infoCard}>
              <ProfileItem 
                icon="school-outline" 
                label="Major" 
                value={student.major} 
                color="#42A5F5"
              />

              <View style={styles.divider} />

              <ProfileItem 
                icon="calendar-outline" 
                label="Enrollment Year" 
                value={new Date(student.enrollment_date).getFullYear().toString()}
                color="#AB47BC"
              />

              <View style={styles.divider} />

              <ProfileItem 
                icon="location-outline" 
                label="Campus" 
                value={student.campus}
                color="#EF5350"
              />
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#EF5350" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
            
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topSafeArea: {
    flex: 0, 
    backgroundColor: '#1a365d'
  },
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  profileHeader: {
    alignItems: 'center',
  },
  imageWrapper: {
    marginBottom: 15,
  },
  profileImagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  userStatus: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
    fontWeight: '500',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    marginTop: 10,
    paddingLeft: 4,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 59,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    color: '#EF5350',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
});