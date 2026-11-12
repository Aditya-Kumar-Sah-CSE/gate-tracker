import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  percentage: number;
  color: string;
  trackColor?: string;
  centerText?: string;
  centerSubtext?: string;
  textColor?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth,
  percentage,
  color,
  trackColor = 'rgba(255, 255, 255, 0.08)',
  centerText,
  centerSubtext,
  textColor = '#F8FAFC'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(percentage, 100));
  const strokeDashoffset = circumference - (circumference * clamped) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      {(centerText !== undefined || centerSubtext !== undefined) && (
        <View style={[StyleSheet.absoluteFill, styles.centerContainer]}>
          {centerText !== undefined && (
            <Text style={[styles.centerText, { color: textColor }]}>{centerText}</Text>
          )}
          {centerSubtext !== undefined && (
            <Text style={styles.centerSubtext}>{centerSubtext}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  centerSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginTop: 1,
    letterSpacing: 0.5,
  }
});
