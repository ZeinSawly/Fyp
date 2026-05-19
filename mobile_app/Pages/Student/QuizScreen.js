import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function QuizScreen({ route, navigation }) {
  const {
    student, session_id, question: initialQuestion,
    question_number: initialQuestionNumber,
    total_questions, field_of_interest
  } = route.params;

  const [question, setQuestion] = useState(initialQuestion);
  const [questionNumber, setQuestionNumber] = useState(initialQuestionNumber);
  const [selectedOption, setSelectedOption] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState([]);

  const QUIZ_DURATION = 10 * 60; // 10 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time's up — navigate to results with current responses
          navigation.navigate('QuizResults', {
            student,
            skillScore: 0,
            field_of_interest,
            questionsAnswered: questionNumber - 1,
            responses,
            timeUp: true,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    return () => clearInterval(timerRef.current);
  }, []);

  // Stop timer when quiz is done
  const stopTimer = () => clearInterval(timerRef.current);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timerColor = timeLeft <= 60 ? '#c53030' : timeLeft <= 180 ? '#d97706' : '#2f855a';

  const canSubmit = selectedOption && explanation.trim().length >= 15;

  const getTypeLabel = (type) => {
    switch (type) {
      case 'mcq': return { label: 'Multiple Choice', color: '#5C6BC0', icon: 'help-circle-outline' };
      case 'output_prediction': return { label: 'Output Prediction', color: '#42A5F5', icon: 'code-slash-outline' };
      case 'spot_the_bug': return { label: 'Spot the Bug', color: '#EF5350', icon: 'bug-outline' };
      case 'scenario': return { label: 'Scenario', color: '#66BB6A', icon: 'bulb-outline' };
      case 'case_study': return { label: 'Case Study', color: '#FFA726', icon: 'document-text-outline' };
      default: return { label: type, color: '#94A3B8', icon: 'help-outline' };
    }
  };

  const getDifficultyLabel = (difficulty) => {
    if (difficulty === 1) return { label: 'Easy', color: '#66BB6A' };
    if (difficulty === 2) return { label: 'Medium', color: '#FFA726' };
    return { label: 'Hard', color: '#EF5350' };
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
  
    setSubmitting(true);
    try {
      const res = await api.post('/api/quiz/answer', {
        session_id,
        question_id: question.id,
        selected_option: selectedOption,
        explanation: explanation.trim(),
      });
  
      if (res.data.success) {
        // Save this response locally
        const newResponse = {
          questionNumber,
          questionText: question.question,
          type: question.type,
          code: question.code || null,
          code_lines: question.code_lines || null,
          options: question.options,
          selectedOption,
          correctAnswer: res.data.correctAnswer,
          optionCorrect: res.data.optionCorrect,
          explanation: explanation.trim(),
          explanationScore: res.data.explanationScore,
          finalScore: res.data.finalScore,
          feedback: res.data.feedback,
          questionExplanation: res.data.questionExplanation,
          difficulty: question.difficulty,
        };
  
        const updatedResponses = [...responses, newResponse];
        setResponses(updatedResponses);
  
        if (res.data.done) {
          stopTimer();
          // Quiz complete — go to results with all responses
          navigation.navigate('QuizResults', {
            student,
            skillScore: res.data.skillScore,
            field_of_interest,
            questionsAnswered: res.data.questionsAnswered,
            responses: updatedResponses,
          });
        } else {
          // Next question
          setQuestion(res.data.nextQuestion);
          setQuestionNumber(prev => prev + 1);
          setSelectedOption(null);
          setExplanation('');
        }
      } else {
        Alert.alert('Error', res.data.message || 'Failed to submit answer');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const typeInfo = getTypeLabel(question.type);
  const diffInfo = getDifficultyLabel(question.difficulty);
  const progress = (questionNumber - 1) / total_questions;

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <LinearGradient colors={['#1a365d', '#2b6cb0']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerField}>{field_of_interest}</Text>
          <Text style={styles.headerProgress}>{questionNumber} / {total_questions}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(progress) * 100}%` }]} />
        </View>

        {/* Timer */}
        <View style={styles.timerRow}>
          <Ionicons name="time-outline" size={16} color={timerColor} />
          <Text style={[styles.timerText, { color: timerColor }]}>
            {formatTime(timeLeft)}
          </Text>
          {timeLeft <= 60 && (
            <Text style={styles.timerWarning}>⚠ Time running out!</Text>
          )}
        </View>

        {/* Type and difficulty badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: typeInfo.color + '30' }]}>
            <Ionicons name={typeInfo.icon} size={12} color={typeInfo.color} />
            <Text style={[styles.badgeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: diffInfo.color + '30' }]}>
            <Text style={[styles.badgeText, { color: diffInfo.color }]}>{diffInfo.label}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.question}</Text>

          {/* Code block for output_prediction */}
          {question.code && (
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{question.code}</Text>
            </View>
          )}

          {/* Code lines for spot_the_bug */}
          {question.code_lines && (
            <View style={styles.codeBlock}>
              {Object.entries(question.code_lines).map(([key, line]) => (
                <View key={key} style={styles.codeLine}>
                  <Text style={styles.codeLineLabel}>{key}.</Text>
                  <Text style={styles.codeLineText}>{line}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Options */}
        <Text style={styles.sectionLabel}>Select your answer:</Text>
        <View style={styles.optionsContainer}>
          {Object.entries(question.options).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.optionCard,
                selectedOption === key && styles.optionCardSelected
              ]}
              onPress={() => setSelectedOption(key)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.optionKey,
                selectedOption === key && styles.optionKeySelected
              ]}>
                <Text style={[
                  styles.optionKeyText,
                  selectedOption === key && styles.optionKeyTextSelected
                ]}>
                  {key}
                </Text>
              </View>
              <Text style={[
                styles.optionValue,
                selectedOption === key && styles.optionValueSelected
              ]}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Explanation */}
        <Text style={styles.sectionLabel}>Explain your answer:</Text>
        <View style={styles.explanationContainer}>
          <TextInput
            style={styles.explanationInput}
            placeholder="Why did you choose this option? Explain your reasoning..."
            placeholderTextColor="#a0aec0"
            multiline
            numberOfLines={4}
            value={explanation}
            onChangeText={setExplanation}
            textAlignVertical="top"
          />
          <Text style={[
            styles.charCount,
            explanation.trim().length >= 15 ? { color: '#66BB6A' } : { color: '#94A3B8' }
          ]}>
            {explanation.trim().length} characters {explanation.trim().length < 15 ? `(min 15)` : '✓'}
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canSubmit ? ['#1a365d', '#2b6cb0'] : ['#CBD5E1', '#CBD5E1']}
            style={styles.submitGradient}
          >
            {submitting
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" />
            }
            <Text style={styles.submitText}>
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerField: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  headerProgress: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },
  timerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'center',
    marginTop: 8,
  },
  timerText: { fontSize: 16, fontWeight: '800' },
  timerWarning: { fontSize: 11, fontWeight: '700', color: '#c53030' },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  questionCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 20,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
  },
  questionText: { fontSize: 16, fontWeight: '700', color: '#1E293B', lineHeight: 24 },
  codeBlock: {
    backgroundColor: '#1E293B', borderRadius: 10, padding: 14, marginTop: 14,
  },
  codeText: { fontFamily: 'monospace', fontSize: 13, color: '#E2E8F0', lineHeight: 20 },
  codeLine: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  codeLineLabel: { fontSize: 13, fontWeight: '700', color: '#FFA726', fontFamily: 'monospace', minWidth: 20 },
  codeLineText: { fontSize: 13, color: '#E2E8F0', fontFamily: 'monospace', flex: 1 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 10 },
  optionsContainer: { gap: 10, marginBottom: 20 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 14, padding: 14, borderWidth: 2, borderColor: 'transparent',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
  },
  optionCardSelected: { borderColor: '#2b6cb0', backgroundColor: '#EFF6FF' },
  optionKey: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  optionKeySelected: { backgroundColor: '#2b6cb0' },
  optionKeyText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  optionKeyTextSelected: { color: '#FFF' },
  optionValue: { flex: 1, fontSize: 14, color: '#1E293B', lineHeight: 20 },
  optionValueSelected: { fontWeight: '600', color: '#1a365d' },
  explanationContainer: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 4,
    marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0',
    elevation: 2,
  },
  explanationInput: {
    padding: 12, fontSize: 14, color: '#2d3748', minHeight: 100,
  },
  charCount: { textAlign: 'right', fontSize: 11, fontWeight: '600', paddingRight: 12, paddingBottom: 8 },
  submitButton: { borderRadius: 16, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 10,
  },
  submitText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});