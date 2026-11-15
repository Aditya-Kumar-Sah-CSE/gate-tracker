import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Subject, DailyGoal } from '../types';
import { getSubjectsInQueue, saveMorningGoals } from '../db/database';
import { DEFAULT_GATE_SUBJECTS } from '../constants/gateSyllabus';
import { Colors, Gradients } from '../constants/theme';
import { Card3D } from './Card3D';
import { CosmicModal } from './CosmicModal';

interface MorningTargetModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (goal: DailyGoal) => void;
  currentGoal?: DailyGoal | null;
}

export function MorningTargetModal({
  visible,
  onClose,
  onSaved,
  currentGoal,
}: MorningTargetModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('cs_cp');
  const [targetLectures, setTargetLectures] = useState<number>(5);
  const [targetDpps, setTargetDpps] = useState<number>(2);
  const [targetPyqs, setTargetPyqs] = useState<number>(20);
  const [isSaving, setIsSaving] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible) return;
    let active = true;

    (async () => {
      try {
        const list = await getSubjectsInQueue();
        if (!active) return;
        setSubjects(list);

        if (currentGoal) {
          setTargetLectures(currentGoal.target_lectures);
          setTargetDpps(currentGoal.target_dpps);
          setTargetPyqs(currentGoal.target_pyqs);
          if (currentGoal.focus_subject_id) {
            setSelectedSubjectId(currentGoal.focus_subject_id);
          }
        } else if (list.length > 0) {
          setSelectedSubjectId(list[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      active = false;
    };
  }, [visible, currentGoal]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const goal = await saveMorningGoals({
        target_lectures: targetLectures,
        target_dpps: targetDpps,
        target_pyqs: targetPyqs,
        target_study_minutes: 480, // Default 8h in DB background
        focus_subject_id: selectedSubjectId,
      });
      onSaved(goal);
      setSuccessModalVisible(true);
    } catch (e: any) {
      console.error('Target lock error:', e);
      setErrorMessage(e?.message || 'Could not lock target. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    onClose();
  };

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const displaySubjects: Subject[] =
    subjects.length > 0 ? subjects : (DEFAULT_GATE_SUBJECTS as unknown as Subject[]);
  const selectedSubj = displaySubjects.find((s) => s.id === selectedSubjectId) || displaySubjects[0];

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <LinearGradient
            colors={Gradients.sunsetBlaze as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerIcon}>🌅</Text>
                <View>
                  <Text style={styles.headerTitle}>Morning Kickoff</Text>
                  <Text style={styles.headerSubtitle}>{"Set today's GATE preparation target"}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Step 1: Focus Subject Picker */}
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>STEP 1</Text>
              </View>
              <Text style={styles.sectionTitle}>{"SELECT TODAY'S SUBJECT TO STUDY"}</Text>
            </View>

            {/* Selected Subject Banner */}
            {selectedSubj && (
              <View style={[styles.selectedBanner, { borderColor: selectedSubj.color }]}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedBannerTitle}>
                    Focusing on: {selectedSubj.name}
                  </Text>
                  <Text style={styles.selectedBannerSub}>
                    {selectedSubj.total_lectures} Total Lectures • {selectedSubj.total_dpps} DPP Sheets • Status: {selectedSubj.status ? selectedSubj.status.toUpperCase() : 'IN QUEUE'}
                  </Text>
                </View>
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
              {displaySubjects.map((subj) => {
                const isSelected = subj.id === (selectedSubj?.id || selectedSubjectId);
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
                        shadowOpacity: 0.7,
                        shadowRadius: 12,
                        elevation: 8,
                      },
                    ]}
                  >
                    <Ionicons
                      name={subj.icon as any}
                      size={18}
                      color={isSelected ? '#FFFFFF' : subj.color}
                    />
                    <View>
                      <Text
                        style={[
                          styles.subjectChipText,
                          isSelected && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        {subj.name}
                      </Text>
                      <Text
                        style={[
                          styles.subjectChipSub,
                          isSelected && { color: 'rgba(255, 255, 255, 0.9)' },
                        ]}
                      >
                        {subj.code} • {subj.status === 'done' ? '✓ Done' : '⚡ Doing'}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Step 2: Set Daily Targets */}
            <View style={[styles.stepHeaderRow, { marginTop: 14 }]}>
              <View style={[styles.stepNumberBadge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.stepNumberText}>STEP 2</Text>
              </View>
              <Text style={styles.sectionTitle}>{"LOCK TODAY'S DAILY TARGETS"}</Text>
            </View>

            {/* Target 1: Lectures */}
            <Card3D gradient={Gradients.cyberViolet as any} style={styles.targetCard}>
              <View style={styles.targetRow}>
                <View style={styles.targetInfo}>
                  <Text style={styles.targetLabel}>PW LECTURES</Text>
                  <Text style={styles.targetSub}>Watch & understand concepts</Text>
                </View>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setTargetLectures((v) => Math.max(1, v - 1));
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{targetLectures}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setTargetLectures((v) => v + 1);
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card3D>

            {/* Target 2: DPP */}
            <Card3D gradient={Gradients.oceanCyan as any} style={styles.targetCard}>
              <View style={styles.targetRow}>
                <View style={styles.targetInfo}>
                  <Text style={styles.targetLabel}>DPP EXERCISES</Text>
                  <Text style={styles.targetSub}>Daily practice problem sheets</Text>
                </View>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setTargetDpps((v) => Math.max(0, v - 1));
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{targetDpps}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setTargetDpps((v) => v + 1);
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card3D>

            {/* Target 3: PYQ */}
            <Card3D gradient={Gradients.electricEmerald as any} style={styles.targetCard}>
              <View style={styles.targetRow}>
                <View style={styles.targetInfo}>
                  <Text style={styles.targetLabel}>GATE PYQS</Text>
                  <Text style={styles.targetSub}>Previous years questions</Text>
                </View>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setTargetPyqs((v) => Math.max(5, v - 5));
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{targetPyqs}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setTargetPyqs((v) => v + 5);
                    }}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card3D>

            {/* Motivational Footer */}
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>
                {'⚡ "Consistency in lectures + DPPs every single morning guarantees GATE 2027 success."'}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, isSaving && { opacity: 0.65 }]}
              activeOpacity={0.85}
              disabled={isSaving}
            >
              <LinearGradient
                colors={Gradients.sunsetBlaze as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                <Ionicons name="rocket-outline" size={20} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>
                  {isSaving ? 'LOCKING TARGET...' : "LOCK TODAY'S TARGET 🚀"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>

    {/* 3D Target Locked Celebration Modal */}
    <CosmicModal
      visible={successModalVisible}
      onClose={handleSuccessClose}
      badgeEmoji="🎯"
      badgeGradient={Gradients.sunsetBlaze}
      title="Target Locked! 🎯"
      tag={selectedSubj ? `${selectedSubj.code} • ${selectedSubj.name}` : undefined}
      subtitle="Today's GATE mission is sealed in the queue. Execute with discipline!"
      items={[
        {
          icon: 'play-circle',
          label: 'PW Lectures',
          value: targetLectures,
          color: '#C084FC',
        },
        {
          icon: 'document-text',
          label: 'DPP Sheets',
          value: targetDpps,
          color: '#38BDF8',
        },
        {
          icon: 'trophy',
          label: 'GATE PYQs',
          value: targetPyqs,
          color: '#10B981',
        },
      ]}
      streakText="Daily streak is active! 🚀 Consistency in lectures + DPPs guarantees GATE 2027 success."
      primaryButtonText="LET'S CRUSH IT 🚀"
      onPrimaryPress={handleSuccessClose}
    />

    {/* 3D Error Modal */}
    <CosmicModal
      visible={errorModalVisible}
      onClose={() => setErrorModalVisible(false)}
      type="error"
      badgeEmoji="⚠️"
      title="Lock Failed"
      subtitle={errorMessage}
      primaryButtonText="GOT IT"
      onPrimaryPress={() => setErrorModalVisible(false)}
    />
  </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
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
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepNumberBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  selectedBannerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  selectedBannerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
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
  subjectChipSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  rankBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  targetCard: {
    marginBottom: 12,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetInfo: {
    flex: 1,
  },
  targetLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  targetSub: {
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
  counterValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    minWidth: 32,
    textAlign: 'center',
  },
  quoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  quoteText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  saveBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#FF512F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
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
