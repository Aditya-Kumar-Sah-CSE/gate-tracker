import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Gradients } from '../constants/theme';

export interface MetricChipItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color?: string;
  badge?: string;
}

export interface CosmicModalProps {
  visible: boolean;
  onClose: () => void;
  badgeEmoji?: string;
  badgeGradient?: readonly [string, string, ...string[]] | [string, string];
  title: string;
  subtitle?: string;
  tag?: string;
  items?: MetricChipItem[];
  streakText?: string;
  primaryButtonText?: string;
  onPrimaryPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
  type?: 'success' | 'warning' | 'info' | 'error';
  children?: React.ReactNode;
}

export const CosmicModal: React.FC<CosmicModalProps> = ({
  visible,
  onClose,
  badgeEmoji = '🎯',
  badgeGradient = Gradients.cyberViolet,
  title,
  subtitle,
  tag,
  items = [],
  streakText,
  primaryButtonText = "LET'S CRUSH IT 🚀",
  onPrimaryPress,
  secondaryButtonText,
  onSecondaryPress,
  type = 'success',
  children,
}) => {
  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePrimary = () => {
    triggerHaptic();
    if (onPrimaryPress) {
      onPrimaryPress();
    } else {
      onClose();
    }
  };

  const handleSecondary = () => {
    triggerHaptic();
    if (onSecondaryPress) {
      onSecondaryPress();
    } else {
      onClose();
    }
  };

  const getPrimaryGradient = () => {
    if (type === 'error') return ['#EF4444', '#DC2626', '#991B1B'] as const;
    if (type === 'warning') return Gradients.solarGold;
    return Gradients.sunsetBlaze;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Outer 3D Glowing Border */}
          <LinearGradient
            colors={['rgba(192, 132, 252, 0.45)', 'rgba(99, 102, 241, 0.25)', 'rgba(168, 85, 247, 0.15)'] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardBorderGradient}
          >
            <View style={styles.cardInner}>
              {/* Top 3D Floating Orb Badge */}
              <View style={styles.orbOuterRing}>
                <LinearGradient
                  colors={badgeGradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.orbInnerBadge}
                >
                  <Text style={styles.orbEmoji}>{badgeEmoji}</Text>
                </LinearGradient>
              </View>

              <ScrollView
                style={{ maxHeight: 420 }}
                contentContainerStyle={styles.scrollBody}
                showsVerticalScrollIndicator={false}
              >
                {/* Tag Pill if present */}
                {tag && (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                )}

                {/* Title & Subtitle */}
                <Text style={styles.titleText}>{title}</Text>
                {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}

                {/* Custom Children Content if any */}
                {children}

                {/* 2x2 Metric Grid Chips */}
                {items && items.length > 0 && (
                  <View style={styles.metricGrid}>
                    {items.map((item, idx) => (
                      <View key={idx} style={styles.metricChip}>
                        <View
                          style={[
                            styles.chipIconWrap,
                            { backgroundColor: item.color ? `${item.color}25` : 'rgba(168, 85, 247, 0.2)' },
                          ]}
                        >
                          <Ionicons
                            name={item.icon}
                            size={16}
                            color={item.color || '#C084FC'}
                          />
                        </View>
                        <View style={styles.chipTextWrap}>
                          <Text style={[styles.chipValue, item.color ? { color: item.color } : null]}>
                            {item.value}
                          </Text>
                          <Text style={styles.chipLabel} numberOfLines={1}>
                            {item.label}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Streak Callout Banner */}
                {streakText && (
                  <View style={styles.streakBanner}>
                    <Text style={styles.streakFlame}>🔥</Text>
                    <Text style={styles.streakMessage}>{streakText}</Text>
                  </View>
                )}
              </ScrollView>

              {/* 3D Action Buttons */}
              <View style={styles.btnRow}>
                {secondaryButtonText && (
                  <TouchableOpacity
                    onPress={handleSecondary}
                    style={styles.secondaryBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryBtnText}>{secondaryButtonText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handlePrimary}
                  style={[styles.primaryBtnWrap, !secondaryButtonText && { flex: 1 }]}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={getPrimaryGradient() as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtnGradient}
                  >
                    <Text style={styles.primaryBtnText}>{primaryButtonText}</Text>
                  </LinearGradient>
                  {/* 3D Button Bevel Shadow */}
                  <View style={styles.btnBevelShadow} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 18, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 24,
  },
  cardBorderGradient: {
    padding: 1.5,
    borderRadius: 28,
  },
  cardInner: {
    backgroundColor: '#120D2C', // Deep cosmic purple
    borderRadius: 26.5,
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: 'center',
    position: 'relative',
  },
  orbOuterRing: {
    position: 'absolute',
    top: -30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(18, 13, 44, 0.95)',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C084FC',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 12,
  },
  orbInnerBadge: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbEmoji: {
    fontSize: 26,
  },
  scrollBody: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  tagPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  tagText: {
    color: '#C084FC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitleText: {
    color: '#A5B4FC',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 14,
  },
  metricChip: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 22, 68, 0.75)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.22)',
    gap: 8,
  },
  chipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTextWrap: {
    flex: 1,
  },
  chipValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  chipLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  streakFlame: {
    fontSize: 16,
  },
  streakMessage: {
    color: '#FDE68A',
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(40, 32, 90, 0.6)',
    paddingVertical: 13,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  secondaryBtnText: {
    color: '#C084FC',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtnWrap: {
    flex: 2,
    position: 'relative',
    borderRadius: 18,
  },
  primaryBtnGradient: {
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  btnBevelShadow: {
    position: 'absolute',
    bottom: -3,
    left: 8,
    right: 8,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 18,
    zIndex: -1,
  },
});

