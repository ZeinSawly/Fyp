import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

// ─── MAJOR → FIELDS + LANGUAGES MAPPING ───
const MAJOR_CONFIG = {
  'computer science': {
    fields: [
      { label: 'Web Development', icon: 'globe-outline', color: '#42A5F5',
        languages: ['JavaScript', 'TypeScript', 'PHP', 'Python', 'Ruby'] },
      { label: 'Mobile Development', icon: 'phone-portrait-outline', color: '#5C6BC0',
        languages: ['React Native', 'Flutter (Dart)', 'Swift', 'Kotlin', 'Xamarin'] },
      { label: 'Artificial Intelligence', icon: 'hardware-chip-outline', color: '#AB47BC',
        languages: ['Python', 'R', 'Julia', 'MATLAB'] },
      { label: 'Data Science', icon: 'analytics-outline', color: '#26C6DA',
        languages: ['Python', 'R', 'SQL', 'Julia', 'Scala'] },
      { label: 'Cybersecurity', icon: 'shield-checkmark-outline', color: '#EF5350',
        languages: ['Python', 'C', 'C++', 'Bash', 'PowerShell', 'Assembly'] },
      { label: 'Cloud Computing', icon: 'cloud-outline', color: '#66BB6A',
        languages: ['Python', 'Go', 'Bash', 'JavaScript', 'Terraform (HCL)'] },
      { label: 'Game Development', icon: 'game-controller-outline', color: '#FFA726',
        languages: ['C#', 'C++', 'GDScript', 'Lua', 'JavaScript'] },
      { label: 'Software Engineering', icon: 'code-slash-outline', color: '#FF7043',
        languages: ['Java', 'C#', 'C++', 'Python', 'Go', 'Rust'] },
    ],
  },

  'software engineering': {
    fields: [
      { label: 'Backend Development', icon: 'server-outline', color: '#42A5F5',
        languages: ['Node.js', 'Java', 'Python', 'Go', 'C#', 'PHP', 'Ruby'] },
      { label: 'Frontend Development', icon: 'desktop-outline', color: '#5C6BC0',
        languages: ['JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular'] },
      { label: 'Full Stack Development', icon: 'layers-outline', color: '#AB47BC',
        languages: ['JavaScript', 'TypeScript', 'Python', 'Java', 'PHP'] },
      { label: 'DevOps', icon: 'git-branch-outline', color: '#26C6DA',
        languages: ['Bash', 'Python', 'Go', 'YAML', 'Terraform (HCL)'] },
      { label: 'Mobile Development', icon: 'phone-portrait-outline', color: '#EF5350',
        languages: ['React Native', 'Flutter (Dart)', 'Swift', 'Kotlin'] },
      { label: 'Software Architecture', icon: 'construct-outline', color: '#66BB6A',
        languages: ['Java', 'C#', 'Python', 'Go', 'Scala'] },
      { label: 'Quality Assurance', icon: 'checkmark-circle-outline', color: '#FFA726',
        languages: ['Python', 'Java', 'JavaScript', 'Ruby', 'C#'] },
      { label: 'Embedded Systems', icon: 'hardware-chip-outline', color: '#FF7043',
        languages: ['C', 'C++', 'Assembly', 'Rust', 'MicroPython'] },
    ],
  },

  'information technology': {
    fields: [
      { label: 'Networking', icon: 'wifi-outline', color: '#42A5F5',
        languages: ['Python', 'Bash', 'PowerShell', 'Cisco IOS'] },
      { label: 'System Administration', icon: 'server-outline', color: '#5C6BC0',
        languages: ['Bash', 'PowerShell', 'Python', 'Ansible'] },
      { label: 'Cybersecurity', icon: 'shield-checkmark-outline', color: '#EF5350',
        languages: ['Python', 'Bash', 'C', 'PowerShell', 'Assembly'] },
      { label: 'Cloud Computing', icon: 'cloud-outline', color: '#66BB6A',
        languages: ['Python', 'Go', 'Bash', 'Terraform (HCL)', 'JavaScript'] },
      { label: 'Database Administration', icon: 'folder-outline', color: '#FFA726',
        languages: ['SQL', 'Python', 'Bash', 'PL/SQL', 'MongoDB Query Language'] },
      { label: 'IT Support', icon: 'help-circle-outline', color: '#AB47BC',
        languages: ['PowerShell', 'Bash', 'Python'] },
      { label: 'Data Science', icon: 'analytics-outline', color: '#26C6DA',
        languages: ['Python', 'R', 'SQL', 'Scala'] },
    ],
  },

  'mechanical engineering': {
    fields: [
      { label: 'Automotive Engineering', icon: 'car-sport-outline', color: '#FF7043',
        languages: ['MATLAB', 'Python', 'C++', 'Simulink'] },
      { label: 'Aerospace Engineering', icon: 'airplane-outline', color: '#42A5F5',
        languages: ['MATLAB', 'Python', 'C++', 'Fortran'] },
      { label: 'Robotics', icon: 'hardware-chip-outline', color: '#AB47BC',
        languages: ['Python', 'C++', 'ROS', 'MATLAB'] },
      { label: 'Thermal Engineering', icon: 'flame-outline', color: '#EF5350',
        languages: ['MATLAB', 'Python', 'ANSYS Scripting'] },
      { label: 'Manufacturing', icon: 'construct-outline', color: '#66BB6A',
        languages: ['MATLAB', 'Python', 'G-code'] },
    ],
  },

  'business administration': {
    fields: [
      { label: 'Marketing', icon: 'megaphone-outline', color: '#FFA726', languages: null },
      { label: 'Finance', icon: 'cash-outline', color: '#66BB6A', languages: null },
      { label: 'Human Resources', icon: 'people-outline', color: '#AB47BC', languages: null },
      { label: 'Operations Management', icon: 'settings-outline', color: '#42A5F5', languages: null },
      { label: 'Entrepreneurship', icon: 'rocket-outline', color: '#EF5350', languages: null },
      { label: 'International Business', icon: 'globe-outline', color: '#26C6DA', languages: null },
      { label: 'Supply Chain', icon: 'git-network-outline', color: '#FF7043', languages: null },
    ],
  },

  'medicine': {
    fields: [
      { label: 'General Medicine', icon: 'medkit-outline', color: '#EF5350', languages: null },
      { label: 'Surgery', icon: 'cut-outline', color: '#AB47BC', languages: null },
      { label: 'Pediatrics', icon: 'happy-outline', color: '#42A5F5', languages: null },
      { label: 'Cardiology', icon: 'heart-outline', color: '#EF5350', languages: null },
      { label: 'Dentistry', icon: 'fitness-outline', color: '#26C6DA', languages: null },
      { label: 'Pharmacy', icon: 'flask-outline', color: '#66BB6A', languages: null },
    ],
  },

  'civil engineering': {
    fields: [
      { label: 'Structural Engineering', icon: 'business-outline', color: '#795548', languages: null },
      { label: 'Transportation Engineering', icon: 'car-outline', color: '#FF7043', languages: null },
      { label: 'Environmental Engineering', icon: 'leaf-outline', color: '#66BB6A', languages: null },
      { label: 'Construction Management', icon: 'hammer-outline', color: '#FFA726', languages: null },
      { label: 'Geotechnical Engineering', icon: 'layers-outline', color: '#78909C', languages: null },
    ],
  },

  'law': {
    fields: [
      { label: 'Corporate Law', icon: 'briefcase-outline', color: '#795548', languages: null },
      { label: 'Criminal Law', icon: 'shield-outline', color: '#EF5350', languages: null },
      { label: 'International Law', icon: 'globe-outline', color: '#42A5F5', languages: null },
      { label: 'Civil Law', icon: 'scale-outline', color: '#AB47BC', languages: null },
      { label: 'Human Rights Law', icon: 'people-outline', color: '#66BB6A', languages: null },
    ],
  },

  'architecture': {
    fields: [
      { label: 'Urban Design', icon: 'business-outline', color: '#78909C', languages: null },
      { label: 'Interior Design', icon: 'home-outline', color: '#FFA726', languages: null },
      { label: 'Landscape Architecture', icon: 'leaf-outline', color: '#66BB6A', languages: null },
      { label: 'Sustainable Architecture', icon: 'sunny-outline', color: '#26C6DA', languages: null },
      { label: 'Heritage Conservation', icon: 'library-outline', color: '#795548', languages: null },
    ],
  },
};

