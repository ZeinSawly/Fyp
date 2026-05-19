import React, { useState } from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function DeleteStudent({ navigation }) {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidId = idString => /^\d+$/.test(idString);

  const handleDelete = async () => {
    if (!id) {
      Alert.alert('Validation Error', 'Please enter a Student ID.');
      return;
    }

    if (!isValidId(id)) {
      Alert.alert('Validation Error', 'Student ID must contain only numbers.');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove student with ID ${id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await api.post(
                `/api/admin/remove-student`,
                { id },
                {
                  timeout: 10000,
                  headers: { 'Content-Type': 'application/json' },
                }
              );

              Alert.alert('Success', res.data.message || 'Student removed.');
              navigation.navigate('AdminDashboard');
            } catch (err) {
              const status = err?.response?.status;
              const message = err?.response?.data?.message;

              if (status === 404) {
                Alert.alert('Error', message || 'Student not found.');
              } else if (message) {
                Alert.alert('Error', message);
              } else {
                Alert.alert('Error', 'Server error. Please try again.');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.gradientHeaderTitle}>Delete Student</Text>
            <Text style={styles.gradientHeaderSubtitle}>
              Remove a student account from the system
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
            <Text style={styles.formHeaderTitle}>Student ID</Text>
            <Text style={styles.formHeaderSubtitle}>
              Enter the ID of the student you want to delete
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Enter student ID"
                placeholderTextColor="#a0aec0"
                value={id}
                onChangeText={setId}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleDelete}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#B80F0A', 'red']}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="trash-outline" size={22} color="#fff" />
                )}
                <Text style={styles.submitText}>
                  {loading ? 'Deleting...' : 'Delete Student'}
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
  container: { flex: 1 },
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
    color: 'rgba(255, 255, 255, 0.85)',
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
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: 10,
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
  submitButton: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#ef4444',
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
});

