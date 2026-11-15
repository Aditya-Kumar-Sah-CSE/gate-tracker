import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../stores/appStore';
import {
  getTodayGoals,
  getTodayProgress,
  getWeeklyActivity,
  getActiveSubject,
  updateTodayProgressItem,
} from '../../db/database';
import { Subject, DailyGoal, DailyProgress, DayActivity } from '../../types';
import { Colors, Gradients } from '../../constants/theme';
import { Card3D } from '../../components/Card3D';
import { MorningTargetModal } from '../../components/MorningTargetModal';
import { NightReviewModal } from '../../components/NightReviewModal';

export default function PlannerScreen() {
  const { dataVersion, triggerRefresh } = useAppStore();

  const [todayGoal, setTodayGoal] = useState<DailyGoal | null>(null);
  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<DayActivity[]>([]);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);

  // Modals
  const [morningModalVisible, setMorningModalVisible] = useState(false);
  const [nightModalVisible, setNightModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [goal, prog, week, activeSubj] = await Promise.all([
        getTodayGoals(),
        getTodayProgress(),
        getWeeklyActivity(7),
        getActiveSubject(),
      ]);

      setTodayGoal(goal);
      setTodayProgress(prog);
      setWeeklyActivity(week);
      setActiveSubject(activeSubj);
    } catch (e) {
      console.error(e);
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

  const handleProgressDelta = async (
    type: 'lecture' | 'dpp' | 'pyq' | 'hours',
    delta: number
  ) => {
    triggerHaptic();
    try {
      const res = await updateTodayProgressItem(type, delta, activeSubject?.id);
      setTodayProgress(res.progress);
      if (res.subject) {
        setActiveSubject(res.subject);
      }
      await loadData();
      triggerRefresh();
    } catch (err) {
      console.error('Planner progress update error:', err);
    }
  };

  // Weekly aggregates
  const totalWeeklyLec = weeklyActivity.reduce((acc, d) => acc + d.lectures, 0);
  const totalWeeklyDpp = weeklyActivity.reduce((acc, d) => acc + d.dpps, 0);
  const totalWeeklyPyq = weeklyActivity.reduce((acc, d) => acc + d.pyqs, 0);
  const totalWeeklyHours = Math.round(weeklyActivity.reduce((acc, d) => acc + d.studyHours, 0) * 10) / 10;

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16) + 8;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: topInset }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Daily & Weekly Planner</Text>
            <Text style={styles.headerSubtitle}>
              Target setting & 9 PM achievement tracking
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setMorningModalVisible(true)}
            style={styles.setTargetBtn}
          >
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            <Text style={styles.setTargetText}>Set Targets</Text>
          </TouchableOpacity>
        </View>

        {/* 2 Primary Flow Banners */}
        <View style={styles.bannerRow}>
          <TouchableOpacity
            onPress={() => setMorningModalVisible(true)}
            style={styles.flowBanner}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Gradients.sunsetBlaze as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.flowBannerGradient}
            >
              <Text style={styles.flowIcon}>🌅</Text>
              <View>
                <Text style={styles.flowTitle}>Morning Target</Text>
                <Text style={styles.flowSub}>
                  {todayGoal?.is_morning_set === 1 ? 'Target Locked 🚀' : 'Tap to set today\'s goals'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setNightModalVisible(true)}
            style={styles.flowBanner}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Gradients.cyberViolet as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.flowBannerGradient}
            >
              <Text style={styles.flowIcon}>🌙</Text>
              <View>
                <Text style={styles.flowTitle}>9 PM Review</Text>
                <Text style={styles.flowSub}>
                  {todayProgress?.night_review_done === 1
                    ? `${todayProgress.target_achieved_pct}% Conquered`
                    : 'Check-in & log today'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Active Focus Subject Banner */}
        {activeSubject && (
          <Card3D
            gradient={[activeSubject.gradient_start, activeSubject.gradient_end] as any}
            style={styles.subjectFocusCard}
          >
            <View style={styles.focusHeader}>
              <View style={styles.focusPill}>
                <Text style={styles.focusPillText}>{"TODAY'S ACTIVE SUBJECT"}</Text>
              </View>
              <Text style={styles.focusCode}>{activeSubject.code}</Text>
            </View>
            <Text style={styles.focusName}>{activeSubject.name}</Text>
            <Text style={styles.focusMeta}>
              Total Progress: {activeSubject.completed_lectures}/{activeSubject.total_lectures} Lectures • {activeSubject.completed_dpps}/{activeSubject.total_dpps} DPP • {activeSubject.pyqs_attempted} PYQs
            </Text>
          </Card3D>
        )}

        {/* Today's 4 Core Deliverables */}
        <Text style={styles.sectionTitle}>{"TODAY'S 4 CORE TARGETS"}</Text>

        {/* 1. Lectures Target */}
        <Card3D gradient={Gradients.cyberViolet as any} style={styles.targetCard}>
          <View style={styles.targetRow}>
            <View style={styles.targetLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="play-circle" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.targetTitle}>PW LECTURES</Text>
                <Text style={styles.targetSub}>
                  {todayProgress?.lectures_completed ?? 0} of {todayGoal?.target_lectures ?? 5} Completed
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => handleProgressDelta('lecture', -1)}
                style={[styles.quickAddBtn, { paddingHorizontal: 10 }]}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleProgressDelta('lecture', 1)}
                style={styles.quickAddBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.quickAddText}>+1</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card3D>

        {/* 2. DPP Target */}
        <Card3D gradient={Gradients.oceanCyan as any} style={styles.targetCard}>
          <View style={styles.targetRow}>
            <View style={styles.targetLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(6, 182, 212, 0.3)' }]}>
                <Ionicons name="document-text" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.targetTitle}>DPP SHEETS</Text>
                <Text style={styles.targetSub}>
                  {todayProgress?.dpps_completed ?? 0} of {todayGoal?.target_dpps ?? 2} Solved
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => handleProgressDelta('dpp', -1)}
                style={[styles.quickAddBtn, { backgroundColor: 'rgba(6, 182, 212, 0.35)', paddingHorizontal: 10 }]}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleProgressDelta('dpp', 1)}
                style={[styles.quickAddBtn, { backgroundColor: 'rgba(6, 182, 212, 0.35)' }]}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.quickAddText}>+1</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card3D>

        {/* 3. PYQ Target */}
        <Card3D gradient={Gradients.electricEmerald as any} style={styles.targetCard}>
          <View style={styles.targetRow}>
            <View style={styles.targetLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.3)' }]}>
                <Ionicons name="trophy" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.targetTitle}>GATE PYQS</Text>
                <Text style={styles.targetSub}>
                  {todayProgress?.pyqs_attempted ?? 0} of {todayGoal?.target_pyqs ?? 20} Attempted
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => handleProgressDelta('pyq', -1)}
                style={[styles.quickAddBtn, { backgroundColor: 'rgba(16, 185, 129, 0.35)', paddingHorizontal: 10 }]}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleProgressDelta('pyq', 1)}
                style={[styles.quickAddBtn, { backgroundColor: 'rgba(16, 185, 129, 0.35)' }]}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.quickAddText}>+1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleProgressDelta('pyq', 5)}
                style={[styles.quickAddBtn, { backgroundColor: 'rgba(16, 185, 129, 0.45)', paddingHorizontal: 9 }]}
                activeOpacity={0.7}
              >
                <Text style={styles.quickAddText}>+5</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card3D>

        {/* 4. Study Hours Target */}
        <Card3D gradient={Gradients.solarGold as any} style={styles.targetCard}>
          <View style={styles.targetRow}>
            <View style={styles.targetLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.3)' }]}>
                <Ionicons name="time" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.targetTitle}>STUDY TIME</Text>
                <Text style={styles.targetSub}>
                  {Math.round(((todayProgress?.total_study_seconds || 0) / 3600) * 10) / 10}h of{' '}
                  {todayGoal ? Math.round(todayGoal.target_study_minutes / 60) : 8}h Logged
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => handleProgressDelta('hours', -0.5)}
                style={[styles.quickAddBtn, { backgroundColor: 'rgba(245, 158, 11, 0.35)', paddingHorizontal: 10 }]}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleProgressDelta('hours', 0.5)}
                style={[styles.quickAddBtn, { backgroundColor: 'rgba(245, 158, 11, 0.35)' }]}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.quickAddText}>+30m</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNightModalVisible(true)}
                style={[styles.quickAddBtn, { backgroundColor: 'rgba(245, 158, 11, 0.45)' }]}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                <Text style={styles.quickAddText}>9 PM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card3D>

        {/* Weekly Summary Card */}
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>7-DAY SUMMARY TOTALS</Text>
        <Card3D gradient={Gradients.cardGlassDark as any} style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>{totalWeeklyLec}</Text>
              <Text style={styles.summaryLabel}>Lectures Seen</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>{totalWeeklyDpp}</Text>
              <Text style={styles.summaryLabel}>DPPs Solved</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>{totalWeeklyPyq}</Text>
              <Text style={styles.summaryLabel}>PYQs Solved</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>{totalWeeklyHours}h</Text>
              <Text style={styles.summaryLabel}>Study Hours</Text>
            </View>
          </View>
        </Card3D>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Morning Target Planner Modal */}
      <MorningTargetModal
        visible={morningModalVisible}
        onClose={() => setMorningModalVisible(false)}
        onSaved={async () => {
          await loadData();
          triggerRefresh();
        }}
        currentGoal={todayGoal}
      />

      {/* Night 9 PM Target Achieved Review Modal */}
      <NightReviewModal
        visible={nightModalVisible}
        onClose={() => setNightModalVisible(false)}
        onSaved={async () => {
          await loadData();
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
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
  setTargetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  setTargetText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  flowBanner: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  flowBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  flowIcon: {
    fontSize: 22,
  },
  flowTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  flowSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  subjectFocusCard: {
    marginBottom: 16,
    borderRadius: 20,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  focusPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  focusPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  focusCode: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '700',
  },
  focusName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  focusMeta: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  targetCard: {
    marginBottom: 12,
    borderRadius: 18,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  targetSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryCard: {
    borderRadius: 18,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNum: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});
