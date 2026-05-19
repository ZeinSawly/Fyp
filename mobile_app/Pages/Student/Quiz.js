import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

const Quiz = ({ navigation, route }) => {

    const [selectedField, setSelectedField] = useState(null);

    const fieldsOfInterest = [
        { id: 1, name: 'Frontend Development', icon: 'code-slash', color: '#4299e1' },
        { id: 2, name: 'Backend Development', icon: 'server', color: '#48bb78' },
        { id: 3, name: 'Mobile Development', icon: 'phone-portrait', color: '#9f7aea' },
        { id: 4, name: 'Data Science', icon: 'bar-chart', color: '#ed8936' },
        { id: 5, name: 'DevOps', icon: 'cloud', color: '#fc8181' },
        { id: 6, name: 'Cybersecurity', icon: 'shield', color: '#4a5568' },
        { id: 7, name: 'Artificial Intelligence', icon: 'bulb', color: '#d53f8c' },
        { id: 8, name: 'Cloud Computing', icon: 'cloudy', color: '#3182ce' },
      ];

      const handleStartQuiz = () => {
        if (selectedField) {
          navigation.navigate('QuizQuestions', { 
            fieldId: selectedField.id,
            fieldName: selectedField.name 
          });
        }
      };

    return (
    <LinearGradient colors={['#edf2f7', '#f8fafc']} style={{ flex: 1 }}>
      {/* HEADER */}
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
          <Text style={styles.headerTitle}>Skill Assessment Quiz</Text>
          <Text style={styles.headerSubtitle}>
            Choose your field of interest to undergo the skill quiz
          </Text>
        </View>
      </LinearGradient>

      {/* Field Selection Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Select Your Field</Text>
          <Text style={styles.sectionSubtitle}>
            Tap on the field you want to be assessed in
          </Text>

          <View style={styles.fieldsGrid}>
            {fieldsOfInterest.map((field) => (
              <TouchableOpacity
                key={field.id}
                style={[
                  styles.fieldCard,
                  selectedField?.id === field.id && styles.selectedFieldCard
                ]}
                onPress={() => setSelectedField(field)}
              >
                <View style={[styles.iconCircle, { backgroundColor: field.color + '15' }]}>
                  <Ionicons name={field.icon} size={32} color={field.color} />
                </View>
                <Text style={styles.fieldName}>{field.name}</Text>
                {selectedField?.id === field.id && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color="#48bb78" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedField && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartQuiz}
            >
              <LinearGradient
                colors={['#4299e1', '#2b6cb0']}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>Start Quiz</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 24,
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
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 24,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fieldCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  selectedFieldCard: {
    borderWidth: 2,
    borderColor: '#4299e1',
    backgroundColor: '#ebf8ff',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  startButton: {
    marginTop: 24,
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

export default Quiz;