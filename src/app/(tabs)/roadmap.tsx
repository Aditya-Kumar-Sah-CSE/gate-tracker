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
  StatusBar,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../stores/appStore';
import {
  getSubjectsInQueue,
  moveSubjectQueue,
  setSubjectActive,
  updateSubjectProgress,
  updateSubjectDetails,
  toggleSubjectStatus,
  resetAllSubjectsToDefault,
  deleteSubject,
  addNewSubject,
} from '../../db/database';
import { Subject } from '../../types';
import { Colors, Gradients } from '../../constants/theme';
import { Card3D } from '../../components/Card3D';
import { CosmicModal } from '../../components/CosmicModal';
import { LinearGradient } from 'expo-linear-gradient';

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

  // Add Subject Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newTotalLec, setNewTotalLec] = useState('');
  const [newTotalDpps, setNewTotalDpps] = useState('');
  const [newIsEstimated, setNewIsEstimated] = useState(false);

  // Active Subject Confirmation Modal State
  const [confirmSubject, setConfirmSubject] = useState<Subject | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Delete Subject Confirmation Modal State
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      let list = await getSubjectsInQueue();
      if (!list || list.length === 0) {
        list = await resetAllSubjectsToDefault();
      }
      setSubjects(list);
    } catch (e) {
      console.error('Error loading subjects queue:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (dataVersion >= 0) {
        loadData();
      }
    }, [loadData, dataVersion])
  );

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleToggleStatus = async (subjectId: string, newStatus: 'doing' | 'done') => {
    triggerHaptic();
    await toggleSubjectStatus(subjectId, newStatus);
    await loadData();
    triggerRefresh();
  };

  const handleResetSubjects = async () => {
    triggerHaptic();
    const list = await resetAllSubjectsToDefault();
    setSubjects(list);
    triggerRefresh();
  };

  const handleMove = async (subjectId: string, direction: 'up' | 'down') => {
    triggerHaptic();
    await moveSubjectQueue(subjectId, direction);
    await loadData();
    triggerRefresh();
  };

  const promptMakeActive = (subj: Subject) => {
    triggerHaptic();
    setConfirmSubject(subj);
    setConfirmModalVisible(true);
  };

  const handleConfirmActive = async () => {
    if (!confirmSubject) return;
    const targetId = confirmSubject.id;
    setConfirmModalVisible(false);
    setConfirmSubject(null);
    triggerHaptic();
    await setSubjectActive(targetId);
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
    setEditName(subj.name || '');
    setEditTotalLec(subj.total_lectures != null ? String(subj.total_lectures) : '30');
    setEditIsEstimated(subj.is_lecture_count_estimated === 1);
    setEditTotalDpps(subj.total_dpps != null ? String(subj.total_dpps) : '0');
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editingSubj) return;
    try {
      const parsedLec = parseInt(editTotalLec, 10);
      const totalLec = !isNaN(parsedLec) && parsedLec > 0 ? parsedLec : (editingSubj.total_lectures || 30);
      const parsedDpp = parseInt(editTotalDpps, 10);
      const totalDpp = !isNaN(parsedDpp) && parsedDpp >= 0 ? parsedDpp : 0;
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

  // Add Subject Handlers
  const handleOpenAddModal = () => {
    triggerHaptic();
    setNewName('');
    setNewCode('');
    setNewTotalLec('30');
    setNewTotalDpps('10');
    setNewIsEstimated(false);
    setAddModalVisible(true);
  };

  const handleSaveNewSubject = async () => {
    if (!newName.trim()) return;
    triggerHaptic();
    try {
      const parsedLec = parseInt(newTotalLec, 10);
      const totalLec = !isNaN(parsedLec) && parsedLec > 0 ? parsedLec : 30;
      const parsedDpps = parseInt(newTotalDpps, 10);
      const totalDpps = !isNaN(parsedDpps) && parsedDpps >= 0 ? parsedDpps : 10;

      await addNewSubject({
        name: newName.trim(),
        code: newCode.trim() || undefined,
        totalLectures: totalLec,
        totalDpps: totalDpps,
        isEstimated: newIsEstimated,
      });

      setAddModalVisible(false);
      await loadData();
      triggerRefresh();
    } catch (err) {
      console.error('Error adding subject:', err);
    }
  };

  // Delete Subject Handlers
  const promptDeleteSubject = (subj: Subject) => {
    triggerHaptic();
    setSubjectToDelete(subj);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;
    const targetId = subjectToDelete.id;
    setDeleteModalVisible(false);
    setSubjectToDelete(null);
    triggerHaptic();
    try {
      await deleteSubject(targetId);
      await loadData();
      triggerRefresh();
    } catch (err) {
      console.error('Error deleting subject:', err);
    }
  };

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16) + 8;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: topInset }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.headerTitle}>GATE Study Queue</Text>
            <Text style={styles.headerSubtitle}>
              Priority queue • #1 Active • Doing / Done
            </Text>
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity onPress={handleOpenAddModal} style={styles.addBtn} activeOpacity={0.8}>
              <Ionicons name="add-circle" size={14} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResetSubjects} style={styles.reloadBtn} activeOpacity={0.8}>
              <Ionicons name="refresh" size={13} color="#C084FC" />
              <Text style={styles.reloadBtnText}>Reset 12</Text>
            </TouchableOpacity>
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
                {/* Row 1: Top Bar with Rank Pill on left, and Status Toggle + Actions on right */}
                <View style={styles.cardTopRow}>
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

                  <View style={styles.cardTopRight}>
                    {/* SIDE TOGGLE: DOING vs DONE */}
                    <View style={styles.statusToggleContainer}>
                      <TouchableOpacity
                        onPress={() => handleToggleStatus(subj.id, 'doing')}
                        style={[
                          styles.togglePill,
                          (subj.status === 'doing' || (isActive && subj.status !== 'done'))
                            ? styles.toggleDoingActive
                            : styles.toggleInactive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={
                            (subj.status === 'doing' || (isActive && subj.status !== 'done'))
                              ? 'flash'
                              : 'flash-outline'
                          }
                          size={11}
                          color={
                            (subj.status === 'doing' || (isActive && subj.status !== 'done'))
                              ? '#FFFFFF'
                              : '#94A3B8'
                          }
                        />
                        <Text
                          style={[
                            styles.togglePillText,
                            (subj.status === 'doing' || (isActive && subj.status !== 'done')) &&
                              styles.togglePillTextActive,
                          ]}
                        >
                          Doing
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleToggleStatus(subj.id, 'done')}
                        style={[
                          styles.togglePill,
                          subj.status === 'done' ? styles.toggleDoneActive : styles.toggleInactive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={subj.status === 'done' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={11}
                          color={subj.status === 'done' ? '#FFFFFF' : '#94A3B8'}
                        />
                        <Text
                          style={[
                            styles.togglePillText,
                            subj.status === 'done' && styles.togglePillTextActive,
                          ]}
                        >
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Actions: Up, Down, Edit, Delete */}
                    <View style={styles.actionGroup}>
                      {!isFirst && (
                        <TouchableOpacity
                          onPress={() => handleMove(subj.id, 'up')}
                          style={styles.iconBtn}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="arrow-up" size={13} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                      {!isLast && (
                        <TouchableOpacity
                          onPress={() => handleMove(subj.id, 'down')}
                          style={styles.iconBtn}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="arrow-down" size={13} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => openEdit(subj)}
                        style={styles.iconBtn}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => promptDeleteSubject(subj)}
                        style={[styles.iconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.35)' }]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={12} color="#FCA5A5" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Row 2: Subject Title (Full width, bold, nicely spaced, never squished) */}
                <View style={styles.subjectTitleSection}>
                  <Text style={styles.subjectName}>{subj.name}</Text>
                  <Text style={styles.subjectCode}>{subj.code}</Text>
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
                    onPress={() => promptMakeActive(subj)}
                    style={styles.makeActiveBtn}
                    activeOpacity={0.8}
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

        {/* 3D Edit Subject Modal */}
        <Modal visible={editModalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCardContainer}>
              <LinearGradient
                colors={['rgba(192, 132, 252, 0.45)', 'rgba(99, 102, 241, 0.25)', 'rgba(168, 85, 247, 0.15)'] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalBorderGradient}
              >
                <View style={styles.modalCard}>
                  {/* Top Floating Orb Badge */}
                  <View style={styles.modalOrbRing}>
                    <LinearGradient
                      colors={Gradients.cyberViolet as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modalOrbInner}
                    >
                      <Ionicons name="pencil" size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </View>

                  <Text style={styles.modalTitle}>Edit Subject Parameters</Text>
                  <Text style={styles.modalSub}>{editingSubj?.code} • {editingSubj?.name}</Text>

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
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={saveEdit}
                      style={styles.modalSaveBtn}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={Gradients.sunsetBlaze as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.modalSaveGradient}
                      >
                        <Text style={styles.modalSaveText}>Save Changes 💾</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>

        {/* 3D Add Subject Modal */}
        <Modal visible={addModalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCardContainer}>
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.45)', 'rgba(59, 130, 246, 0.25)', 'rgba(16, 185, 129, 0.15)'] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalBorderGradient}
              >
                <View style={styles.modalCard}>
                  {/* Top Floating Orb Badge */}
                  <View style={styles.modalOrbRing}>
                    <LinearGradient
                      colors={Gradients.cyberViolet as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modalOrbInner}
                    >
                      <Ionicons name="add" size={24} color="#FFFFFF" />
                    </LinearGradient>
                  </View>

                  <Text style={styles.modalTitle}>Add New Subject</Text>
                  <Text style={styles.modalSub}>Add custom subject to your GATE queue</Text>

                  <Text style={styles.inputLabel}>Subject Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="e.g. Computer Networks"
                    placeholderTextColor="#64748B"
                  />

                  <Text style={styles.inputLabel}>Subject Code (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={newCode}
                    onChangeText={setNewCode}
                    placeholder="e.g. CS-CN"
                    placeholderTextColor="#64748B"
                    autoCapitalize="characters"
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Total Lectures</Text>
                      <TextInput
                        style={styles.input}
                        value={newTotalLec}
                        onChangeText={setNewTotalLec}
                        keyboardType="numeric"
                        placeholder="30"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Total DPP Sheets</Text>
                      <TextInput
                        style={styles.input}
                        value={newTotalDpps}
                        onChangeText={setNewTotalDpps}
                        keyboardType="numeric"
                        placeholder="10"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Is Lecture Count Estimated?</Text>
                    <Switch
                      value={newIsEstimated}
                      onValueChange={setNewIsEstimated}
                      trackColor={{ false: '#334155', true: '#8B5CF6' }}
                    />
                  </View>

                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                      onPress={() => setAddModalVisible(false)}
                      style={styles.modalCancelBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveNewSubject}
                      style={styles.modalSaveBtn}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={Gradients.sunsetBlaze as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.modalSaveGradient}
                      >
                        <Text style={styles.modalSaveText}>Add Subject 🚀</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>

        {/* Delete Subject Confirmation Modal */}
        <CosmicModal
          visible={deleteModalVisible}
          onClose={() => setDeleteModalVisible(false)}
          badgeEmoji="🗑️"
          badgeGradient={['#EF4444', '#DC2626']}
          title="Delete Subject?"
          tag={subjectToDelete ? `${subjectToDelete.code} • ${subjectToDelete.name}` : undefined}
          subtitle="Are you sure you want to remove this subject from your study queue?"
          primaryButtonText="DELETE 🗑️"
          onPrimaryPress={handleConfirmDelete}
          secondaryButtonText="CANCEL"
          onSecondaryPress={() => setDeleteModalVisible(false)}
        />

        {/* Set Active Subject Confirmation Modal */}
        <CosmicModal
          visible={confirmModalVisible}
          onClose={() => setConfirmModalVisible(false)}
          badgeEmoji="⭐"
          badgeGradient={Gradients.goldChest}
          title="Set Active Focus? 🎯"
          tag={confirmSubject ? `${confirmSubject.code} • ${confirmSubject.name}` : undefined}
          subtitle="Switch your primary study focus to this subject?"
          primaryButtonText="SET ACTIVE ⚡"
          onPrimaryPress={handleConfirmActive}
          secondaryButtonText="CANCEL"
          onSecondaryPress={() => setConfirmModalVisible(false)}
        />
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  reloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reloadBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankPillActive: {
    backgroundColor: '#FFFFFF',
  },
  rankPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  rankPillTextActive: {
    fontWeight: '800',
  },
  subjectTitleSection: {
    marginBottom: 12,
  },
  subjectName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  subjectCode: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statusToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 10,
    padding: 2,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleDoingActive: {
    backgroundColor: '#8B5CF6',
  },
  toggleDoneActive: {
    backgroundColor: '#10B981',
  },
  toggleInactive: {
    backgroundColor: 'transparent',
  },
  togglePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  togglePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    backgroundColor: 'rgba(5, 3, 18, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCardContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 26,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 26,
    elevation: 20,
  },
  modalBorderGradient: {
    padding: 1.5,
    borderRadius: 26,
  },
  modalCard: {
    backgroundColor: '#120D2C',
    borderRadius: 24.5,
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  modalOrbRing: {
    position: 'absolute',
    top: -26,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -26,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(18, 13, 44, 0.95)',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C084FC',
    elevation: 10,
  },
  modalOrbInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSub: {
    color: '#A5B4FC',
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  inputLabel: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(28, 22, 68, 0.7)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
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
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalCancelText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 13,
  },
  modalSaveBtn: {
    flex: 1.4,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
});
