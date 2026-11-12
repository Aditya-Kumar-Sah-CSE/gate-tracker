import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../stores/appStore';
import {
  getSubjectsInQueue,
  getPyqAttempts,
  logPyqAttempt,
} from '../../db/database';
import { Subject, PyqAttempt, MistakeCategory, DifficultyLevel } from '../../types';
import { Colors, Gradients } from '../../constants/theme';
import { Card3D } from '../../components/Card3D';

export default function PyqScreen() {
  const { dataVersion, triggerRefresh } = useAppStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attempts, setAttempts] = useState<PyqAttempt[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubjId, setSelectedSubjId] = useState('cs_cp');
  const [gateYear, setGateYear] = useState('2024');
  const [qNumber, setQNumber] = useState('1');
  const [marks, setMarks] = useState<1 | 2>(1);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [isCorrect, setIsCorrect] = useState(true);
  const [timeMins, setTimeMins] = useState('2');
  const [mistakeCat, setMistakeCat] = useState<MistakeCategory>('Conceptual mistake');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const [subjList, attemptList] = await Promise.all([
        getSubjectsInQueue(),
        getPyqAttempts(50),
      ]);
      setSubjects(subjList);
      setAttempts(attemptList);
      if (subjList.length > 0 && !selectedSubjId) {
        setSelectedSubjId(subjList[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dataVersion])
  );

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await logPyqAttempt({
        subject_id: selectedSubjId,
        gate_year: parseInt(gateYear, 10) || 2024,
        question_number: parseInt(qNumber, 10) || 1,
        marks,
        difficulty,
        is_correct: isCorrect,
        time_taken_seconds: (parseInt(timeMins, 10) || 2) * 60,
        mistake_category: isCorrect ? undefined : mistakeCat,
        notes: notes.trim() || undefined,
      });

      setModalVisible(false);
      setNotes('');
      await loadData();
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const totalAttempted = subjects.reduce((acc, s) => acc + s.pyqs_attempted, 0);
  const totalCorrect = subjects.reduce((acc, s) => acc + s.pyqs_correct, 0);
  const overallAcc = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>GATE PYQ Tracker</Text>
            <Text style={styles.headerSubtitle}>
              Target: 20 Questions/Day • Accuracy Analysis
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              setModalVisible(true);
            }}
            style={styles.logBtn}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.logBtnText}>Log PYQ</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Stats Card */}
        <Card3D gradient={Gradients.electricEmerald as any} style={styles.heroCard}>
          <View style={styles.heroGrid}>
            <View style={styles.heroCol}>
              <Text style={styles.heroLabel}>TOTAL SOLVED</Text>
              <Text style={styles.heroVal}>{totalAttempted}</Text>
              <Text style={styles.heroSub}>Target 20/day</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroCol}>
              <Text style={styles.heroLabel}>CORRECT</Text>
              <Text style={styles.heroVal}>{totalCorrect}</Text>
              <Text style={styles.heroSub}>Verified solutions</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroCol}>
              <Text style={styles.heroLabel}>ACCURACY</Text>
              <Text style={styles.heroVal}>{totalAttempted > 0 ? `${overallAcc}%` : 'N/A'}</Text>
              <Text style={styles.heroSub}>Target {'>'}75%</Text>
            </View>
          </View>
        </Card3D>

        {/* Tab Selector */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setActiveTab('overview')}
            style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Subject Performance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Recent Attempts ({attempts.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' ? (
            /* Subject Breakdown */
            <View style={styles.subjectList}>
              {subjects.map((subj) => {
                const acc =
                  subj.pyqs_attempted > 0
                    ? Math.round((subj.pyqs_correct / subj.pyqs_attempted) * 100)
                    : 0;

                return (
                  <Card3D
                    key={subj.id}
                    gradient={[subj.gradient_start, subj.gradient_end] as any}
                    style={styles.subjCard}
                  >
                    <View style={styles.subjRow}>
                      <View style={styles.subjLeft}>
                        <Ionicons name={subj.icon as any} size={20} color="#FFFFFF" />
                        <View>
                          <Text style={styles.subjName}>{subj.name}</Text>
                          <Text style={styles.subjMeta}>
                            {subj.pyqs_attempted} Attempted • {subj.pyqs_correct} Correct
                          </Text>
                        </View>
                      </View>
                      <View style={styles.accBadge}>
                        <Text style={styles.accVal}>
                          {subj.pyqs_attempted > 0 ? `${acc}%` : 'Not Started'}
                        </Text>
                      </View>
                    </View>
                  </Card3D>
                );
              })}
            </View>
          ) : (
            /* History List */
            <View style={styles.historyList}>
              {attempts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📝</Text>
                  <Text style={styles.emptyText}>No PYQs logged yet today</Text>
                  <Text style={styles.emptySub}>Tap 'Log PYQ' to record your first question!</Text>
                </View>
              ) : (
                attempts.map((att) => {
                  const subj = subjects.find((s) => s.id === att.subject_id);
                  return (
                    <View key={att.id} style={styles.historyCard}>
                      <View style={styles.historyRow}>
                        <View style={styles.historyLeft}>
                          <Ionicons
                            name={att.is_correct === 1 ? 'checkmark-circle' : 'close-circle'}
                            size={22}
                            color={att.is_correct === 1 ? '#10B981' : '#F43F5E'}
                          />
                          <View>
                            <Text style={styles.historyTitle}>
                              GATE {att.gate_year} • Q{att.question_number} ({att.marks}M)
                            </Text>
                            <Text style={styles.historySubj}>{subj?.name || att.subject_id}</Text>
                          </View>
                        </View>
                        <View style={styles.historyRight}>
                          <Text style={styles.historyTime}>
                            {Math.round(att.time_taken_seconds / 60)}m
                          </Text>
                          {att.mistake_category && (
                            <Text style={styles.mistakeTag}>{att.mistake_category}</Text>
                          )}
                        </View>
                      </View>
                      {att.notes && <Text style={styles.historyNotes}>{att.notes}</Text>}
                    </View>
                  );
                })
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Log PYQ Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log GATE PYQ Question</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Subject</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {subjects.map((s) => {
                    const sel = s.id === selectedSubjId;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => setSelectedSubjId(s.id)}
                        style={[styles.subjectChip, sel && { backgroundColor: s.color }]}
                      >
                        <Text style={[styles.chipText, sel && { color: '#FFFFFF', fontWeight: '700' }]}>
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>GATE Year</Text>
                    <TextInput
                      style={styles.textInput}
                      value={gateYear}
                      onChangeText={setGateYear}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Question Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={qNumber}
                      onChangeText={setQNumber}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Result: Correct or Incorrect */}
                <Text style={styles.fieldLabel}>Result</Text>
                <View style={styles.resultRow}>
                  <TouchableOpacity
                    onPress={() => setIsCorrect(true)}
                    style={[styles.resultBtn, isCorrect && styles.correctActive]}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.resultBtnText}>Correct (+{marks})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsCorrect(false)}
                    style={[styles.resultBtn, !isCorrect && styles.incorrectActive]}
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                    <Text style={styles.resultBtnText}>Incorrect</Text>
                  </TouchableOpacity>
                </View>

                {/* If incorrect, show mistake category */}
                {!isCorrect && (
                  <>
                    <Text style={styles.fieldLabel}>Mistake Category</Text>
                    {[
                      'Conceptual mistake',
                      'Calculation mistake',
                      'Silly mistake',
                      'Question misunderstood',
                      'Time management issue',
                    ].map((cat) => {
                      const sel = cat === mistakeCat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setMistakeCat(cat as MistakeCategory)}
                          style={[styles.catOption, sel && styles.catOptionActive]}
                        >
                          <Ionicons
                            name={sel ? 'radio-button-on' : 'radio-button-off'}
                            size={16}
                            color={sel ? '#F43F5E' : '#64748B'}
                          />
                          <Text style={[styles.catText, sel && { color: '#FFFFFF', fontWeight: '700' }]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}

                <Text style={styles.fieldLabel}>Notes / Formula Learned</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Key trap or concept in this question..."
                  placeholderTextColor="#64748B"
                  value={notes}
                  onChangeText={setNotes}
                />

                <TouchableOpacity onPress={handleSave} style={styles.submitBtn}>
                  <Text style={styles.submitBtnText}>Save PYQ Attempt</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  logBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroCard: {
    marginBottom: 14,
    borderRadius: 20,
  },
  heroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  heroCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroVal: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 4,
  },
  heroSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  heroDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollList: {
    flex: 1,
  },
  subjectList: {
    gap: 12,
  },
  subjCard: {
    borderRadius: 18,
  },
  subjRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subjName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  subjMeta: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  accBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  accVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  historySubj: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyTime: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  mistakeTag: {
    color: '#F43F5E',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  historyNotes: {
    color: '#CBD5E1',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.dark.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalBody: {
    paddingBottom: 20,
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 10,
  },
  chipRow: {
    marginBottom: 10,
  },
  subjectChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  chipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  resultBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  correctActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  incorrectActive: {
    backgroundColor: '#F43F5E',
    borderColor: '#F43F5E',
  },
  resultBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 6,
  },
  catOptionActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
  },
  catText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
