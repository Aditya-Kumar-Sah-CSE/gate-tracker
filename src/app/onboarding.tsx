import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../stores/appStore';
import { Badge } from '../components/Badge';

export default function OnboardingScreen() {
  const { settings, updateSettings, triggerRefresh } = useAppStore();

  const [startDate, setStartDate] = useState(
    settings?.prep_start_date || new Date().toISOString().slice(0, 10)
  );
  const [examDate, setExamDate] = useState(
    settings?.target_exam_date || '2027-02-06'
  );
  const [dailyHours, setDailyHours] = useState('8.0');
  const [dailyLectures, setDailyLectures] = useState('5');
  const [dailyDpps, setDailyDpps] = useState('2');
  const [dailyPyqs, setDailyPyqs] = useState('20');
  const [dailyRevisionMins, setDailyRevisionMins] = useState('60');
  const [restDay, setRestDay] = useState('Sunday');
  const [weakSubj1, setWeakSubj1] = useState('CS-COA');
  const [weakSubj2, setWeakSubj2] = useState('CS-CD');

  const subjectsList = [
    { code: 'CS-GA', name: 'General Aptitude (18 Lec / 19 DPP)' },
    { code: 'CS-TOC', name: 'Theory of Computation (29 Lec / 5 DPP)' },
    { code: 'CS-CP', name: 'C Programming (22 Lec / 11 DPP)' },
    { code: 'CS-DM', name: 'Discrete Mathematics (48 Lec / 6 DPP)' },
    { code: 'CS-DSA', name: 'Data Structures & Algorithms (Est. 30)' },
    { code: 'CS-DBMS', name: 'DBMS (Est. 30)' },
    { code: 'CS-OS', name: 'Operating Systems (Est. 30)' },
    { code: 'CS-CN', name: 'Computer Networks (Est. 30)' },
    { code: 'CS-DL', name: 'Digital Logic (Est. 30)' },
    { code: 'CS-COA', name: 'COA (Est. 30)' },
    { code: 'CS-CD', name: 'Compiler Design (Est. 30)' },
    { code: 'CS-EM', name: 'Engineering Mathematics (Est. 30)' }
  ];

  const handleFinish = async () => {
    const hoursNum = parseFloat(dailyHours) || 8.0;
    const lecNum = parseInt(dailyLectures, 10) || 5;
    const dppNum = parseInt(dailyDpps, 10) || 2;
    const pyqNum = parseInt(dailyPyqs, 10) || 20;
    const revNum = parseInt(dailyRevisionMins, 10) || 60;

    if (!startDate || !examDate) {
      Alert.alert('Required Fields', 'Please enter valid start and exam dates.');
      return;
    }

    try {
      await updateSettings({
        prep_start_date: startDate.trim(),
        target_exam_date: examDate.trim(),
        daily_study_hours_target: hoursNum,
        daily_lecture_target: lecNum,
        daily_dpp_target: dppNum,
        daily_pyq_target: pyqNum,
        daily_revision_minutes_target: revNum,
        rest_day_preference: restDay,
        weak_subject_1: weakSubj1,
        weak_subject_2: weakSubj2,
        is_onboarded: 1,
      });

      triggerRefresh();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save setup');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <Badge label="OFFICIAL BATCH COMPANION" variant="primary" />
          </View>
          <Text style={styles.title}>GATE TRACK 90</Text>
          <Text style={styles.subtitle}>
            Parakram GATE 2027 Batch B - (Hinglish) - Computer Science
          </Text>
          <Text style={styles.tagline}>
            STUDY → REVISE → PRACTICE → ANALYSE → IMPROVE
          </Text>
        </View>

        {/* Card: Batch Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="school-outline" size={18} color="#38BDF8" />
            <Text style={styles.cardTitle}>Physics Wallah Batch Config</Text>
          </View>
          <Text style={styles.cardDesc}>
            Pre-configured with actual Physics Wallah course distribution: General Aptitude (18 Lec / 19 DPP), TOC (29 Lec / 5 DPP), C Programming (22 Lec / 11 DPP), Discrete Maths (48 Lec / 6 DPP), and remaining subjects with 30 estimated lectures.
          </Text>
        </View>

        {/* Card: Dates */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={18} color="#38BDF8" />
            <Text style={styles.cardTitle}>Preparation Timeline</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preparation Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target GATE Exam Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={examDate}
              onChangeText={setExamDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        {/* Card: Daily Fixed Targets */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flame-outline" size={18} color="#F59E0B" />
            <Text style={styles.cardTitle}>Daily Fixed Targets</Text>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>PW Lectures</Text>
              <TextInput
                style={styles.input}
                value={dailyLectures}
                onChangeText={setDailyLectures}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>DPP Sheets</Text>
              <TextInput
                style={styles.input}
                value={dailyDpps}
                onChangeText={setDailyDpps}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>GATE PYQs</Text>
              <TextInput
                style={styles.input}
                value={dailyPyqs}
                onChangeText={setDailyPyqs}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Revision (Mins)</Text>
              <TextInput
                style={styles.input}
                value={dailyRevisionMins}
                onChangeText={setDailyRevisionMins}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Study Hours Target</Text>
            <TextInput
              style={styles.input}
              value={dailyHours}
              onChangeText={setDailyHours}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weekly Buffer / Rest Day</Text>
            <TextInput
              style={styles.input}
              value={restDay}
              onChangeText={setRestDay}
              placeholder="e.g. Sunday or None"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        {/* Card: Weak Subjects */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="warning-outline" size={18} color="#F43F5E" />
            <Text style={styles.cardTitle}>Focus Priority Subjects</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weakest Subject (Priority 1)</Text>
            <TextInput
              style={styles.input}
              value={weakSubj1}
              onChangeText={setWeakSubj1}
              placeholder="e.g. CS-COA"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Second Weakest Subject (Priority 2)</Text>
            <TextInput
              style={styles.input}
              value={weakSubj2}
              onChangeText={setWeakSubj2}
              placeholder="e.g. CS-CD"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleFinish}>
          <Text style={styles.submitBtnText}>Initialize GATE 2027 Planner</Text>
          <Ionicons name="arrow-forward" size={18} color="#0A0C10" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0C10',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  badgeRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#38BDF8',
    marginTop: 4,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#131720',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  cardDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
  },
  inputGroup: {
    marginBottom: 14,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0C10',
  },
});

