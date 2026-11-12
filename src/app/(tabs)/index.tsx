import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useAppStore,
  calculatePrepDay,
  calculateDaysRemaining,
  formatDuration
} from '../../stores/appStore';
import {
  getRealProgressIndicators,
  RealProgressIndicators,
  getDailyTasks,
  toggleTaskCompletion,
  getWeakTopics,
  getRevisionItems,
  completeRevisionSchedule,
  getDailyProgressRange,
  getAllSubjects
} from '../../db/database';
import { CircularProgress } from '../../components/CircularProgress';
import { MetricCard } from '../../components/MetricCard';
import { WeeklyBarChart } from '../../components/WeeklyBarChart';
import { Badge } from '../../components/Badge';
import { DailyTask, WeakTopicAnalysis, RevisionSchedule, TaskCategory, Subject } from '../../types';

export default function DashboardScreen() {
  const { settings, dataVersion, startTimer, isTimerRunning } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<RealProgressIndicators | null>(null);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopicAnalysis[]>([]);
  const [dueRevisions, setDueRevisions] = useState<
    (RevisionSchedule & { topic_name: string; subject_name: string; subject_color: string })[]
  >([]);
  const [weeklyChartData, setWeeklyChartData] = useState<
    { date: string; dayLabel: string; hours: number }[]
  >([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Start Timer Modal State
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [selectedSubjId, setSelectedSubjId] = useState('c_prog');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('lecture');

  const todayStr = new Date().toISOString().slice(0, 10);
  const prepDay = calculatePrepDay(settings?.prep_start_date);
  const daysRemaining = calculateDaysRemaining(settings?.target_exam_date);

  const loadDashboardData = async () => {
    try {
      const [indicators, tasks, weak, revs, subjs] = await Promise.all([
        getRealProgressIndicators(),
        getDailyTasks(todayStr),
        getWeakTopics(5),
        getRevisionItems('due_today'),
        getAllSubjects()
      ]);

      setStats(indicators);
      setTodayTasks(tasks);
      setWeakTopics(weak);
      setDueRevisions(revs);
      setSubjects(subjs);

      // Build 7-day weekly bar chart data
      const last7Days: { date: string; dayLabel: string; hours: number }[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const dStr = d.toISOString().slice(0, 10);
        const dayLabel = dayNames[d.getDay()];
        last7Days.push({ date: dStr, dayLabel, hours: 0 });
      }

      const progressRows = await getDailyProgressRange(7);
      const progressMap = new Map(progressRows.map((r) => [r.date, r.total_study_seconds]));

      const chartData = last7Days.map((item) => {
        const seconds = progressMap.get(item.date) || 0;
        return {
          ...item,
          hours: Math.round((seconds / 3600) * 10) / 10
        };
      });

      setWeeklyChartData(chartData);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [dataVersion, settings])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleToggleTask = async (task: DailyTask) => {
    const nextState = task.is_completed === 1 ? false : true;
    await toggleTaskCompletion(task.id, nextState);
    await loadDashboardData();
  };

  const handleCompleteRevision = async (revId: string) => {
    await completeRevisionSchedule(revId, 30, 'Completed in daily revision');
    await loadDashboardData();
    Alert.alert('Revision Completed', 'Topic logged to revision history.');
  };

  const handleStartTimerConfirm = () => {
    startTimer(selectedSubjId, selectedCategory, null);
    setTimerModalVisible(false);
  };

  const studyHoursToday = stats ? (stats.todayStudySeconds / 3600).toFixed(1) : '0.0';
  const studyTargetHours = settings?.daily_study_hours_target || 8.0;
  const studyHoursPct = stats
    ? Math.min(100, Math.round((stats.todayStudySeconds / (studyTargetHours * 3600)) * 100))
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeRow}>
              <Badge label="Parakram GATE 2027 Batch B" variant="primary" size="sm" />
            </View>
            <Text style={styles.appTitle}>GATE TRACK 90</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.settingsIconBtn}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={20} color="#F8FAFC" />
            </TouchableOpacity>

            <View style={styles.countdownBadge}>
              <Text style={styles.countdownDay}>Day {prepDay.day}/90</Text>
              <Text style={styles.countdownExam}>{daysRemaining}d to GATE</Text>
            </View>
          </View>
        </View>

        {/* Floating Quick Action Timer Bar */}
        {!isTimerRunning && (
          <TouchableOpacity
            style={styles.timerTriggerBar}
            activeOpacity={0.8}
            onPress={() => setTimerModalVisible(true)}
          >
            <View style={styles.timerTriggerLeft}>
              <View style={styles.timerPlayCircle}>
                <Ionicons name="play" size={14} color="#0A0C10" />
              </View>
              <View>
                <Text style={styles.timerTriggerTitle}>Start Study Session</Text>
                <Text style={styles.timerTriggerSub}>Track focused PW lectures, DPP & drills</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>
        )}

        {/* Primary Today's Target Highlight Card */}
        <View style={styles.targetHighlightCard}>
          <View style={styles.targetLeftCol}>
            <Text style={styles.targetCardLabel}>TODAY'S CORE TARGET</Text>
            <Text style={styles.targetCardTitle}>
              5 Lectures • 2 DPP • 20 PYQ
            </Text>
            <Text style={styles.targetCardSub}>
              {studyHoursToday}h logged of {studyTargetHours}h target ({studyHoursPct}%)
            </Text>

            <View style={styles.streakRow}>
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text style={styles.streakText}>
                {stats?.currentStreak || 0} Day Authentic Streak
              </Text>
            </View>
          </View>

          <CircularProgress
            size={88}
            strokeWidth={9}
            percentage={studyHoursPct}
            color="#38BDF8"
            trackColor="#1F2636"
            centerText={`${studyHoursToday}h`}
            centerSubtext="STUDIED"
          />
        </View>

        {/* Section: 5 Separate Real Progress Indicators */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Syllabus & Preparation Health</Text>
          <Text style={styles.sectionNote}>Separated real counts</Text>
        </View>

        <View style={styles.metricsGrid}>
          {/* 1. PW Lectures */}
          <MetricCard
            title="PW Lectures"
            value={`${stats?.completedLectures || 0} / ${stats?.totalLectures || 487}`}
            subtext={`${stats?.confirmedLectures || 117} Confirmed • ${stats?.estimatedLectures || 370} Estimated`}
            iconName="videocam-outline"
            iconColor="#38BDF8"
            progress={stats?.lectureCompletionPct || 0}
            progressColor="#38BDF8"
            style={{ width: '48%' }}
          />

          {/* 2. DPP Completion */}
          <MetricCard
            title="PW DPP Sheets"
            value={`${stats?.completedDpps || 0} / ${stats?.totalConfirmedDpps || 41}`}
            subtext={
              stats && stats.totalConfirmedDpps > 0
                ? `${stats.dppCompletionPct}% of confirmed 41 DPPs`
                : 'Confirmed DPPs only'
            }
            iconName="list-outline"
            iconColor="#10B981"
            progress={stats?.dppCompletionPct || 0}
            progressColor="#10B981"
            style={{ width: '48%' }}
          />

          {/* 3. GATE PYQ Practice */}
          <MetricCard
            title="GATE PYQ Practice"
            value={`${stats?.todayPyqsAttempted || 0} / ${settings?.daily_pyq_target || 20}`}
            subtext={
              stats && stats.overallAccuracyPct !== null
                ? `${stats.overallAccuracyPct}% Accuracy (${stats.totalPyqsCorrect}/${stats.totalPyqsAttempted})`
                : 'Not Started (0 attempts)'
            }
            iconName="document-text-outline"
            iconColor="#F59E0B"
            progress={
              stats && settings
                ? Math.min(100, Math.round((stats.todayPyqsAttempted / settings.daily_pyq_target) * 100))
                : 0
            }
            progressColor="#F59E0B"
            style={{ width: '48%' }}
          />

          {/* 4. Revision Adherence */}
          <MetricCard
            title="Spaced Revision"
            value={`${stats?.todayRevisionsCompleted || 0} / ${stats?.todayRevisionsDue || 0}`}
            subtext={
              stats && stats.todayRevisionsDue > 0
                ? `${stats.todayRevisionsDue - stats.todayRevisionsCompleted} pending today`
                : 'All caught up'
            }
            iconName="refresh-outline"
            iconColor="#818CF8"
            progress={
              stats && stats.todayRevisionsDue > 0
                ? Math.round((stats.todayRevisionsCompleted / stats.todayRevisionsDue) * 100)
                : 100
            }
            progressColor="#818CF8"
            style={{ width: '48%' }}
          />
        </View>

        {/* Weekly Study Hours Bar Chart */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>7-Day Study Hours Distribution</Text>
          <Text style={styles.sectionNote}>Daily 8h target line</Text>
        </View>
        <WeeklyBarChart data={weeklyChartData} targetHours={studyTargetHours} />

        {/* Section: Today's Tasks & Execution */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Today's Execution Checklist</Text>
          <TouchableOpacity onPress={() => router.push('/planner')}>
            <Text style={styles.seeAllText}>Open Planner →</Text>
          </TouchableOpacity>
        </View>

        {todayTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle-outline" size={32} color="#10B981" />
            <Text style={styles.emptyTitle}>No Pending Tasks for Today</Text>
            <Text style={styles.emptySub}>
              Tap below or visit Planner to generate your 5-lecture + 2-DPP schedule.
            </Text>
            <TouchableOpacity
              style={styles.genBtn}
              onPress={() => router.push('/planner')}
            >
              <Text style={styles.genBtnText}>Generate Today's Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          todayTasks.slice(0, 6).map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskItem, task.is_completed === 1 && styles.taskItemDone]}
              activeOpacity={0.7}
              onPress={() => handleToggleTask(task)}
            >
              <View style={styles.taskCheckbox}>
                <Ionicons
                  name={task.is_completed === 1 ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={task.is_completed === 1 ? '#10B981' : '#64748B'}
                />
              </View>

              <View style={styles.taskInfo}>
                <Text
                  style={[
                    styles.taskTitle,
                    task.is_completed === 1 && styles.taskTitleDone
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                <View style={styles.taskMetaRow}>
                  <Badge
                    label={task.category.toUpperCase()}
                    variant={
                      task.category === 'lecture'
                        ? 'primary'
                        : task.category === 'dpp'
                        ? 'success'
                        : task.category === 'pyq_practice'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  />
                  {task.subject_name && (
                    <Text style={styles.taskSubjectText}>{task.subject_name}</Text>
                  )}
                </View>
              </View>

              {task.is_completed === 1 ? (
                <Badge label="DONE" variant="success" size="sm" />
              ) : (
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Section: Spaced Revisions Due Today */}
        {dueRevisions.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Revisions Due Today (R1–R5)</Text>
              <Badge label={`${dueRevisions.length} DUE`} variant="warning" size="sm" />
            </View>

            {dueRevisions.map((rev) => (
              <View key={rev.id} style={styles.revCard}>
                <View style={styles.revCardLeft}>
                  <View style={styles.revStageBox}>
                    <Text style={styles.revStageText}>{rev.interval_stage}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.revTopicTitle}>{rev.topic_name}</Text>
                    <Text style={styles.revSubject}>{rev.subject_name}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.revDoneBtn}
                  onPress={() => handleCompleteRevision(rev.id)}
                >
                  <Text style={styles.revDoneBtnText}>Revised</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Section: Weak Topics Remediation */}
        {weakTopics.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Identified Weak Topics</Text>
              <Text style={styles.sectionNote}>&lt;50% Critical</Text>
            </View>

            {weakTopics.map((item) => (
              <View key={item.topic_id} style={styles.weakItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weakTopicName}>{item.topic_name}</Text>
                  <Text style={styles.weakSubjectName}>{item.subject_name}</Text>
                </View>
                <View style={styles.weakRight}>
                  <Badge
                    label={item.status.toUpperCase()}
                    variant={item.status === 'Critical' ? 'danger' : 'warning'}
                    size="sm"
                  />
                  <Text style={styles.weakAccuracyText}>{item.accuracy}% Accuracy</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Start Study Timer Modal */}
      <Modal
        visible={timerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTimerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start Focused Study Timer</Text>
              <TouchableOpacity onPress={() => setTimerModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Select Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
              {subjects.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pill, selectedSubjId === s.id && styles.pillActive]}
                  onPress={() => setSelectedSubjId(s.id)}
                >
                  <Text style={[styles.pillText, selectedSubjId === s.id && styles.pillTextActive]}>
                    {s.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Select Task Category</Text>
            <View style={styles.catGrid}>
              {[
                { cat: 'lecture', label: 'PW Lecture', icon: 'videocam-outline' },
                { cat: 'dpp', label: 'PW DPP Drill', icon: 'list-outline' },
                { cat: 'pyq_practice', label: 'GATE PYQ', icon: 'document-text-outline' },
                { cat: 'revision', label: 'Revision', icon: 'refresh-outline' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.cat}
                  style={[
                    styles.catBox,
                    selectedCategory === item.cat && styles.catBoxActive
                  ]}
                  onPress={() => setSelectedCategory(item.cat as TaskCategory)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={selectedCategory === item.cat ? '#38BDF8' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.catBoxText,
                      selectedCategory === item.cat && styles.catBoxTextActive
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.startModalBtn} onPress={handleStartTimerConfirm}>
              <Ionicons name="play" size={18} color="#0A0C10" />
              <Text style={styles.startModalBtnText}>Start Tracking Time</Text>
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
    padding: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  badgeRow: {
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  settingsIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  countdownBadge: {
    backgroundColor: '#131720',
    borderWidth: 1,
    borderColor: '#232A3B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  countdownDay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  countdownExam: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  timerTriggerBar: {
    backgroundColor: '#131720',
    borderWidth: 1,
    borderColor: '#232A3B',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  timerTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerPlayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTriggerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  timerTriggerSub: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94A3B8',
  },
  targetHighlightCard: {
    backgroundColor: '#131720',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  targetLeftCol: {
    flex: 1,
    marginRight: 12,
  },
  targetCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  targetCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  targetCardSub: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
    marginTop: 4,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  sectionNote: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  taskItem: {
    backgroundColor: '#131720',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskItemDone: {
    opacity: 0.6,
    borderColor: '#1E2536',
  },
  taskCheckbox: {
    marginRight: 10,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  taskSubjectText: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#131720',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  genBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  genBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0C10',
  },
  revCard: {
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
  revCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  revStageBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revStageText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },
  revTopicTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  revSubject: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  revDoneBtn: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  revDoneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weakItem: {
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
  weakTopicName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  weakSubjectName: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  weakRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  weakAccuracyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F43F5E',
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
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 10,
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  pillTextActive: {
    color: '#0A0C10',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catBox: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  catBoxActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  catBoxText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  catBoxTextActive: {
    color: '#38BDF8',
  },
  startModalBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  startModalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0C10',
  },
});

