import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function QuizIntro({ navigation, route }) {
  const student = route?.params?.student;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <LinearGradient
        colors={['#1a365d', '#553C9A']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="bulb-outline" size={36} color="#FFF" />
          </View>
          <Text style={styles.title}>Career Skills{'\n'}Assessment</Text>
          <Text style={styles.subtitle}>
            Discover your strengths. Map your path.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* What is this */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          <Text style={styles.descriptionText}>
            Pick a Computer Science field you think you're good at and a programming language. We'll generate 15 rigorous, real-world questions to assess your actual skill level — not just textbook knowledge.
          </Text>
        </View>

        {/* Feature cards */}
        <View style={styles.features}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="code-slash-outline" size={22} color="#2b6cb0" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>AI-Generated</Text>
              <Text style={styles.featureDesc}>
                Fresh questions every time, tailored to your chosen field and language
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#F0FFF4' }]}>
              <Ionicons name="bulb" size={22} color="#15803D" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Reasoning Required</Text>
              <Text style={styles.featureDesc}>
                Explain WHY you chose each answer — we catch lucky guesses
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="trending-up-outline" size={22} color="#C2410C" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Real-World Skills</Text>
              <Text style={styles.featureDesc}>
                Code reading, debugging, tradeoffs, and engineering scenarios
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="trophy-outline" size={22} color="#6B21A8" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Proficiency Score</Text>
              <Text style={styles.featureDesc}>
                Get a measured skill level from Beginner to Expert
              </Text>
            </View>
          </View>
        </View>

        {/* Quiz format card */}
        <View style={styles.formatCard}>
          <Text style={styles.formatTitle}>Quiz Format</Text>
          <View style={styles.formatRow}>
            <Ionicons name="checkmark-circle" size={18} color="#15803D" />
            <Text style={styles.formatText}>15 multiple-choice questions</Text>
          </View>
          <View style={styles.formatRow}>
            <Ionicons name="checkmark-circle" size={18} color="#15803D" />
            <Text style={styles.formatText}>Pick an answer + explain your reasoning</Text>
          </View>
          <View style={styles.formatRow}>
            <Ionicons name="checkmark-circle" size={18} color="#15803D" />
            <Text style={styles.formatText}>Mix of easy, medium, and hard questions</Text>
          </View>
          <View style={styles.formatRow}>
            <Ionicons name="checkmark-circle" size={18} color="#15803D" />
            <Text style={styles.formatText}>~10-15 minutes to complete</Text>
          </View>
        </View>

        {/* Past attempts */}
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => navigation.navigate('QuizHistory', { student })}
        >
          <Ionicons name="time-outline" size={20} color="#475569" />
          <Text style={styles.historyText}>View past attempts</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>

      {/* Start button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('QuizFieldSelection', { student })}
        >
          <LinearGradient
            colors={['#1a365d', '#553C9A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startGradient}
          >
            <Text style={styles.startText}>Start Assessment</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },

  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },

  features: {
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
    elevation: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },

  formatCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  formatTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  formatText: {
    fontSize: 13,
    color: '#475569',
  },

  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  historyText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
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
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  startText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});