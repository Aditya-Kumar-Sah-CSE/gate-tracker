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
  Switch,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../stores/appStore';
import {
  getSubjectsInQueue,
  moveSubjectQueue,
  setSubjectActive,
  updateSubjectProgress,
  updateSubjectDetails,
} from '../../db/database';
import { Subject } from '../../types';
import { Colors, Gradients } from '../../constants/theme';
import { Card3D } from '../../components/Card3D';

export default function QueueScreen() {
  const { dataVersion, triggerRefresh } = useAppStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSubj, setEditingSubj] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [editTotalLec, setEditTotalLec] = useState('');
  const [editIsEstimated, setEditIsEstimated] = useState(false);
  const [editTotalDpps, setEditTotalDpps] = useState('');

  const loadData = async () => {
    try {
      const list = await getSubjectsInQueue();
      setSubjects(list);
    } catch (e) {
      console.error('Error loading subjects queue:', e);
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

  const handleMove = async (subjectId: string, direction: 'up' | 'down') => {
    triggerHaptic();
    await moveSubjectQueue(subjectId, direction);
    await loadData();
    triggerRefresh();
  };

  const handleMakeActive = async (subjectId: string) => {
    triggerHaptic();
    await setSubjectActive(subjectId);
    await loadData();
    triggerRefresh();
  };

  const handleProgress = async (
    subjectId: string,
    delta: {
      completed_lectures?: number;
      completed_dpps?: number;
      pyqs_attempted?: number;
    }
  ) => {
    triggerHaptic();
    await updateSubjectProgress(subjectId, delta);
    await loadData();
    triggerRefresh();
  };

  const openEdit = (subj: Subject) => {
    setEditingSubj(subj);
    setEditName(subj.name);
    setEditTotalLec(subj.total_lectures.toString());
    setEditIsEstimated(subj.is_lecture_count_estimated === 1);
    setEditTotalDpps(subj.total_dpps.toString());
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editingSubj) return;
    try {
      const totalLec = parseInt(editTotalLec, 10) || editingSubj.total_lectures;
      const totalDpp = parseInt(editTotalDpps, 10) || 0;
      await updateSubjectDetails(editingSubj.id, {
        name: editName.trim() || editingSubj.name,
        total_lectures: totalLec,
        total_dpps: totalDpp,
        is_lecture_count_estimated: editIsEstimated ? 1 : 0,
      });
      setEditModalVisible(false);
      setEditingSubj(null);
      await loadData();
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>GATE Study Queue</Text>
            <Text style={styles.headerSubtitle}>
              Organize subjects in your priority order • #1 is Active
            </Text>
          </View>
          <View style={styles.subjectCountBadge}>
            <Text style={styles.subjectCountText}>{subjects.length} Subjects</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {subjects.map((subj, index) => {
            const isFirst = index === 0;
            const isLast = index === subjects.length - 1;
            const isActive = subj.is_active === 1 || isFirst;

            const lecPct =
              subj.total_lectures > 0
                ? Math.min(100, Math.round((subj.completed_lectures / subj.total_lectures) * 100))
                : 0;

            const dppPct =
              subj.total_dpps > 0
                ? Math.min(100, Math.round((subj.completed_dpps / subj.total_dpps) * 100))
                : 0;

            const accuracy =
              subj.pyqs_attempted > 0
                ? Math.round((subj.pyqs_correct / subj.pyqs_attempted) * 100)
                : 0;

            return (
              <Card3D
                key={subj.id}
                gradient={[subj.gradient_start, subj.gradient_end] as any}
                style={[
                  styles.cardWrapper,
                  isActive && {
                    borderColor: '#FFFFFF',
                    shadowColor: subj.color,
                    shadowOpacity: 0.65,
                    shadowRadius: 20,
                  },
                ]}
              >
                {/* Card Top Row: Rank, Title, Queue Buttons */}
                <View style={styles.cardHeader}>
                  <View style={styles.titleGroup}>
                    <View
                      style={[
                        styles.rankPill,
                        isActive && { backgroundColor: '#FFFFFF' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankPillText,
                          isActive && { color: subj.color, fontWeight: '800' },
                        ]}
                      >
                        {isActive ? '★ #1 ACTIVE' : `#${subj.queue_order}`}
                      </Text>
                    </View>
                    <View style={styles.nameWrap}>
                      <Text style={styles.subjectName}>{subj.name}</Text>
                      <Text style={styles.subjectCode}>{subj.code}</Text>
                    </View>
                  </View>

                  {/* Actions: Up, Down, Edit */}
                  <View style={styles.actionGroup}>
                    {!isFirst && (
                      <TouchableOpacity
                        onPress={() => handleMove(subj.id, 'up')}
                        style={styles.iconBtn}
                      >
                        <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    {!isLast && (
                      <TouchableOpacity
                        onPress={() => handleMove(subj.id, 'down')}
                        style={styles.iconBtn}
                      >
                        <Ionicons name="arrow-down" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => openEdit(subj)}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="pencil" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3 Metric Rows: Lectures, DPP, PYQ */}
                <View style={styles.countersContainer}>
                  {/* 1. LECTURES */}
                  <View style={styles.counterRow}>
                    <View style={styles.counterInfo}>
                      <View style={styles.labelWithTag}>
                        <Ionicons name="play-circle" size={15} color="#FFFFFF" />
                        <Text style={styles.counterLabel}>Lectures Seen</Text>
                        {subj.is_lecture_count_estimated === 1 && (
                          <View style={styles.estBadge}>
                            <Text style={styles.estBadgeText}>ESTIMATED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.counterStats}>
                        {subj.completed_lectures} / {subj.total_lectures} ({lecPct}%)
                      </Text>
                      {/* Mini Progress Bar */}
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${lecPct}%` }]} />
                      </View>
                    </View>
                    <View style={styles.stepperGroup}>
                      <TouchableOpacity
                        onPress={() =>
                          handleProgress(subj.id, { completed_lectures: -1 })
                        }
                        style={styles.stepBtn}
                      >
                        <Ionicons name="remove" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          handleProgress(subj.id, { completed_lectures: 1 })
                        }
                        style={[styles.stepBtn, styles.stepBtnAdd]}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 2. DPPs */}
                  <View style={styles.counterRow}>
                    <View style={styles.counterInfo}>
                      <View style={styles.labelWithTag}>
                        <Ionicons name="document-text" size={15} color="#FFFFFF" />
                        <Text style={styles.counterLabel}>DPPs Solved</Text>
                      </View>
                      <Text style={styles.counterStats}>
                        {subj.completed_dpps} / {subj.total_dpps}{' '}
                        {subj.total_dpps > 0 ? `(${dppPct}%)` : '(Unset)'}
                      </Text>
                      {/* Mini Progress Bar */}
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${dppPct}%`,
                              backgroundColor: '#06B6D4',
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.stepperGroup}>
                      <TouchableOpacity
                        onPress={() =>
                          handleProgress(subj.id, { completed_dpps: -1 })
                        }
                        style={styles.stepBtn}
                      >
                        <Ionicons name="remove" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          handleProgress(subj.id, { completed_dpps: 1 })
                        }
                        style={[styles.stepBtn, styles.stepBtnAdd]}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 3. PYQs */}
                  <View style={styles.counterRow}>
                    <View style={styles.counterInfo}>
                      <View style={styles.labelWithTag}>
                        <Ionicons name="trophy" size={15} color="#FFFFFF" />
                        <Text style={styles.counterLabel}>GATE PYQs Attempted</Text>
                        {subj.pyqs_attempted > 0 && (
                          <View style={styles.accBadge}>
                            <Text style={styles.accBadgeText}>{accuracy}% Acc</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.counterStats}>
                        {subj.pyqs_attempted} Attempted • {subj.pyqs_correct} Correct
                      </Text>
                    </View>
                    <View style={styles.stepperGroup}>
                      <TouchableOpacity
                        onPress={() =>
                          handleProgress(subj.id, { pyqs_attempted: -1 })
                        }
                        style={styles.stepBtn}
                      >
                        <Ionicons name="remove" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          handleProgress(subj.id, {
                            pyqs_attempted: 1,
                            // Assume correct on quick log
                          })
                        }
                        style={[styles.stepBtn, styles.stepBtnAdd]}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Make Active Shortcut if not #1 */}
                {!isActive && (
                  <TouchableOpacity
                    onPress={() => handleMakeActive(subj.id)}
                    style={styles.makeActiveBtn}
                  >
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.makeActiveText}>SET AS ACTIVE SUBJECT</Text>
                  </TouchableOpacity>
                )}
              </Card3D>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Edit Subject Modal */}
        <Modal visible={editModalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Subject Parameters</Text>
              <Text style={styles.modalSub}>{editingSubj?.name}</Text>

              <Text style={styles.inputLabel}>Subject Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor="#64748B"
              />

              <Text style={styles.inputLabel}>Total Lectures</Text>
              <TextInput
                style={styles.input}
                value={editTotalLec}
                onChangeText={setEditTotalLec}
                keyboardType="numeric"
                placeholderTextColor="#64748B"
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is Lecture Count Estimated?</Text>
                <Switch
                  value={editIsEstimated}
                  onValueChange={setEditIsEstimated}
                  trackColor={{ false: '#334155', true: '#8B5CF6' }}
                />
              </View>

              <Text style={styles.inputLabel}>Total DPP Sheets</Text>
              <TextInput
                style={styles.input}
                value={editTotalDpps}
                onChangeText={setEditTotalDpps}
                keyboardType="numeric"
                placeholderTextColor="#64748B"
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  onPress={() => setEditModalVisible(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveEdit} style={styles.modalSaveBtn}>
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
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
  subjectCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  subjectCountText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  nameWrap: {
    flex: 1,
  },
  subjectName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subjectCode: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countersContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterInfo: {
    flex: 1,
    paddingRight: 10,
  },
  labelWithTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  estBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  estBadgeText: {
    color: '#FCD34D',
    fontSize: 8,
    fontWeight: '800',
  },
  accBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  accBadgeText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
  },
  counterStats: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    marginTop: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnAdd: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  makeActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  makeActiveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  switchLabel: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