const DEFAULT_CONFIG = {
  fields: [
    { label: 'Research', icon: 'search-outline', color: '#42A5F5', languages: null },
    { label: 'Teaching & Education', icon: 'school-outline', color: '#66BB6A', languages: null },
    { label: 'Consulting', icon: 'chatbubbles-outline', color: '#AB47BC', languages: null },
    { label: 'Management', icon: 'briefcase-outline', color: '#FFA726', languages: null },
    { label: 'Entrepreneurship', icon: 'rocket-outline', color: '#EF5350', languages: null },
  ],
};

// ─── HELPER: Get config for student's major ───
const getConfigForMajor = (major) => {
  if (!major) return DEFAULT_CONFIG;
  const key = Object.keys(MAJOR_CONFIG).find(k =>
    major.toLowerCase().includes(k)
  );
  return key ? MAJOR_CONFIG[key] : DEFAULT_CONFIG;
};

export default function QuizIntro({ route, navigation }) {
  const { student } = route.params;
  const config = getConfigForMajor(student.major);

  const [selectedField, setSelectedField] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get available languages based on selected field
  const selectedFieldConfig = config.fields.find(f => f.label === selectedField);
  const availableLanguages = selectedFieldConfig?.languages || null;

  const canStart = selectedField && (availableLanguages ? selectedLanguage : true);

  const buildFieldOfInterest = () => {
    if (selectedLanguage) {
      return `${selectedField} using ${selectedLanguage}`;
    }
    return selectedField;
  };

  const handleStart = async () => {
    if (!canStart) return;

    setLoading(true);
    try {
      const fieldOfInterest = buildFieldOfInterest();

      const res = await api.post('/api/quiz/start', {
        student_id: student.id,
        field_of_interest: fieldOfInterest,
      });

      if (res.data.success) {
        navigation.navigate('QuizScreen', {
          student,
          session_id: res.data.session_id,
          question: res.data.question,
          question_number: res.data.question_number,
          total_questions: res.data.total_questions,
          field_of_interest: fieldOfInterest,
        });
      } else {
        Alert.alert('Error', res.data.message || 'Failed to start quiz');
      }
    } catch (error) {
      console.error('Start quiz error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to start quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Career Quiz</Text>
          <Text style={styles.headerSub}>{student.major}</Text>
        </View>
        <View style={{ width: 28 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#2b6cb0" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>How the quiz works</Text>
            <Text style={styles.infoText}>
              Answer 10 adaptive questions tailored to your field and preferred language.
              Each question requires you to select an answer AND explain your reasoning.
              Difficulty adjusts based on your performance.
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="help-circle-outline" size={22} color="#2b6cb0" />
            <Text style={styles.statValue}>10</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="trending-up-outline" size={22} color="#2b6cb0" />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Levels</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="star-outline" size={22} color="#2b6cb0" />
            <Text style={styles.statValue}>0-100</Text>
            <Text style={styles.statLabel}>Skill Score</Text>
          </View>
        </View>

        {/* Step 1: Field of interest */}
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>Choose your field of interest</Text>
        </View>

        <View style={styles.fieldsGrid}>
          {config.fields.map((field, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.fieldCard,
                selectedField === field.label && {
                  borderColor: field.color,
                  backgroundColor: field.color + '15'
                }
              ]}
              onPress={() => {
                setSelectedField(field.label);
                setSelectedLanguage(null);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={field.icon}
                size={26}
                color={selectedField === field.label ? field.color : '#94A3B8'}
              />
              <Text style={[
                styles.fieldLabel,
                selectedField === field.label && { color: field.color, fontWeight: '800' }
              ]}>
                {field.label}
              </Text>
              {selectedField === field.label && (
                <Ionicons name="checkmark-circle" size={16} color={field.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 2: Language (only for technical majors) */}
        {availableLanguages && selectedField && (
          <>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Choose your preferred language</Text>
            </View>

            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => setLanguageModalVisible(true)}
            >
              <View style={styles.languageSelectorLeft}>
                <Ionicons name="code-slash-outline" size={20} color={selectedLanguage ? '#2b6cb0' : '#94A3B8'} />
                <Text style={[
                  styles.languageSelectorText,
                  selectedLanguage && { color: '#2b6cb0', fontWeight: '700' }
                ]}>
                  {selectedLanguage || 'Select programming language'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </>
        )}

        {/* Selected summary */}
        {canStart && (
          <View style={styles.summaryCard}>
            <Ionicons name="checkmark-circle" size={20} color="#2f855a" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.summaryTitle}>Quiz will be tailored for:</Text>
              <Text style={styles.summaryField}>{buildFieldOfInterest()}</Text>
            </View>
          </View>
        )}

        {/* Start button */}
        <TouchableOpacity
          style={[styles.startButton, !canStart && styles.startButtonDisabled]}
          onPress={handleStart}
          disabled={!canStart || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canStart ? ['#1a365d', '#2b6cb0'] : ['#CBD5E1', '#CBD5E1']}
            style={styles.startGradient}
          >
            {loading
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Ionicons name="play-circle-outline" size={22} color="#FFF" />
            }
            <Text style={styles.startText}>
              {loading ? 'Preparing Quiz...' : 'Start Quiz'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* Language Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedLanguage(item);
                    setLanguageModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedLanguage === item && (
                    <Ionicons name="checkmark" size={20} color="#2b6cb0" />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  infoCard: {
    flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: 16,
    padding: 16, marginBottom: 20, alignItems: 'flex-start',
    borderLeftWidth: 4, borderLeftColor: '#2b6cb0',
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#1a365d', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16,
    padding: 16, marginBottom: 24, justifyContent: 'space-around',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#E2E8F0' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#2b6cb0',
    justifyContent: 'center', alignItems: 'center',
  },
  stepNumberText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  stepTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  fieldCard: {
    width: '47%', backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 8, borderWidth: 2, borderColor: 'transparent',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
  },
  fieldLabel: {
    fontSize: 12, fontWeight: '600', color: '#64748B', textAlign: 'center',
  },
  languageSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    borderWidth: 2, borderColor: '#E2E8F0', marginBottom: 20,
    elevation: 2,
  },
  languageSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  languageSelectorText: { fontSize: 15, color: '#94A3B8' },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#C6F6D5',
    borderRadius: 14, padding: 14, marginBottom: 20,
  },
  summaryTitle: { fontSize: 12, fontWeight: '600', color: '#2f855a' },
  summaryField: { fontSize: 15, fontWeight: '800', color: '#1a202c', marginTop: 2 },
  startButton: { borderRadius: 16, overflow: 'hidden' },
  startButtonDisabled: { opacity: 0.5 },
  startGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 10,
  },
  startText: { color: '#FFF', fontWeight: '800', fontSize: 17 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '60%', minHeight: '30%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a365d' },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingHorizontal: 20,
  },
  modalItemText: { fontSize: 15, color: '#2d3748', fontWeight: '500' },
  separator: { height: 1, backgroundColor: '#E2E8F0', marginLeft: 20 },
});