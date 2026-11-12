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
  Linking
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/appStore';
import {
  getDailyTasks,
  generateSmartDailyPlan,
  toggleTaskCompletion,
  addDailyTask,
  shiftIncompleteTasks,
  getAllSubjects,
  updateDppAttempt,
  getDppsForSubject
} from '../../db/database';
import { Badge } from '../../components/Badge';
import { DailyTask, TaskCategory, Subject, DPP } from '../../types';

export default function PlannerScreen() {
  const { dataVersion, triggerRefresh, settings } = useAppStore();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [tasks, setTasks] = useState<
    (DailyTask & { subject_name?: string; subject_color?: string; topic_name?: string })[]
  >([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Add Task Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('lecture');
  const [newTaskSubjId, setNewTaskSubjId] = useState('c_prog');
  const [newTaskTargetCount, setNewTaskTargetCount] = useState('1');
  const [newTaskPwUrl, setNewTaskPwUrl] = useState('');

  // DPP Log Modal
  const [dppModalVisible, setDppModalVisible] = useState(false);
  const [activeDppTask, setActiveDppTask] = useState<DailyTask | null>(null);
  const [dppTotalQ, setDppTotalQ] = useState('10');
  const [dppAttempted, setDppAttempted] = useState('10');
  const [dppCorrect, setDppCorrect] = useState('8');
  const [dppIncorrect, setDppIncorrect] = useState('2');
  const [dppTimeSpent, setDppTimeSpent] = useState('30');

  const loadPlannerData = async () => {
    try {
      const [dailyTasks, allSubjs] = await Promise.all([
        getDailyTasks(selectedDate),
        getAllSubjects()
      ]);
      setTasks(dailyTasks);
      setSubjects(allSubjs);
    } catch (e) {
      console.error('Error loading planner:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPlannerData();
    }, [selectedDate, dataVersion])
  );

  const changeDate = (daysDelta: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + daysDelta);
    setSelectedDate(cur.toISOString().slice(0, 10));
  };

  const handleToggleTask = async (task: DailyTask) => {
    const nextVal = task.is_completed === 1 ? false : true;
    await toggleTaskCompletion(task.id, nextVal);
    triggerRefresh();
    await loadPlannerData();
  };

  const handleOpenPwUrl = (url?: string | null) => {
    if (url && url.startsWith('http')) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Cannot Open URL', 'Please verify the PW link address.');
      });
    } else {
      // Default to Physics Wallah website / batch page
      Linking.openURL('https://www.pw.live/study/batches').catch(() => {
        Alert.alert('PW Link', 'Opening Physics Wallah batches.');
      });
    }
  };

  const handleShiftTasks = async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    Alert.alert(
      'Shift Incomplete Tasks',
      `Move all incomplete tasks from ${selectedDate} to tomorrow (${tomorrow})? Original records will be preserved with a historical audit note.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Shift Tasks',
          onPress: async () => {
            const count = await shiftIncompleteTasks(selectedDate, tomorrow);
            triggerRefresh();
            await loadPlannerData();
            Alert.alert('Shifted', `${count} incomplete tasks moved to ${tomorrow}.`);
          }
        }
      ]
    );
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const count = parseInt(newTaskTargetCount, 10) || 1;
    await addDailyTask({
      date: selectedDate,
      category: newTaskCategory,
      subject_id: newTaskSubjId,
      topic_id: null,
      lecture_id: null,
      dpp_id: null,
      title: newTaskTitle.trim(),
      target_count: count,
      completed_count: 0,
      is_completed: 0,
      completed_at: null,
      notes: newTaskPwUrl.trim() ? `PW URL: ${newTaskPwUrl.trim()}` : null,
      order_index: tasks.length + 1
    });

    setAddModalVisible(false);
    setNewTaskTitle('');
    setNewTaskPwUrl('');
    triggerRefresh();
    await loadPlannerData();
  };

  const openDppLogModal = (task: DailyTask) => {
    setActiveDppTask(task);
    setDppModalVisible(true);
  };

  const saveDppLog = async () => {
    if (!activeDppTask) return;
    const att = parseInt(dppAttempted, 10) || 0;
    const corr = parseInt(dppCorrect, 10) || 0;
    const incorr = parseInt(dppIncorrect, 10) || 0;
    const timeMins = parseInt(dppTimeSpent, 10) || 30;

    if (activeDppTask.dpp_id) {
      await updateDppAttempt(activeDppTask.dpp_id, {
        attempted: att,
        correct: corr,
        incorrect: incorr,
        time_spent_minutes: timeMins,
        is_completed: true
      });
    }

    await toggleTaskCompletion(activeDppTask.id, true);
    setDppModalVisible(false);
    triggerRefresh();
    await loadPlannerData();
    Alert.alert('DPP Logged', `Logged DPP with ${corr}/${att} correct answers.`);
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeCategoryFilter === 'all') return true;
    return t.category === activeCategoryFilter;
  });

  const completedCount = tasks.filter((t) => t.is_completed === 1).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Date Selector Header */}
        <View style={styles.dateHeader}>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => changeDate(-1)}>
            <Ionicons name="chevron-back" size={20} color="#F8FAFC" />
          </TouchableOpacity>

          <View style={styles.dateCenter}>
            <Text style={styles.dateLabel}>
              {selectedDate === todayStr ? 'Today' : selectedDate}
            </Text>
            <Text style={styles.dateSub}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>

          <TouchableOpacity style={styles.arrowBtn} onPress={() => changeDate(1)}>
            <Ionicons name="chevron-forward" size={20} color="#F8FAFC" />
          </TouchableOpacity>
        </View>

        {/* Action bar: Today button & Shift button & Add task */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.smallBtn, selectedDate === todayStr && styles.smallBtnActive]}
            onPress={() => setSelectedDate(todayStr)}
          >
            <Text style={styles.smallBtnText}>Today</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shiftBtn} onPress={handleShiftTasks}>
            <Ionicons name="swap-horizontal" size={14} color="#F59E0B" />
            <Text style={styles.shiftBtnText}>Shift Incomplete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddModalVisible(true)}
          >
            <Ionicons name="add" size={16} color="#0A0C10" />
            <Text style={styles.addBtnText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFiltersRow}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {[
            { id: 'all', label: `All (${completedCount}/${tasks.length})` },
            { id: 'lecture', label: 'PW Lectures (5)' },
            { id: 'dpp', label: 'PW DPP (2)' },
            { id: 'pyq_practice', label: 'PYQs (20)' },
            { id: 'revision', label: 'Revision (60m)' }
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catFilterPill,
                activeCategoryFilter === cat.id && styles.catFilterPillActive
              ]}
              onPress={() => setActiveCategoryFilter(cat.id as any)}
            >
              <Text
                style={[
                  styles.catFilterText,
                  activeCategoryFilter === cat.id && styles.catFilterTextActive
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Task List */}
        <ScrollView style={styles.taskList} contentContainerStyle={{ padding: 16 }}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyTasksCard}>
              <Ionicons name="clipboard-outline" size={32} color="#64748B" />
              <Text style={styles.emptyTitle}>No Tasks for this Filter</Text>
              <Text style={styles.emptySub}>
                Tap below to generate the 5-lecture + 2-DPP + 20-PYQ target schedule.
              </Text>
              <TouchableOpacity
                style={styles.genPlanBtn}
                onPress={async () => {
                  await generateSmartDailyPlan(selectedDate);
                  await loadPlannerData();
                }}
              >
                <Text style={styles.genPlanBtnText}>Generate Daily Schedule</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTasks.map((t) => (
              <View
                key={t.id}
                style={[styles.taskCard, t.is_completed === 1 && styles.taskCardDone]}
              >
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => handleToggleTask(t)}
                >
                  <Ionicons
                    name={t.is_completed === 1 ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={t.is_completed === 1 ? '#10B981' : '#64748B'}
                  />
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <Text
                    style={[
                      styles.taskCardTitle,
                      t.is_completed === 1 && styles.taskCardTitleDone
                    ]}
                  >
                    {t.title}
                  </Text>

                  <View style={styles.taskMeta}>
                    <Badge
                      label={t.category.toUpperCase()}
                      variant={
                        t.category === 'lecture'
                          ? 'primary'
                          : t.category === 'dpp'
                          ? 'success'
                          : t.category === 'pyq_practice'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    />
                    {t.subject_name && (
                      <Text style={styles.subjMetaText}>{t.subject_name}</Text>
                    )}
                    {t.notes && <Text style={styles.noteMetaText}>{t.notes}</Text>}
                  </View>
                </View>

                {/* Right Action buttons */}
                <View style={styles.taskActions}>
                  {t.category === 'dpp' && t.is_completed === 0 && (
                    <TouchableOpacity
                      style={styles.dppLogBtn}
                      onPress={() => openDppLogModal(t)}
                    >
                      <Text style={styles.dppLogBtnText}>Log Qs</Text>
                    </TouchableOpacity>
                  )}

                  {t.category === 'lecture' && (
                    <TouchableOpacity
                      style={styles.pwLinkBtn}
                      onPress={() => handleOpenPwUrl()}
                    >
                      <Ionicons name="open-outline" size={16} color="#38BDF8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Add Task Modal */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Study Task</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task Title</Text>
              <TextInput
                style={styles.input}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="e.g. C Pointers & Array Practice"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.catGrid}>
                {[
                  { cat: 'lecture', label: 'PW Lecture' },
                  { cat: 'dpp', label: 'PW DPP' },
                  { cat: 'pyq_practice', label: 'GATE PYQ' },
                  { cat: 'revision', label: 'Revision' }
                ].map((c) => (
                  <TouchableOpacity
                    key={c.cat}
                    style={[
                      styles.catChoice,
                      newTaskCategory === c.cat && styles.catChoiceActive
                    ]}
                    onPress={() => setNewTaskCategory(c.cat as TaskCategory)}
                  >
                    <Text
                      style={[
                        styles.catChoiceText,
                        newTaskCategory === c.cat && styles.catChoiceTextActive
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {subjects.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.subjPill, newTaskSubjId === s.id && styles.subjPillActive]}
                    onPress={() => setNewTaskSubjId(s.id)}
                  >
                    <Text
                      style={[
                        styles.subjPillText,
                        newTaskSubjId === s.id && styles.subjPillTextActive
                      ]}
                    >
                      {s.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PW Lecture / DPP Link (Optional)</Text>
              <TextInput
                style={styles.input}
                value={newTaskPwUrl}
                onChangeText={setNewTaskPwUrl}
                placeholder="https://pw.live/..."
                placeholderTextColor="#64748B"
              />
            </View>

            <TouchableOpacity style={styles.createBtn} onPress={handleCreateTask}>
              <Text style={styles.createBtnText}>Add Task to Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Log DPP Performance Modal */}
      <Modal
        visible={dppModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDppModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record DPP Results</Text>
              <TouchableOpacity onPress={() => setDppModalVisible(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.dppModalSubtitle}>{activeDppTask?.title}</Text>

            <View style={styles.dppInputsRow}>
              <View style={styles.dppCol}>
                <Text style={styles.inputLabel}>Questions</Text>
                <TextInput
                  style={styles.input}
                  value={dppTotalQ}
                  onChangeText={setDppTotalQ}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.dppCol}>
                <Text style={styles.inputLabel}>Attempted</Text>
                <TextInput
                  style={styles.input}
                  value={dppAttempted}
                  onChangeText={setDppAttempted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.dppInputsRow}>
              <View style={styles.dppCol}>
                <Text style={[styles.inputLabel, { color: '#10B981' }]}>Correct</Text>
                <TextInput
                  style={styles.input}
                  value={dppCorrect}
                  onChangeText={setDppCorrect}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.dppCol}>
                <Text style={[styles.inputLabel, { color: '#F43F5E' }]}>Incorrect</Text>
                <TextInput
                  style={styles.input}
                  value={dppIncorrect}
                  onChangeText={setDppIncorrect}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Time Spent (Minutes)</Text>
              <TextInput
                style={styles.input}
                value={dppTimeSpent}
                onChangeText={setDppTimeSpent}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.createBtn} onPress={saveDppLog}>
              <Text style={styles.createBtnText}>Save DPP Results</Text>
            </TouchableOpacity>
          </View>
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
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1E2536',
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#131720',
    borderWidth: 1,
    borderColor: '#232A3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  dateSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  smallBtnActive: {
    borderColor: '#38BDF8',
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  shiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  shiftBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#38BDF8',
    marginLeft: 'auto',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0C10',
  },
  categoryFiltersRow: {
    maxHeight: 38,
    borderBottomWidth: 1,
    borderColor: '#1E2536',
  },
  catFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
    backgroundColor: '#131720',
  },
  catFilterPillActive: {
    backgroundColor: '#1E2536',
  },
  catFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  catFilterTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  taskList: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: '#131720',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskCardDone: {
    opacity: 0.55,
  },
  checkboxContainer: {
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  taskCardTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  subjMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  noteMetaText: {
    fontSize: 11,
    color: '#F59E0B',
    fontStyle: 'italic',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dppLogBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dppLogBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  pwLinkBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTasksCard: {
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
    marginBottom: 16,
  },
  genPlanBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  genPlanBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A0C10',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#131720',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#232A3B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  dppModalSubtitle: {
    fontSize: 13,
    color: '#38BDF8',
    marginBottom: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
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
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChoice: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  catChoiceActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  catChoiceText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  catChoiceTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  subjPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    color: '#94A3B8',
    fontWeight: '600',
  },
  subjPillTextActive: {
    color: '#0A0C10',
  },
  createBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0C10',
  },
  dppInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  dppCol: {
    flex: 1,
  },
});

