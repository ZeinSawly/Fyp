import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

// Icon for each domain (matched by code)
const DOMAIN_ICONS = {
  web_frontend: 'globe-outline',
  web_backend: 'server-outline',
  mobile_dev: 'phone-portrait-outline',
  ai_ml: 'sparkles-outline',
  data_science: 'analytics-outline',
  data_engineering: 'git-network-outline',
  cybersecurity: 'shield-checkmark-outline',
  devops_cloud: 'cloud-outline',
  game_dev: 'game-controller-outline',
  embedded_iot: 'hardware-chip-outline',
  systems_programming: 'terminal-outline',
  database_admin: 'file-tray-stacked-outline',
  qa_testing: 'bug-outline',
  blockchain: 'cube-outline',
};

const DOMAIN_COLORS = {
  web_frontend: '#3B82F6',
  web_backend: '#0EA5E9',
  mobile_dev: '#8B5CF6',
  ai_ml: '#EC4899',
  data_science: '#06B6D4',
  data_engineering: '#0891B2',
  cybersecurity: '#DC2626',
  devops_cloud: '#10B981',
  game_dev: '#F59E0B',
  embedded_iot: '#7C3AED',
  systems_programming: '#1E40AF',
  database_admin: '#0D9488',
  qa_testing: '#EA580C',
  blockchain: '#A855F7',
};

export default function QuizFieldSelection({ navigation, route }) {
  const student = route?.params?.student;

  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/quiz/domains');
      if (res.data.success) {
        setDomains(res.data.data || []);
      } else {
        Alert.alert('Error', 'Failed to load fields');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDomain = (domain) => {
    setSelectedDomain(domain);
    setSelectedLanguage(null);
  };

  const handleStartQuiz = async () => {
    if (!selectedDomain || !selectedLanguage) return;

    setStarting(true);
    try {
      const res = await api.post('/api/quiz/start', {
        student_id: student.id,
        domain_code: selectedDomain.code,
        language: selectedLanguage,
        question_count: 15,
      });

      if (res.data.success) {
        const sessionData = res.data.data;
        // Navigate to QuizSession with the session info
        navigation.replace('QuizSession', {
          student,
          session: sessionData,
        });
      } else {
        Alert.alert('Error', res.data.message || 'Failed to start quiz');
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || err.message || 'Failed to start quiz'
      );
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#553C9A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <LinearGradient colors={['#1a365d', '#553C9A']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Choose Your Field</Text>
        <Text style={styles.subtitle}>
          Step 1: Pick a CS area you think you're good at
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Domains grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SELECT A FIELD</Text>
          <View style={styles.grid}>
            {domains.map((d) => {
              const isSelected = selectedDomain?.id === d.id;
              const color = DOMAIN_COLORS[d.code] || '#64748B';
              const iconName = DOMAIN_ICONS[d.code] || 'help-circle-outline';

              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.domainCard,
                    isSelected && { borderColor: color, borderWidth: 2, backgroundColor: '#FFF' },
                  ]}
                  onPress={() => handleSelectDomain(d)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.domainIcon, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={iconName} size={22} color={color} />
                  </View>
                  <Text style={styles.domainName} numberOfLines={2}>
                    {d.name}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: color }]}>
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Language selection — only when a domain is picked */}
        {selectedDomain && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SELECT A LANGUAGE</Text>
            <Text style={styles.helperText}>
              Languages available for {selectedDomain.name}
            </Text>
            <View style={styles.languageGrid}>
              {selectedDomain.allowed_languages.map((lang) => {
                const isSelected = selectedLanguage === lang;
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.langChip,
                      isSelected && styles.langChipSelected,
                    ]}
                    onPress={() => setSelectedLanguage(lang)}
                  >
                    <Text style={[
                      styles.langChipText,
                      isSelected && styles.langChipTextSelected,
                    ]}>
                      {lang}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Summary card before starting */}
        {selectedDomain && selectedLanguage && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Field</Text>
              <Text style={styles.summaryValue}>{selectedDomain.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Language</Text>
              <Text style={styles.summaryValue}>{selectedLanguage}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Questions</Text>
              <Text style={styles.summaryValue}>15 (mixed difficulty)</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated time</Text>
              <Text style={styles.summaryValue}>~10-15 minutes</Text>
            </View>
          </View>
        )}

        {/* Spacer so content isn't behind the footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            (!selectedLanguage || starting) && styles.startButtonDisabled,
          ]}
          onPress={handleStartQuiz}
          disabled={!selectedLanguage || starting}
        >
          <LinearGradient
            colors={
              !selectedLanguage || starting
                ? ['#CBD5E1', '#94A3B8']
                : ['#1a365d', '#553C9A']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startGradient}
          >
            {starting ? (
              <>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.startText}>Generating questions...</Text>
              </>
            ) : (
              <>
                <Text style={styles.startText}>
                  {selectedLanguage ? 'Generate Questions' : 'Pick a language to continue'}
                </Text>
                {selectedLanguage && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: { padding: 4 },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
  },

  scrollContent: {
    padding: 20,
  },

  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  domainCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 110,
    position: 'relative',
  },
  domainIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  domainName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 17,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langChipSelected: {
    backgroundColor: '#553C9A',
    borderColor: '#553C9A',
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  langChipTextSelected: {
    color: '#FFF',
  },

  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: '60%',
    textAlign: 'right',
  },

  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  startButtonDisabled: {
    opacity: 0.9,
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  startText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});