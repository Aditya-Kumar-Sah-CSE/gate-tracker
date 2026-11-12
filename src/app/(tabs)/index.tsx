import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppStore, calculatePrepDay, calculateDaysRemaining } from '../../stores/appStore';
import {
  getActiveSubject,
  getSubjectsInQueue,
  getTodayGoals,
  getTodayProgress,
  getWeeklyActivity,
  getOverallStats,
  updateSubjectProgress,
} from '../../db/database';
import { Subject, DailyGoal, DailyProgress, DayActivity } from '../../types';
import { Colors, Gradients } from '../../constants/theme';
import { Card3D } from '../../components/Card3D';
import { CircularProgress } from '../../components/CircularProgress';
import { MorningTargetModal } from '../../components/MorningTargetModal';
import { NightReviewModal } from '../../components/NightReviewModal';

export default function DashboardScreen() {
  const { settings, dataVersion, triggerRefresh, startTimer } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [queuedSubjects, setQueuedSubjects] = useState<Subject[]>([]);
  const [todayGoal, setTodayGoal] = useState<DailyGoal | null>(null);
  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<DayActivity[]>([]);
  const [stats, setStats] = useState<{
    totalLectures: number;
    completedLectures: number;
    lecturePct: number;
    totalDpps: number;
    completedDpps: number;
    dppPct: number;
    totalPyqs: number;
    correctPyqs: number;
    pyqAccuracy: number;
    streak: number;
    daysLeft: number;
    dayNumber: number;
  } | null>(null);

  // Modals
  const [morningModalVisible, setMorningModalVisible] = useState(false);
  const [nightModalVisible, setNightModalVisible] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [activeSubj, allSubjs, goal, prog, week, allStats] = await Promise.all([
        getActiveSubject(),
        getSubjectsInQueue(),
        getTodayGoals(),
        getTodayProgress(),
        getWeeklyActivity(7),
        getOverallStats(),
      ]);

      setActiveSubject(activeSubj);
      setQueuedSubjects(allSubjs.filter((s) => s.id !== activeSubj?.id));
      setTodayGoal(goal);
      setTodayProgress(prog);
      setWeeklyActivity(week);
      setStats(allStats);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [dataVersion])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleQuickAdd = async (
    subjectId: string,
    type: 'lecture' | 'dpp' | 'pyq'
  ) => {
    triggerHaptic();
    if (type === 'lecture') {
      await updateSubjectProgress(subjectId, { completed_lectures: 1 });
    } else if (type === 'dpp') {
      await updateSubjectProgress(subjectId, { completed_dpps: 1 });
    } else {
      await updateSubjectProgress(subjectId, { pyqs_attempted: 1, pyqs_correct: 1 });
    }
    await loadDashboardData();
    triggerRefresh();
  };

  // Check if current hour is past 9 PM (21:00)
  const currentHour = new Date().getHours();
  const isPast9PM = currentHour >= 21;
  const isMorningTime = currentHour >= 5 && currentHour < 12;

  const prepDay = calculatePrepDay(settings?.prep_start_date);
  const daysLeft = calculateDaysRemaining(settings?.target_exam_date);

  // Progress metrics calculation
  const targetLectures = todayGoal?.target_lectures || 5;
  const completedLectures = todayProgress?.lectures_completed || 0;
  const lectureRatio = Math.min(1, targetLectures > 0 ? completedLectures / targetLectures : 0);

  const targetDpps = todayGoal?.target_dpps || 2;
  const completedDpps = todayProgress?.dpps_completed || 0;
  const dppRatio = Math.min(1, targetDpps > 0 ? completedDpps / targetDpps : 0);

  const targetPyqs = todayGoal?.target_pyqs || 20;
  const completedPyqs = todayProgress?.pyqs_attempted || 0;
  const pyqRatio = Math.min(1, targetPyqs > 0 ? completedPyqs / targetPyqs : 0);

  const studySeconds = todayProgress?.total_study_seconds || 0;
  const studyHours = Math.round((studySeconds / 3600) * 10) / 10;
  const targetHours = todayGoal ? Math.round(todayGoal.target_study_minutes / 60) : 8;

  const totalScore = Math.round(
    ((lectureRatio + dppRatio + pyqRatio + Math.min(1, studyHours / targetHours)) / 4) * 100
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.appTitle}>GATE TRACK 90</Text>
            <Text style={styles.subtitle}>
              Day {prepDay.day} of 90 • {daysLeft} Days to GATE 2027
            </Text>
          </View>
          <View style={styles.topRightRow}>
            {/* Streak Badge */}
            <LinearGradient
              colors={Gradients.sunsetBlaze as any}
              style={styles.streakBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="flame" size={16} color="#FFFFFF" />
              <Text style={styles.streakText}>{stats?.streak ?? 0}D</Text>
            </LinearGradient>
            {/* Settings button */}
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.gearBtn}>
              <Ionicons name="settings-outline" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2 Primary Action Banners: Morning Target & Night 9 PM Review */}
        <View style={styles.actionPillRow}>
          {/* Morning Kickoff Pill */}
          <TouchableOpacity
            onPress={() => setMorningModalVisible(true)}
            style={styles.actionPill}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                todayGoal?.is_morning_set === 1
                  ? (['#065F46', '#047857'] as any)
                  : (['#B45309', '#D97706'] as any)
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pillGradient}
            >
              <Text style={styles.pillIcon}>{todayGoal?.is_morning_set === 1 ? '✅' : '🌅'}</Text>
              <View>
                <Text style={styles.pillTitle}>
                  {todayGoal?.is_morning_set === 1 ? 'Target Locked' : 'Morning Target'}
                </Text>
                <Text style={styles.pillSub}>
                  {todayGoal?.target_lectures ?? 5}L • {todayGoal?.target_dpps ?? 2}D • {todayGoal?.target_pyqs ?? 20}P
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Night 9 PM Review Pill */}
          <TouchableOpacity
            onPress={() => setNightModalVisible(true)}
            style={styles.actionPill}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                todayProgress?.night_review_done === 1
                  ? (['#4C1D95', '#6D28D9'] as any)
                  : isPast9PM
                  ? (['#BE123C', '#E11D48'] as any)
                  : (['#1E293B', '#334155'] as any)
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pillGradient}
            >
              <Text style={styles.pillIcon}>
                {todayProgress?.night_review_done === 1 ? '🎉' : '🌙'}
              </Text>
              <View>
                <Text style={styles.pillTitle}>
                  {todayProgress?.night_review_done === 1 ? '9 PM Done' : '9 PM Review'}
                </Text>
                <Text style={styles.pillSub}>
                  {todayProgress?.night_review_done === 1
                    ? `${todayProgress.target_achieved_pct}% Achieved`
                    : isPast9PM
                    ? 'Check-In Due!'
                    : 'Scheduled 9 PM'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* FEATURED: Real 3D Active Subject Card */}
        {activeSubject && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>★ ACTIVE SUBJECT IN QUEUE</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/roadmap')}>
                <Text style={styles.viewQueueLink}>Manage Queue →</Text>
              </TouchableOpacity>
            </View>

            <Card3D
              gradient={[activeSubject.gradient_start, activeSubject.gradient_end] as any}
              style={styles.heroCard}
            >
              <View style={styles.heroTop}>
                <View style={styles.heroBadgePill}>
                  <Text style={styles.heroBadgeText}>TOP PRIORITY (#1)</Text>
                </View>
                <TouchableOpacity
                  onPress={() => startTimer('cs_active', 'study')}
                  style={styles.timerChip}
                >
                  <Ionicons name="timer-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.timerChipText}>Timer</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.heroSubjectName}>{activeSubject.name}</Text>
              <Text style={styles.heroSubjectCode}>{activeSubject.code}</Text>

              {/* 3 Metric Rows with 1-Tap Quick Increment Buttons */}
              <View style={styles.heroMetricsGrid}>
                {/* Lectures */}
                <View style={styles.heroMetricCol}>
                  <Text style={styles.heroMetricLabel}>LECTURES</Text>
                  <Text style={styles.heroMetricVal}>
                    {activeSubject.completed_lectures}
                    <Text style={styles.heroMetricSub}>/{activeSubject.total_lectures}</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleQuickAdd(activeSubject.id, 'lecture')}
                    style={styles.heroAddBtn}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                    <Text style={styles.heroAddText}>Seen +1</Text>
                  </TouchableOpacity>
                </View>

                {/* DPP */}
                <View style={styles.heroMetricCol}>
                  <Text style={styles.heroMetricLabel}>DPP SOLVED</Text>
                  <Text style={styles.heroMetricVal}>
                    {activeSubject.completed_dpps}
                    <Text style={styles.heroMetricSub}>/{activeSubject.total_dpps}</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleQuickAdd(activeSubject.id, 'dpp')}
                    style={[styles.heroAddBtn, { backgroundColor: 'rgba(6, 182, 212, 0.35)' }]}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                    <Text style={styles.heroAddText}>DPP +1</Text>
                  </TouchableOpacity>
                </View>

                {/* PYQ */}
                <View style={styles.heroMetricCol}>
                  <Text style={styles.heroMetricLabel}>GATE PYQS</Text>
                  <Text style={styles.heroMetricVal}>
                    {activeSubject.pyqs_attempted}
                    <Text style={styles.heroMetricSub}> Solved</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleQuickAdd(activeSubject.id, 'pyq')}
                    style={[styles.heroAddBtn, { backgroundColor: 'rgba(16, 185, 129, 0.35)' }]}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                    <Text style={styles.heroAddText}>PYQ +1</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card3D>
          </View>
        )}

        {/* Today's Target vs Achieved Progress Ring Card */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>TODAY'S TARGET VS ACHIEVED</Text>
          <Card3D gradient={Gradients.cardGlassDark as any} style={styles.targetStatusCard}>
            <View style={styles.targetStatusRow}>
              {/* Circular Progress Ring */}
              <View style={styles.ringCol}>
                <CircularProgress
                  size={100}
                  strokeWidth={10}
                  percentage={totalScore}
                  color="#8B5CF6"
                  centerText={`${totalScore}%`}
                  centerSubtext="Target"
                />
              </View>

              {/* Progress Breakdown */}
              <View style={styles.statsBreakdown}>
                <View style={styles.statRow}>
                  <View style={[styles.statDot, { backgroundColor: '#8B5CF6' }]} />
                  <Text style={styles.statLabel}>PW Lectures:</Text>
                  <Text style={styles.statNumbers}>
                    {completedLectures}/{targetLectures}
                  </Text>
                </View>

                <View style={styles.statRow}>
                  <View style={[styles.statDot, { backgroundColor: '#06B6D4' }]} />
                  <Text style={styles.statLabel}>DPP Sheets:</Text>
                  <Text style={styles.statNumbers}>
                    {completedDpps}/{targetDpps}
                  </Text>
                </View>

                <View style={styles.statRow}>
                  <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.statLabel}>GATE PYQs:</Text>
                  <Text style={styles.statNumbers}>
                    {completedPyqs}/{targetPyqs}
                  </Text>
                </View>

                <View style={styles.statRow}>
                  <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.statLabel}>Study Hours:</Text>
                  <Text style={styles.statNumbers}>
                    {studyHours}h/{targetHours}h
                  </Text>
                </View>
              </View>
            </View>
          </Card3D>
        </View>

        {/* Queued Next Subjects Preview */}
        {queuedSubjects.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>NEXT IN STUDY QUEUE</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/roadmap')}>
                <Text style={styles.viewQueueLink}>View All ({queuedSubjects.length}) →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.queuePreviewScroll}>
              {queuedSubjects.slice(0, 4).map((subj) => {
                const pct =
                  subj.total_lectures > 0
                    ? Math.round((subj.completed_lectures / subj.total_lectures) * 100)
                    : 0;

                return (
                  <TouchableOpacity
                    key={subj.id}
                    onPress={() => router.push('/(tabs)/roadmap')}
                    activeOpacity={0.8}
                    style={styles.queueMiniCard}
                  >
                    <View style={styles.miniCardTop}>
                      <Text style={styles.miniRank}>#{subj.queue_order}</Text>
                      <Ionicons name={subj.icon as any} size={16} color={subj.color} />
                    </View>
                    <Text style={styles.miniName} numberOfLines={1}>
                      {subj.name}
                    </Text>
                    <Text style={styles.miniStats}>
                      {subj.completed_lectures}/{subj.total_lectures} Lec ({pct}%)
                    </Text>
                    <View style={styles.miniTrack}>
                      <View style={[styles.miniFill, { width: `${pct}%`, backgroundColor: subj.color }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 7-Day Colorful Weekly Bar Chart */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>7-DAY PREPARATION CONSISTENCY</Text>
          <Card3D gradient={Gradients.cardGlassDark as any} style={styles.chartCard}>
            <View style={styles.barsContainer}>
              {weeklyActivity.map((day, idx) => {
                const maxHours = 10;
                const barHeight = Math.min(100, (day.studyHours / maxHours) * 100);
                const isTargetMet = day.studyHours >= day.targetHours;

                return (
                  <View key={day.date} style={styles.barCol}>
                    <Text style={styles.barTopHours}>{day.studyHours > 0 ? `${day.studyHours}h` : ''}</Text>
                    <View style={styles.barTrack}>
                      <LinearGradient
                        colors={
                          isTargetMet
                            ? (['#10B981', '#059669'] as any)
                            : day.studyHours > 0
                            ? (['#6366F1', '#8B5CF6'] as any)
                            : (['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] as any)
                        }
                        style={[styles.barFill, { height: `${Math.max(6, barHeight)}%` }]}
                      />
                    </View>
                    <Text style={styles.barDayLabel}>{day.dayLabel}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>8h Target Met</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
                <Text style={styles.legendText}>In Progress</Text>
              </View>
            </View>
          </Card3D>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Morning Target Planner Modal */}
      <MorningTargetModal
        visible={morningModalVisible}
        onClose={() => setMorningModalVisible(false)}
        onSaved={async () => {
          await loadDashboardData();
          triggerRefresh();
        }}
        currentGoal={todayGoal}
      />

      {/* Night 9 PM Target Achieved Review Modal */}
      <NightReviewModal
        visible={nightModalVisible}
        onClose={() => setNightModalVisible(false)}
        onSaved={async () => {
          await loadDashboardData();
          triggerRefresh();
        }}
      />
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
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  gearBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  actionPill: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pillIcon: {
    fontSize: 20,
  },
  pillTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  pillSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionWrap: {
    marginTop: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  viewQueueLink: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 22,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroBadgePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timerChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroSubjectName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroSubjectCode: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 16,
    padding: 10,
  },
  heroMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroMetricVal: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginVertical: 4,
  },
  heroMetricSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '500',
  },
  heroAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  heroAddText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  targetStatusCard: {
    borderRadius: 20,
  },
  targetStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
  },
  statsBreakdown: {
    flex: 1,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  statNumbers: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  queuePreviewScroll: {
    marginHorizontal: -4,
  },
  queueMiniCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    width: 140,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  miniCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  miniRank: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  miniName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  miniStats: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },
  miniTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
  chartCard: {
    borderRadius: 20,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
    paddingBottom: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTopHours: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
    height: 12,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barDayLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
});
