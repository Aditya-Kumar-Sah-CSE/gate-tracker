import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';

interface DailyBarData {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. 'Mon'
  hours: number;
}

interface WeeklyBarChartProps {
  data: DailyBarData[];
  targetHours?: number; // default 8
  height?: number;
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({
  data,
  targetHours = 8.0,
  height = 130
}) => {
  const maxHours = Math.max(targetHours * 1.25, ...data.map((d) => d.hours), 10);
  const chartHeight = height - 28;
  const barWidth = 22;
  const targetY = chartHeight - (targetHours / maxHours) * chartHeight;

  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        <Svg width="100%" height={chartHeight}>
          {/* Target Reference Line */}
          <Line
            x1="0"
            y1={targetY}
            x2="100%"
            y2={targetY}
            stroke="rgba(56, 189, 248, 0.4)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {data.map((item, index) => {
            const barH = Math.max(2, (item.hours / maxHours) * chartHeight);
            const xOffset = `${index * 14.28 + 3}%`;
            const yOffset = chartHeight - barH;
            const isHit = item.hours >= targetHours;

            return (
              <Rect
                key={item.date}
                x={xOffset}
                y={yOffset}
                width={barWidth}
                height={barH}
                rx={4}
                fill={isHit ? '#10B981' : (item.hours > 0 ? '#38BDF8' : '#1E2536')}
              />
            );
          })}
        </Svg>
      </View>

      {/* Target Marker */}
      <View style={[styles.targetLabelBox, { top: targetY - 7 }]}>
        <Text style={styles.targetLabel}>{targetHours}h</Text>
      </View>

      {/* Days Row */}
      <View style={styles.daysRow}>
        {data.map((item) => (
          <View key={item.date} style={styles.dayCol}>
            <Text style={styles.dayText}>{item.dayLabel}</Text>
            <Text style={[styles.hourText, item.hours >= targetHours ? styles.hitText : null]}>
              {item.hours > 0 ? `${item.hours.toFixed(1)}h` : '-'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#131720',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 14,
    paddingTop: 18,
    position: 'relative',
  },
  chartArea: {
    height: 102,
    width: '100%',
    paddingRight: 24,
  },
  targetLabelBox: {
    position: 'absolute',
    right: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  targetLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 24,
    marginTop: 8,
  },
  dayCol: {
    alignItems: 'center',
    width: 32,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  hourText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  hitText: {
    color: '#10B981',
  }
});

