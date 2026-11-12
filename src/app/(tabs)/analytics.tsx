import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../stores/appStore';
import {
  getOverallStats,
  getSubjectsInQueue,
  getWeeklyActivity,
} from '../../db/database';
import { Subject, DayActivity } from '../../types';
import { Colors, Gradients } from '../../constants/theme';
import { Card3D } from '../../components/Card3D';

export default function AnalyticsScreen() {
  const { dataVersion } = useAppStore();

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

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<DayActivity[]>([]);

  const loadData = async () => {
    try {
      const [allStats, subjs, week] = await Promise.all([
        getOverallStats(),
        getSubjectsInQueue(),
        getWeeklyActivity(7),
      ]);
      setStats(allStats);
      setSubjects(subjs);
      setWeeklyActivity(week);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dataVersion])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Preparation Analytics</Text>
          <Text style={styles.headerSubtitle}>Measurable progress across all 12 GATE CSE subjects</Text>
        </View>

        {/* 4 Macro Metrics Grid */}
        <View style={styles.macroGrid}>
          {/* Lectures */}
          <Card3D gradient={Gradients.cyberViolet as any} style={styles.macroCard}>
            <Ionicons name="play-circle" size={24} color="#FFFFFF" />
            <Text style={styles.macroNum}>
              {stats?.completedLectures || 0}
              <Text style={styles.macroSubNum}>/{stats?.totalLectures || 0}</Text>
            </Text>
            <Text style={styles.macroLabel}>PW Lectures ({stats?.lecturePct || 0}%)</Text>
          </Card3D>

          {/* DPP */}
          <Card3D gradient={Gradients.oceanCyan as any} style={styles.macroCard}>
            <Ionicons name="document-text" size={24} color="#FFFFFF" />
            <Text style={styles.macroNum}>
              {stats?.completedDpps || 0}
              <Text style={styles.macroSubNum}>/{stats?.totalDpps || 0}</Text>
            </Text>
            <Text style={styles.macroLabel}>DPP Sheets ({stats?.dppPct || 0}%)</Text>
          </Card3D>

          {/* PYQ */}
          <Card3D gradient={Gradients.electricEmerald as any} style={styles.macroCard}>
            <Ionicons name="trophy" size={24} color="#FFFFFF" />
            <Text style={styles.macroNum}>{stats?.totalPyqs || 0}</Text>
            <Text style={styles.macroLabel}>PYQs ({stats?.pyqAccuracy || 0}% Accuracy)</Text>
          </Card3D>

          {/* Consistency */}
          <Card3D gradient={Gradients.sunsetBlaze as any} style={styles.macroCard}>
            <Ionicons name="flame" size={24} color="#FFFFFF" />
            <Text style={styles.macroNum}>{stats?.streak || 0} Days</Text>
            <Text style={styles.macroLabel}>Current Active Streak</Text>
          </Card3D>
        </View>

        {/* 7-Day Consistency Bar Chart */}
        <Text style={styles.sectionTitle}>WEEKLY TARGET CONSISTENCY</Text>
        <Card3D gradient={Gradients.cardGlassDark as any} style={styles.chartCard}>
          <View style={styles.barsContainer}>
            {weeklyActivity.map((day) => {
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
        </Card3D>

        {/* Subject-Wise Progress Breakdown */}
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>SUBJECT COMPLETION BREAKDOWN</Text>
        <View style={styles.subjectList}>
          {subjects.map((subj) => {
            const lecPct =
              subj.total_lectures > 0
                ? Math.min(100, Math.round((subj.completed_lectures / subj.total_lectures) * 100))
                : 0;

            const accuracy =
              subj.pyqs_attempted > 0
                ? Math.round((subj.pyqs_correct / subj.pyqs_attempted) * 100)
                : 0;

            return (
              <Card3D
                key={subj.id}
                gradient={[subj.gradient_start, subj.gradient_end] as any}
                style={styles.subjectCard}
              >
                <View style={styles.subjCardHeader}>
                  <View style={styles.subjNameGroup}>
                    <Ionicons name={subj.icon as any} size={18} color="#FFFFFF" />
                    <Text style={styles.subjCardName}>{subj.name}</Text>
                  </View>
                  <Text style={styles.subjCardCode}>{subj.code}</Text>
                </View>

                {/* Progress bars */}
                <View style={styles.progressRow}>
                  <View style={styles.progressCol}>
                    <Text style={styles.progLabel}>Lectures: {subj.completed_lectures}/{subj.total_lectures}</Text>
                    <View style={styles.progTrack}>
                      <View style={[styles.progFill, { width: `${lecPct}%` }]} />
                    </View>
                  </View>

                  <View style={styles.progressCol}>
                    <Text style={styles.progLabel}>
                      PYQ Acc: {subj.pyqs_attempted > 0 ? `${accuracy}%` : 'N/A'}
                    </Text>
                    <View style={styles.progTrack}>
                      <View style={[styles.progFill, { width: `${accuracy}%`, backgroundColor: '#10B981' }]} />
                    </View>
                  </View>
                </View>
              </Card3D>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 12,
  },
  macroCard: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
  },
  macroNum: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  macroSubNum: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  macroLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chartCard: {
    borderRadius: 20,
    marginBottom: 14,
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
  subjectList: {
    gap: 10,
  },
  subjectCard: {
    borderRadius: 16,
  },
  subjCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subjNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjCardName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  subjCardCode: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCol: {
    flex: 1,
  },
  progLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  progTrack: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});
