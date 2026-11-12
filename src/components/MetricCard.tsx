import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  badgeLabel?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'estimated';
  progress?: number; // 0 to 100
  progressColor?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  iconName,
  iconColor = '#38BDF8',
  badgeLabel,
  badgeVariant = 'neutral',
  progress,
  progressColor = '#38BDF8',
  onPress,
  style
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[styles.card, style]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          {iconName && (
            <View style={[styles.iconBox, { backgroundColor: `${iconColor}15` }]}>
              <Ionicons name={iconName} size={16} color={iconColor} />
            </View>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {badgeLabel && <Badge label={badgeLabel} variant={badgeVariant} size="sm" />}
      </View>

      <Text style={styles.value}>{value}</Text>

      {progress !== undefined && (
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.max(0, Math.min(progress, 100))}%`,
                backgroundColor: progressColor
              }
            ]}
          />
        </View>
      )}

      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131720',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: 0.1,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E2536',
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  subtext: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 6,
  }
});

