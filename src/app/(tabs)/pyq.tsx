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
  Alert,
  Switch
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/appStore';
import {
  getPyqAttempts,
  logPyqAttempt,
  getWeakTopics,
  getMistakeLogs,
  resolveMistake,
  getAllSubjects,
  getTopicsForSubject
} from '../../db/database';
import { Badge } from '../../components/Badge';
import {
  PyqAttempt,
  WeakTopicAnalysis,
  MistakeLog,
  Subject,
  Topic,
  DifficultyLevel,
  MistakeCategory
} from '../../types';

export default function PyqScreen() {
  const { dataVersion, triggerRefresh, settings } = useAppStore();

  const [attempts, setAttempts] = useState<(PyqAttempt & { subject_name: string; topic_name: string })[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopicAnalysis[]>([]);
  const [mistakes, setMistakes] = useState<(MistakeLog & { subject_name: string; topic_name: string })[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState<'attempts' | 'weak' | 'mistakes'>('attempts');

  // Log Question Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubjId, setSelectedSubjId] = useState('c_prog');
  const [subjTopics, setSubjTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [yearInput, setYearInput] = useState('2024');
  const [qNumInput, setQNumInput] = useState('1');
  const [marks, setMarks] = useState<1 | 2>(1);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [isCorrect, setIsCorrect] = useState(true);
  const [timeTakenMins, setTimeTakenMins] = useState('2');
  const [mistakeCat, setMistakeCat] = useState<MistakeCategory>('Conceptual mistake');
  const [explanation, setExplanation] = useState('');

  const loadData = async () => {
    try {
      const [allAttempts, weakList, mistakeList, allSubjs] = await Promise.all([
        getPyqAttempts(),
        getWeakTopics(10),
        getMistakeLogs(),
        getAllSubjects()
      ]);

      setAttempts(allAttempts);
      setWeakTopics(weakList);
      setMistakes(mistakeList);
      setSubjects(allSubjs);

      if (allSubjs.length > 0) {
        const top = await getTopicsForSubject(selectedSubjId || allSubjs[0].id);
        setSubjTopics(top);
        if (top.length > 0 && !selectedTopicId) {
          setSelectedTopicId(top[0].id);
        }
      }
    } catch (e) {
      console.error('Error loading PYQ screen:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dataVersion, selectedSubjId])
  );

  const handleSubjectChange = async (subjId: string) => {
    setSelectedSubjId(subjId);
    const top = await getTopicsForSubject(subjId);
    setSubjTopics(top);
    if (top.length > 0) {
      setSelectedTopicId(top[0].id);
    }
  };

  const handleSaveAttempt = async () => {
    if (!selectedTopicId) {
      Alert.alert('Required', 'Please select a topic.');
      return;
    }

    const yearNum = parseInt(yearInput, 10) || 2024;
    const qNum = parseInt(qNumInput, 10) || 1;
    const timeSec = (parseFloat(timeTakenMins) || 2) * 60;

    await logPyqAttempt({
      gate_year: yearNum,
      subject_id: selectedSubjId,
      topic_id: selectedTopicId,
      question_number: qNum,
      marks,
      difficulty,
      is_correct: isCorrect,
      time_taken_seconds: timeSec,
      mistake_category: !isCorrect ? mistakeCat : null,
      explanation: !isCorrect ? explanation.trim() : null
    });

    setModalVisible(false);
    setExplanation('');
    triggerRefresh();
    await loadData();
    Alert.alert('Attempt Recorded', 'GATE PYQ performance updated.');
  };

  const handleResolveMistake = async (id: string, currentVal: number) => {
    await resolveMistake(id, currentVal === 0 ? true : false);
    triggerRefresh();
    await loadData();
  };

  const totalAttempted = attempts.length;
  const correctCount = attempts.filter((a) => a.is_correct === 1).length;
  const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttempts = attempts.filter((a) => a.attempted_at.startsWith(todayStr)).length;
  const todayTarget = settings?.daily_pyq_target || 20;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>GATE PYQ Tracker</Text>
            <Text style={styles.screenSub}>
              Daily Target: {todayAttempts}/{todayTarget} Questions
            </Text>
          </View>

          <TouchableOpacity style={styles.logBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={16} color="#0A0C10" />
            <Text style={styles.logBtnText}>Log PYQ</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Banner */}
        <View style={styles.statsBanner}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ATTEMPTED</Text>
            <Text style={styles.statVal}>{totalAttempted}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>CORRECT</Text>
            <Text style={[styles.statVal, { color: '#10B981' }]}>{correctCount}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ACCURACY</Text>
            <Text style={[styles.statVal, { color: '#38BDF8' }]}>
              {accuracy !== null ? `${accuracy}%` : 'Not Started'}
            </Text>
          </View>
        </View>

        {/* Segmented Tab Selector */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'attempts' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('attempts')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'attempts' && styles.segmentTextActive
              ]}
            >
              Attempts ({attempts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'weak' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('weak')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'weak' && styles.segmentTextActive
              ]}
            >
              Weak Topics ({weakTopics.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'mistakes' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('mistakes')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'mistakes' && styles.segmentTextActive
              ]}
            >
              Mistakes ({mistakes.filter((m) => m.is_resolved === 0).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <ScrollView style={styles.contentList} contentContainerStyle={{ padding: 16 }}>
          {/* TAB 1: Recent Attempts */}
          {activeTab === 'attempts' && (
            <>
              {attempts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="document-text-outline" size={36} color="#64748B" />
                  <Text style={styles.emptyTitle}>No Recorded PYQ Attempts</Text>
                  <Text style={styles.emptySub}>
                    Log your daily 20 PYQ questions. Accuracy is only calculated from real attempts.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyLogBtn}
                    onPress={() => setModalVisible(true)}
                  >
                    <Text style={styles.emptyLogBtnText}>Record First Question</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                attempts.map((a) => (
                  <View key={a.id} style={styles.attemptCard}>
                    <View style={styles.attemptLeft}>
                      <View
                        style={[
                          styles.resultIndicator,
                          { backgroundColor: a.is_correct === 1 ? '#10B981' : '#F43F5E' }
                        ]}
                      >
                        <Ionicons
                          name={a.is_correct === 1 ? 'checkmark' : 'close'}
                          size={14}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.attemptTitle}>
                          GATE {a.gate_year} • Q{a.question_number} ({a.marks} Mark)
                        </Text>
                        <Text style={styles.attemptTopic}>
                          {a.subject_name} • {a.topic_name}
                        </Text>
                        {a.mistake_category && (
                          <Text style={styles.attemptMistake}>
                            Reason: {a.mistake_category}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.attemptRight}>
                      <Badge label={a.difficulty} variant="neutral" size="sm" />
                      <Text style={styles.attemptTimeText}>
                        {Math.round(a.time_taken_seconds / 60)}m {a.time_taken_seconds % 60}s
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {/* TAB 2: Weak Topics */}
          {activeTab === 'weak' && (
            <>
              <View style={styles.weakInfoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#38BDF8" />
                <Text style={styles.weakInfoText}>
                  Topics with accuracy below 50% are Critical. Focus revision and re-practice here.
                </Text>
              </View>

              {weakTopics.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="shield-checkmark-outline" size={36} color="#10B981" />
                  <Text style={styles.emptyTitle}>No Critical Weak Topics Yet</Text>
                  <Text style={styles.emptySub}>
                    Requires at least 3 attempts per topic to establish statistically sound weakness metrics.
                  </Text>
                </View>
              ) : (
                weakTopics.map((w) => (
                  <View key={w.topic_id} style={styles.weakCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.weakCardTopic}>{w.topic_name}</Text>
                      <Text style={styles.weakCardSubj}>{w.subject_name}</Text>
                      <Text style={styles.weakCardStats}>
                        {w.correct_attempts}/{w.total_attempts} Correct Answers
                      </Text>
                    </View>

                    <View style={styles.weakCardRight}>
                      <Badge
                        label={w.status.toUpperCase()}
                        variant={w.status === 'Critical' ? 'danger' : 'warning'}
                      />
                      <Text style={styles.weakAccBig}>{w.accuracy}%</Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {/* TAB 3: Mistake Log Taxonomy */}
          {activeTab === 'mistakes' && (
            <>
              {mistakes.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="happy-outline" size={36} color="#10B981" />
                  <Text style={styles.emptyTitle}>Zero Unresolved Mistakes</Text>
                  <Text style={styles.emptySub}>
                    Incorrect questions are cataloged here into conceptual, calculation, silly, or time management errors.
                  </Text>
                </View>
              ) : (
                mistakes.map((m) => (
                  <View
                    key={m.id}
                    style={[styles.mistakeCard, m.is_resolved === 1 && styles.mistakeCardResolved]}
                  >
                    <View style={styles.mistakeTopRow}>
                      <Badge label={m.mistake_category} variant="danger" size="sm" />
                      <TouchableOpacity
                        style={[
                          styles.resolveBtn,
                          m.is_resolved === 1 && styles.resolveBtnDone
                        ]}
                        onPress={() => handleResolveMistake(m.id, m.is_resolved)}
                      >
                        <Ionicons
                          name={m.is_resolved === 1 ? 'checkmark-circle' : 'ellipse-outline'}
                          size={14}
                          color={m.is_resolved === 1 ? '#10B981' : '#94A3B8'}
                        />
                        <Text
                          style={[
                            styles.resolveBtnText,
                            m.is_resolved === 1 && { color: '#10B981' }
                          ]}
                        >
                          {m.is_resolved === 1 ? 'Resolved' : 'Mark Resolved'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.mistakeExpl}>{m.explanation}</Text>
                    <Text style={styles.mistakeSubjTopic}>
                      {m.subject_name} • {m.topic_name}
                    </Text>
                  </View>
                ))
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Log PYQ Attempt Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record GATE PYQ Attempt</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Subject Selector */}
            <Text style={styles.modalLabel}>Select Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {subjects.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.subjPill, selectedSubjId === s.id && styles.subjPillActive]}
                  onPress={() => handleSubjectChange(s.id)}
                >
                  <Text
                    style={[
                      styles.subjPillText,
                      selectedSubjId === s.id && styles.subjPillTextActive
                    ]}
                  >
                    {s.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Topic Selector */}
            <Text style={styles.modalLabel}>Select Topic</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {subjTopics.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.subjPill, selectedTopicId === t.id && styles.subjPillActive]}
                  onPress={() => setSelectedTopicId(t.id)}
                >
                  <Text
                    style={[
                      styles.subjPillText,
                      selectedTopicId === t.id && styles.subjPillTextActive
                    ]}
                  >
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Year & Question Number */}
            <View style={styles.inputsRow}>
              <View style={styles.inputCol}>
                <Text style={styles.modalLabel}>GATE Year</Text>
                <TextInput
                  style={styles.modalInput}
                  value={yearInput}
                  onChangeText={setYearInput}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.modalLabel}>Question #</Text>
                <TextInput
                  style={styles.modalInput}
                  value={qNumInput}
                  onChangeText={setQNumInput}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Marks & Difficulty */}
            <View style={styles.inputsRow}>
              <View style={styles.inputCol}>
                <Text style={styles.modalLabel}>Marks</Text>
                <View style={styles.btnGroup}>
                  <TouchableOpacity
                    style={[styles.groupBtn, marks === 1 && styles.groupBtnActive]}
                    onPress={() => setMarks(1)}
                  >
                    <Text style={[styles.groupBtnText, marks === 1 && styles.groupBtnTextActive]}>
                      1 Mark
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.groupBtn, marks === 2 && styles.groupBtnActive]}
                    onPress={() => setMarks(2)}
                  >
                    <Text style={[styles.groupBtnText, marks === 2 && styles.groupBtnTextActive]}>
                      2 Marks
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputCol}>
                <Text style={styles.modalLabel}>Difficulty</Text>
                <View style={styles.btnGroup}>
                  {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.groupBtn, difficulty === d && styles.groupBtnActive]}
                      onPress={() => setDifficulty(d)}
                    >
                      <Text style={[styles.groupBtnText, difficulty === d && styles.groupBtnTextActive]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Correct Switch */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>
                Result:{' '}
                <Text style={{ color: isCorrect ? '#10B981' : '#F43F5E', fontWeight: '800' }}>
                  {isCorrect ? 'CORRECT' : 'INCORRECT'}
                </Text>
              </Text>
              <Switch
                value={isCorrect}
                onValueChange={setIsCorrect}
                trackColor={{ false: '#F43F5E', true: '#10B981' }}
              />
            </View>

            {/* Time Taken */}
            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>Time Taken (Minutes)</Text>
              <TextInput
                style={styles.modalInput}
                value={timeTakenMins}
                onChangeText={setTimeTakenMins}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Mistake Taxonomy if Incorrect */}
            {!isCorrect && (
              <View style={styles.mistakeTaxonomyBox}>
                <Text style={styles.modalLabel}>Error Classification</Text>
                <View style={styles.catWrap}>
                  {[
                    'Conceptual mistake',
                    'Calculation mistake',
                    'Silly mistake',
                    'Question misunderstood',
                    'Time management issue'
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChoice,
                        mistakeCat === cat && styles.catChoiceActive
                      ]}
                      onPress={() => setMistakeCat(cat as MistakeCategory)}
                    >
                      <Text
                        style={[
                          styles.catChoiceText,
                          mistakeCat === cat && styles.catChoiceTextActive
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.modalLabel}>Mistake Explanation / Root Cause</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60 }]}
                  value={explanation}
                  onChangeText={setExplanation}
                  placeholder="Why was it missed? What formula/concept was overlooked?"
                  placeholderTextColor="#64748B"
                  multiline
                />
              </View>
            )}

            <TouchableOpacity style={styles.saveAttemptBtn} onPress={handleSaveAttempt}>
              <Text style={styles.saveAttemptBtnText}>Save Attempt Record</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0C10',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  screenSub: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
    marginTop: 2,
  },
  logBtn: {
    backgroundColor: '#38BDF8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0C10',
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#131720',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#232A3B',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#232A3B',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  segmentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#131720',
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  segmentBtnActive: {
    backgroundColor: '#1E2536',
    borderColor: '#38BDF8',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#38BDF8',
  },
  contentList: {
    flex: 1,
  },
  attemptCard: {
    backgroundColor: '#131720',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  attemptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  resultIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attemptTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  attemptTopic: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  attemptMistake: {
    fontSize: 11,
    color: '#F43F5E',
    marginTop: 2,
    fontWeight: '500',
  },
  attemptRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  attemptTimeText: {
    fontSize: 10,
    color: '#64748B',
  },
  weakInfoBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  weakInfoText: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 16,
  },
  weakCard: {
    backgroundColor: '#131720',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weakCardTopic: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  weakCardSubj: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  weakCardStats: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  weakCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  weakAccBig: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F43F5E',
  },
  mistakeCard: {
    backgroundColor: '#131720',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 14,
    marginBottom: 8,
  },
  mistakeCardResolved: {
    opacity: 0.6,
  },
  mistakeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  resolveBtnDone: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  resolveBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  mistakeExpl: {
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 18,
    marginBottom: 6,
  },
  mistakeSubjTopic: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#131720',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  emptyLogBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  emptyLogBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A0C10',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#131720',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#232A3B',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  hScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  subjPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
    marginRight: 6,
  },
  subjPillActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  subjPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  subjPillTextActive: {
    color: '#0A0C10',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputCol: {
    flex: 1,
  },
  modalInput: {
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  groupBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
    alignItems: 'center',
  },
  groupBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  groupBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  groupBtnTextActive: {
    color: '#38BDF8',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1E2536',
    marginVertical: 10,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  inputGroup: {
    marginBottom: 12,
  },
  mistakeTaxonomyBox: {
    backgroundColor: '#171C28',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  catWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  catChoice: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#131720',
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  catChoiceActive: {
    borderColor: '#F43F5E',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  catChoiceText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  catChoiceTextActive: {
    color: '#F43F5E',
    fontWeight: '700',
  },
  saveAttemptBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  saveAttemptBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0C10',
  },
});

