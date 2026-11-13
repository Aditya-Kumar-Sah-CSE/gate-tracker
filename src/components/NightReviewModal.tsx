import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Subject, DailyGoal, DailyProgress } from '../types';
import {
  getSubjectsInQueue,
  getActiveSubject,
  saveNightReview,
  getTodayProgress,
  getTodayGoals,
} from '../db/database';
import { Colors, Gradients } from '../constants/theme';
import { Card3D } from './Card3D';

interface NightReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (progress: DailyProgress) => void;
}

export function NightReviewModal({
  visible,
  onClose,
  onSaved,
}: NightReviewModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [lecturesDone, setLecturesDone] = useState<number>(0);
  const [dppsDone, setDppsDone] = useState<number>(0);
  const [pyqsDone, setPyqsDone] = useState<number>(0);
  const [studyHours, setStudyHours] = useState<number>(8);
  const [reflection, setReflection] = useState<string>('');
  const [todayGoal, setTodayGoal] = useState<DailyGoal | null>(null);

  useEffect(() => {
    if (!visible) return;
    let active = true;

    (async () => {
      try {
        const [subjList, activeSubj, prog, goal] = await Promise.all([
          getSubjectsInQueue(),
          getActiveSubject(),
          getTodayProgress(),
          getTodayGoals(),
        ]);

        if (!active) return;
        setSubjects(subjList);
        setSelectedSubjectId(activeSubj?.id || (subjList[0]?.id ?? ''));
        setTodayGoal(goal);

        // Pre-fill with existing today progress if recorded
        setLecturesDone(prog.lectures_completed || goal.target_lectures);
        setDppsDone(prog.dpps_completed || goal.target_dpps);
        setPyqsDone(prog.pyqs_attempted || goal.target_pyqs);
        setStudyHours(
          prog.total_study_seconds > 0
            ? Math.round((prog.total_study_seconds / 3600) * 10) / 10
            : Math.round(goal.target_study_minutes / 60)
        );
        if (prog.reflection_notes) {
          setReflection(prog.reflection_notes);
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      active = false;
    };
  }, [visible]);

  const calculateScore = () => {
    if (!todayGoal) return 100;
    const lPct = todayGoal.target_lectures > 0 ? (lecturesDone / todayGoal.target_lectures) * 100 : 100;
    const dPct = todayGoal.target_dpps > 0 ? (dppsDone / todayGoal.target_dpps) * 100 : 100;
    const pPct = todayGoal.target_pyqs > 0 ? (pyqsDone / todayGoal.target_pyqs) * 100 : 100;
    return Math.min(100, Math.round((lPct + dPct + pPct) / 3));
  };

  const handleSave = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const updatedProg = await saveNightReview({
        lectures_completed: lecturesDone,
        dpps_completed: dppsDone,
        pyqs_attempted: pyqsDone,
        pyqs_correct: Math.round(pyqsDone * 0.8), // Estimated 80% if not individually logged
        study_hours: studyHours,
        reflection_notes: reflection,
        subject_id: selectedSubjectId || undefined,
      });

      onSaved(updatedProg);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const score = calculateScore();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <LinearGradient
            colors={Gradients.cyberViolet as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerIcon}>🌙</Text>
                <View>
                  <Text style={styles.headerTitle}>9:00 PM Night Check-In</Text>
                  <Text style={styles.headerSubtitle}>{"Log today's GATE preparation achievements"}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Score Ring Banner */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
              style={styles.scoreBanner}
            >
              <View style={styles.scoreTextCol}>
                <Text style={styles.scoreLabel}>{"TODAY'S TARGET ACHIEVED"}</Text>
                <Text style={styles.scoreSub}>
                  {score >= 90
                    ? '🔥 Outstanding! Full preparation targets crushed.'
                    : score >= 60
                    ? '⚡ Great progress! Solid preparation day.'
                    : '🌱 Good effort! Keep building momentum tomorrow.'}
                </Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreNumber}>{score}%</Text>
              </View>
            </LinearGradient>

            {/* Subject Allocation */}
            <Text style={styles.sectionTitle}>ALLOCATE PROGRESS TO SUBJECT:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
              {subjects.map((subj) => {
                const isSelected = subj.id === selectedSubjectId;
                return (
                  <TouchableOpacity
                    key={subj.id}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedSubjectId(subj.id);
                    }}
                    style={[
                      styles.subjectChip,
                      isSelected && {
                        backgroundColor: subj.color,
                        borderColor: '#FFFFFF',
                        shadowColor: subj.color,
                        shadowOpacity: 0.6,
                        shadowRadius: 10,
                        elevation: 6,
                      },
                    ]}
                  >
                    <Ionicons
                      name={subj.icon as any}
                      size={16}
                      color={isSelected ? '#FFFFFF' : subj.color}
                    />
                    <Text
                      style={[
                        styles.subjectChipText,
                        isSelected && { color: '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {subj.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 1. Lectures Watched */}
            <Card3D gradient={Gradients.cyberViolet as any} style={styles.cardItem}>
              <View style={styles.itemRow}>
                <View>
                  <Text style={styles.itemTitle}>PW LECTURES WATCHED</Text>
                  <Text style={styles.itemGoal}>Goal: {todayGoal?.target_lectures ?? 5} lectures</Text>
                </View>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setLecturesDone((v) => Math.max(0, v - 1));
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{lecturesDone}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setLecturesDone((v) => v + 1);
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card3D>

            {/* 2. DPPs Solved */}
            <Card3D gradient={Gradients.oceanCyan as any} style={styles.cardItem}>
              <View style={styles.itemRow}>
                <View>
                  <Text style={styles.itemTitle}>DPP SHEETS SOLVED</Text>
                  <Text style={styles.itemGoal}>Goal: {todayGoal?.target_dpps ?? 2} sheets</Text>
                </View>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setDppsDone((v) => Math.max(0, v - 1));
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{dppsDone}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setDppsDone((v) => v + 1);
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card3D>

            {/* 3. PYQs Attempted */}
            <Card3D gradient={Gradients.electricEmerald as any} style={styles.cardItem}>
              <View style={styles.itemRow}>
                <View>
                  <Text style={styles.itemTitle}>GATE PYQS SOLVED</Text>
                  <Text style={styles.itemGoal}>Goal: {todayGoal?.target_pyqs ?? 20} questions</Text>
                </View>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setPyqsDone((v) => Math.max(0, v - 5));
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{pyqsDone}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setPyqsDone((v) => v + 5);
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card3D>

            {/* 4. Study Hours */}
            <Card3D gradient={Gradients.solarGold as any} style={styles.cardItem}>
              <View style={styles.itemRow}>
                <View>
                  <Text style={styles.itemTitle}>TOTAL STUDY HOURS</Text>
                  <Text style={styles.itemGoal}>Deep study focus time</Text>
                </View>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setStudyHours((v) => Math.max(1, Math.round((v - 0.5) * 10) / 10));
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{studyHours}h</Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setStudyHours((v) => Math.round((v + 0.5) * 10) / 10);
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card3D>

            {/* Reflection Note */}
            <Text style={styles.sectionTitle}>{"TODAY'S KEY TAKEAWAY / MISTAKE NOTICED:"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Mastered DFA minimization, need more practice on pointers..."
              placeholderTextColor="#64748B"
              value={reflection}
              onChangeText={setReflection}
              multiline
              numberOfLines={2}
            />

            {/* Save & Celebrate Button */}
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={Gradients.cyberViolet as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                <Ionicons name="flame" size={20} color="#FFD700" />
                <Text style={styles.saveBtnText}>{"CONFIRM & SAVE TODAY'S STREAK 🔥"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 26 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.dark.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    fontSize: 26,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 18,
  },
  scoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  scoreTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  scoreLabel: {
    color: '#A855F7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  scoreSub: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  scoreBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  scoreNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  subjectScroll: {
    marginBottom: 16,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: 10,
  },
  subjectChipText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  cardItem: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  itemGoal: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    minWidth: 32,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  saveBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
