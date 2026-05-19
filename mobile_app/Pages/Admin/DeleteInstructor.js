import React, { useState } from 'react';
import {View,Text,StyleSheet,TextInput,TouchableOpacity,ScrollView,Alert,ActivityIndicator,KeyboardAvoidingView,Platform,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function DeleteInstructor({ navigation }) {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidId = idString => /^\d+$/.test(idString);

  const handleDelete = async () => {
    if (!id) {
      Alert.alert('Validation Error', 'Please enter an Instructor ID.');
      return;
    }

    if (!isValidId(id)) {
      Alert.alert('Validation Error', 'Instructor ID must contain only numbers.');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove instructor with ID ${id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await api.post(
                `/api/admin/remove-instructor`,
                { id },
                {
                  timeout: 10000,
                  headers: { 'Content-Type': 'application/json' },
                }
              );

              Alert.alert('Success', res.data.message || 'Instructor removed.');
              navigation.navigate('AdminDashboard');
            } catch (err) {
              const status = err?.response?.status;
              const message = err?.response?.data?.message;

              if (status === 404) {
                Alert.alert('Error', message || 'Instructor not found.');
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
    <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.container}>
      
      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={26} color="#fff" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'center' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* TITLE SECTION */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="trash-outline" size={30} color="#fff" />
            </View>

            <Text style={styles.title}>Delete Instructor</Text>
            <Text style={styles.subtitle}>
              Remove an instructor from the system
            </Text>
          </View>

          {/* CARD */}
          <View style={styles.card}>
            <Text style={styles.label}>Instructor ID</Text>

            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#4a5568" />
              <TextInput
                style={styles.input}
                placeholder="Enter ID"
                placeholderTextColor="#a0aec0"
                value={id}
                onChangeText={setId}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.helper}>
              ID must contain numbers only
            </Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={loading}
            >
              <LinearGradient
                colors={['#2b6cb0', '#1a365d']}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="trash" size={20} color="#fff" />
                )}
                <Text style={styles.buttonText}>
                  {loading ? 'Deleting...' : 'Delete Instructor'}
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
    flex: 1,
  },

  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },

  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },

  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 10,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#f7fafc',
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 10,
    fontSize: 15,
  },

  helper: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 6,
  },

  button: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});