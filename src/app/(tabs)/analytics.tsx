import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/appStore';
import {
  getDailyProgressRange,
  getRealProgressIndicators,
  RealProgressIndicators,
  getPyqAttempts,
  getSubjectProgressSummaries,
  getMistakeLogs
} from '../../db/database';
import { WeeklyBarChart } from '../../components/WeeklyBarChart';
import { MetricCard } from '../../components/MetricCard';
import { Badge } from '../../components/Badge';
import { SubjectProgressSummary, PyqAttempt, MistakeLog } from '../../types';

export default function AnalyticsScreen() {
  const { dataVersion, settings } = useAppStore();

  const [timeFilter, setTimeFilter] = useState<7 | 30 | 90>(7);
  const [stats, setStats] = useState<RealProgressIndicators | null>(null);
  const [chartData, setChartData] = useState<{ date: string; dayLabel: string; hours: number }[]>([]);
  const [subjects, setSubjects] = useState<SubjectProgressSummary[]>([]);
  const [attempts, setAttempts] = useState<PyqAttempt[]>([]);
  const [mistakes, setMistakes] = useState<MistakeLog[]>([]);

  const loadData = async () => {
    try {
      const [indicators, progressRange, subjs, allAttempts, allMistakes] = await Promise.all([
        getRealProgressIndicators(),
        getDailyProgressRange(timeFilter),
        getSubjectProgressSummaries(),
        getPyqAttempts(),
        getMistakeLogs()
      ]);

      setStats(indicators);
      setSubjects(subjs);
      setAttempts(allAttempts);
      setMistakes(allMistakes);

      const days = timeFilter === 7 ? 7 : (timeFilter === 30 ? 14 : 21); // Display last N day intervals in chart
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dataPoints: { date: string; dayLabel: string; hours: number }[] = [];

      const progressMap = new Map(progressRange.map((r) => [r.date, r.total_study_seconds]));

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const dStr = d.toISOString().slice(0, 10);
        const seconds = progressMap.get(dStr) || 0;
        dataPoints.push({
          date: dStr,
          dayLabel: dayNames[d.getDay()],
          hours: Math.round((seconds / 3600) * 10) / 10
        });
      }

      setChartData(dataPoints);
    } catch (e) {
      console.error('Error loading analytics:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dataVersion, timeFilter])
  );

  // Difficulty Accuracy breakdown
  const easyAttempts = attempts.filter((a) => a.difficulty === 'Easy');
  const medAttempts = attempts.filter((a) => a.difficulty === 'Medium');
  const hardAttempts = attempts.filter((a) => a.difficulty === 'Hard');

  const calcAcc = (arr: PyqAttempt[]) => {
    if (arr.length === 0) return null;
    const corr = arr.filter((a) => a.is_correct === 1).length;
    return Math.round((corr / arr.length) * 100);
  };

  const easyAcc = calcAcc(easyAttempts);
  const medAcc = calcAcc(medAttempts);
  const hardAcc = calcAcc(hardAttempts);

  // Mistake distribution
  const totalMistakes = mistakes.length;
  const mistakeCounts: Record<string, number> = {};
  for (const m of mistakes) {
    mistakeCounts[m.mistake_category] = (mistakeCounts[m.mistake_category] || 0) + 1;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Progress Analytics</Text>
          <Text style={styles.screenSubtitle}>
            Verified SQLite records • Pure performance metrics
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {[7, 30, 90].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, timeFilter === f && styles.filterBtnActive]}
              onPress={() => setTimeFilter(f as any)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  timeFilter === f && styles.filterBtnTextActive
                ]}
              >
                Last {f} Days
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Study Hours Chart */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Study Hours</Text>
          <Text style={styles.sectionNote}>Daily 8h target</Text>
        </View>
        <WeeklyBarChart data={chartData} targetHours={settings?.daily_study_hours_target || 8} />

        {/* Core Metrics Overview Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Preparation Key Indicators</Text>
          <Text style={styles.sectionNote}>Real course data</Text>
        </View>

        <View style={styles.grid}>
          <MetricCard
            title="PW Lectures"
            value={`${stats?.completedLectures || 0} / ${stats?.totalLectures || 487}`}
            subtext={`${stats?.confirmedLectures || 117} confirmed lectures`}
            iconName="videocam-outline"
            iconColor="#38BDF8"
            progress={stats?.lectureCompletionPct || 0}
            progressColor="#38BDF8"
            style={{ width: '48%' }}
          />

          <MetricCard
            title="PW DPP Sheets"
            value={`${stats?.completedDpps || 0} / ${stats?.totalConfirmedDpps || 41}`}
            subtext={`${stats?.dppCompletionPct || 0}% of confirmed 41 DPPs`}
            iconName="list-outline"
            iconColor="#10B981"
            progress={stats?.dppCompletionPct || 0}
            progressColor="#10B981"
            style={{ width: '48%' }}
          />

          <MetricCard
            title="GATE Accuracy"
            value={stats?.overallAccuracyPct !== null ? `${stats?.overallAccuracyPct}%` : 'Not Started'}
            subtext={`${stats?.totalPyqsCorrect || 0} / ${stats?.totalPyqsAttempted || 0} Questions`}
            iconName="disc-outline"
            iconColor="#F59E0B"
            progress={stats?.overallAccuracyPct || 0}
            progressColor="#F59E0B"
            style={{ width: '48%' }}
          />

          <MetricCard
            title="Revision Mastered"
            value={`${stats?.totalRevisionsCompleted || 0} / ${stats?.totalRevisionsDue || 0}`}
            subtext="Spaced intervals R1 to R5"
            iconName="refresh-outline"
            iconColor="#818CF8"
            progress={
              stats && stats.totalRevisionsDue > 0
                ? Math.round((stats.totalRevisionsCompleted / stats.totalRevisionsDue) * 100)
                : 100
            }
            progressColor="#818CF8"
            style={{ width: '48%' }}
          />
        </View>

        {/* Difficulty-wise Accuracy */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Accuracy by Difficulty</Text>
          <Text style={styles.sectionNote}>GATE Questions</Text>
        </View>

        <View style={styles.diffCard}>
          <View style={styles.diffRow}>
            <Text style={styles.diffLabel}>Easy</Text>
            <View style={styles.diffBarBg}>
              <View
                style={[
                  styles.diffBarFill,
                  { width: `${easyAcc !== null ? easyAcc : 0}%`, backgroundColor: '#10B981' }
                ]}
              />
            </View>
            <Text style={styles.diffVal}>
              {easyAcc !== null ? `${easyAcc}% (${easyAttempts.length} Q)` : 'Not Started'}
            </Text>
          </View>

          <View style={styles.diffRow}>
            <Text style={styles.diffLabel}>Medium</Text>
            <View style={styles.diffBarBg}>
              <View
                style={[
                  styles.diffBarFill,
                  { width: `${medAcc !== null ? medAcc : 0}%`, backgroundColor: '#F59E0B' }
                ]}
              />
            </View>
            <Text style={styles.diffVal}>
              {medAcc !== null ? `${medAcc}% (${medAttempts.length} Q)` : 'Not Started'}
            </Text>
          </View>

          <View style={styles.diffRow}>
            <Text style={styles.diffLabel}>Hard</Text>
            <View style={styles.diffBarBg}>
              <View
                style={[
                  styles.diffBarFill,
                  { width: `${hardAcc !== null ? hardAcc : 0}%`, backgroundColor: '#F43F5E' }
                ]}
              />
            </View>
            <Text style={styles.diffVal}>
              {hardAcc !== null ? `${hardAcc}% (${hardAttempts.length} Q)` : 'Not Started'}
            </Text>
          </View>
        </View>

        {/* Mistake Taxonomy Distribution */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mistake Root Cause Analysis</Text>
          <Text style={styles.sectionNote}>{totalMistakes} logged</Text>
        </View>

        <View style={styles.mistakeDistCard}>
          {totalMistakes === 0 ? (
            <Text style={styles.noMistakesText}>
              No incorrect question mistakes logged yet.
            </Text>
          ) : (
            Object.entries(mistakeCounts).map(([cat, count]) => {
              const pct = Math.round((count / totalMistakes) * 100);
              return (
                <View key={cat} style={styles.mistakeDistRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.distCatName}>{cat}</Text>
                    <View style={styles.distBarBg}>
                      <View style={[styles.distBarFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.distCountText}>
                    {count} ({pct}%)
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Subject-Wise Mastery Table */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subject-wise Mastery Breakdown</Text>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thCell, { flex: 2 }]}>Subject</Text>
            <Text style={styles.thCell}>Lectures</Text>
            <Text style={styles.thCell}>DPP</Text>
            <Text style={styles.thCell}>Accuracy</Text>
          </View>

          {subjects.map((s) => (
            <View key={s.subject.id} style={styles.tableRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.tdSubjName} numberOfLines={1}>
                  {s.subject.name}
                </Text>
                {s.is_lecture_count_estimated && (
                  <Text style={styles.tdEstTag}>Estimated count</Text>
                )}
              </View>

              <Text style={styles.tdCell}>
                {s.completed_lectures}/{s.total_lectures}
              </Text>

              <Text style={styles.tdCell}>
                {s.total_dpps !== null ? `${s.completed_dpps}/${s.total_dpps}` : '-'}
              </Text>

              <Text
                style={[
                  styles.tdCell,
                  s.pyq_accuracy !== null
                    ? (s.pyq_accuracy >= 70
                        ? styles.accHigh
                        : s.pyq_accuracy >= 50
                        ? styles.accMed
                        : styles.accLow)
                    : null
                ]}
              >
                {s.pyq_accuracy !== null ? `${s.pyq_accuracy}%` : '-'}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  header: {
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#131720',
    borderWidth: 1,
    borderColor: '#232A3B',
    alignItems: 'center',
  },
  filterBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterBtnTextActive: {
    color: '#38BDF8',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  sectionNote: {
    fontSize: 11,
    color: '#64748B',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  diffCard: {
    backgroundColor: '#131720',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 14,
    marginBottom: 10,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  diffLabel: {
    width: 60,
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  diffBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E2536',
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  diffBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  diffVal: {
    width: 100,
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'right',
  },
  mistakeDistCard: {
    backgroundColor: '#131720',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 14,
    marginBottom: 10,
  },
  noMistakesText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  mistakeDistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  distCatName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  distBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E2536',
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    backgroundColor: '#F43F5E',
    borderRadius: 3,
  },
  distCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 10,
    minWidth: 55,
    textAlign: 'right',
  },
  tableCard: {
    backgroundColor: '#131720',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#232A3B',
    paddingBottom: 8,
    marginBottom: 6,
  },
  thCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#1A212E',
  },
  tdSubjName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  tdEstTag: {
    fontSize: 9,
    color: '#C084FC',
  },
  tdCell: {
    flex: 1,
    fontSize: 11,
    color: '#94A3B8',
  },
  accHigh: {
    color: '#10B981',
    fontWeight: '700',
  },
  accMed: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  accLow: {
    color: '#F43F5E',
    fontWeight: '700',
  },
});

