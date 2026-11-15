import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Svg, {
  Polygon,
  Line,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Subject } from '../types';
import { Gradients } from '../constants/theme';

interface RadialJourneyViewProps {
  subjects: Subject[];
  activeSubjectId: string;
  onSelectSubject: (subjectId: string) => void;
  lecturePct: number;
  dppPct: number;
  pyqPct: number;
  studyPct: number;
  overallPct: number;
}

export function RadialJourneyView({
  subjects,
  activeSubjectId,
  onSelectSubject,
  lecturePct,
  dppPct,
  pyqPct,
  studyPct,
  overallPct,
}: RadialJourneyViewProps) {
  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNodePress = (id: string) => {
    triggerHaptic();
    onSelectSubject(id);
  };

  // Center radar chart dimensions
  const centerRadius = 55;
  const svgSize = 150;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  // Radar points (normalized 0.15 to 0.95 so polygon always looks balanced)
  const normLec = 0.15 + (Math.min(100, Math.max(0, lecturePct)) / 100) * 0.8;
  const normDpp = 0.15 + (Math.min(100, Math.max(0, dppPct)) / 100) * 0.8;
  const normPyq = 0.15 + (Math.min(100, Math.max(0, pyqPct)) / 100) * 0.8;
  const normStudy = 0.15 + (Math.min(100, Math.max(0, studyPct)) / 100) * 0.8;

  // Top (Lecture), Right (PYQ), Bottom (Study), Left (DPP)
  const pTopX = cx;
  const pTopY = cy - normLec * centerRadius;

  const pRightX = cx + normPyq * centerRadius;
  const pRightY = cy;

  const pBottomX = cx;
  const pBottomY = cy + normStudy * centerRadius;

  const pLeftX = cx - normDpp * centerRadius;
  const pLeftY = cy;

  const polygonPoints = `${pTopX},${pTopY} ${pRightX},${pRightY} ${pBottomX},${pBottomY} ${pLeftX},${pLeftY}`;

  // Constellation circular positions (12 nodes)
  const containerSize = 340;
  const constellationRadius = 126;
  const centerPos = containerSize / 2;

  return (
    <View style={styles.container}>
      {/* Background Soft Glow Nebula */}
      <View style={styles.nebulaGlow} />

      {/* SVG Radar Chart in Center */}
      <View style={styles.centerRadarWrap}>
        <Svg width={svgSize} height={svgSize}>
          <Defs>
            <SvgGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#A855F7" stopOpacity="0.45" />
              <Stop offset="50%" stopColor="#3B82F6" stopOpacity="0.30" />
              <Stop offset="100%" stopColor="#10B981" stopOpacity="0.40" />
            </SvgGradient>
          </Defs>

          {/* Background Diamond Grids */}
          <Polygon
            points={`${cx},${cy - centerRadius} ${cx + centerRadius},${cy} ${cx},${cy + centerRadius} ${cx - centerRadius},${cy}`}
            fill="rgba(255, 255, 255, 0.03)"
            stroke="rgba(168, 85, 247, 0.25)"
            strokeWidth="1"
          />
          <Polygon
            points={`${cx},${cy - centerRadius * 0.5} ${cx + centerRadius * 0.5},${cy} ${cx},${cy + centerRadius * 0.5} ${cx - centerRadius * 0.5},${cy}`}
            fill="transparent"
            stroke="rgba(168, 85, 247, 0.15)"
            strokeWidth="1"
          />

          {/* Cross Axes */}
          <Line x1={cx} y1={cy - centerRadius} x2={cx} y2={cy + centerRadius} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <Line x1={cx - centerRadius} y1={cy} x2={cx + centerRadius} y2={cy} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Dynamic Progress Polygon */}
          <Polygon
            points={polygonPoints}
            fill="url(#radarFill)"
            stroke="#C084FC"
            strokeWidth="2.5"
          />

          {/* Vertex Dots */}
          <Circle cx={pTopX} cy={pTopY} r="3.5" fill="#10B981" />
          <Circle cx={pRightX} cy={pRightY} r="3.5" fill="#06B6D4" />
          <Circle cx={pBottomX} cy={pBottomY} r="3.5" fill="#A855F7" />
          <Circle cx={pLeftX} cy={pLeftY} r="3.5" fill="#F59E0B" />
        </Svg>

        {/* Center Percentage Display */}
        <View style={styles.centerTextOverlay} pointerEvents="none">
          <Text style={styles.centerPctText}>{overallPct}%</Text>
          <Text style={styles.centerPctSub}>Overall Progress</Text>
        </View>

        {/* 4 Cardinal Skill Badges */}
        <View style={[styles.cardinalBadge, styles.badgeTop]}>
          <Text style={styles.cardinalEmoji}>📗</Text>
          <Text style={styles.cardinalLabel}>Lectures</Text>
        </View>
        <View style={[styles.cardinalBadge, styles.badgeRight]}>
          <Text style={styles.cardinalEmoji}>🎤</Text>
          <Text style={styles.cardinalLabel}>PYQs</Text>
        </View>
        <View style={[styles.cardinalBadge, styles.badgeBottom]}>
          <Text style={styles.cardinalEmoji}>🖊️</Text>
          <Text style={styles.cardinalLabel}>Writing</Text>
        </View>
        <View style={[styles.cardinalBadge, styles.badgeLeft]}>
          <Text style={styles.cardinalEmoji}>📖</Text>
          <Text style={styles.cardinalLabel}>DPPs</Text>
        </View>
      </View>

      {/* 12 Circular Journey Gem Nodes */}
      {subjects.slice(0, 12).map((subj, index) => {
        const angle = (index / 12) * 2 * Math.PI - Math.PI / 2;
        const x = centerPos + constellationRadius * Math.cos(angle);
        const y = centerPos + constellationRadius * Math.sin(angle);

        const isActive = subj.id === activeSubjectId;
        const isDone = subj.status === 'done' || subj.status === 'completed';
        const isDoing = subj.status === 'doing' || (isActive && !isDone);

        const nodeNumber = index + 1;

        return (
          <View
            key={subj.id}
            style={[
              styles.nodeAbsoluteWrap,
              {
                left: x - 26,
                top: y - 26,
                zIndex: isActive ? 20 : 10,
              },
            ]}
          >
            {/* Golden Diamond Pin on Active Node */}
            {isActive && (
              <View style={styles.activePinContainer}>
                <View style={styles.activePinShape}>
                  <Text style={{ fontSize: 10 }}>💎</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => handleNodePress(subj.id)}
              activeOpacity={0.8}
              style={[
                styles.nodeTouchTarget,
                isActive && styles.activeNodeGlow,
              ]}
            >
              <LinearGradient
                colors={
                  isActive
                    ? (Gradients.gemActive as any)
                    : isDone
                    ? (Gradients.gamifiedPurple as any)
                    : isDoing
                    ? (['#6D28D9', '#4F46E5'] as any)
                    : (Gradients.gemStone as any)
                }
                style={[
                  styles.nodePill,
                  isActive && styles.activeNodeBorder,
                  !isDone && !isActive && styles.lockedNodeBorder,
                ]}
              >
                <Text
                  style={[
                    styles.nodeNumberText,
                    isActive && styles.activeNumberText,
                    !isDone && !isActive && styles.lockedNumberText,
                  ]}
                >
                  {nodeNumber}
                </Text>

                {/* Sub-icon or star rating */}
                {isDone ? (
                  <View style={styles.starsRow}>
                    <Ionicons name="star" size={6} color="#FBBF24" />
                    <Ionicons name="star" size={6} color="#FBBF24" />
                    <Ionicons name="star" size={6} color="#FBBF24" />
                  </View>
                ) : isActive ? (
                  <Ionicons name="flash" size={8} color="#FFFFFF" />
                ) : (
                  <Ionicons name="lock-closed" size={7} color="#64748B" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 340,
    height: 340,
    alignSelf: 'center',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  nebulaGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    filter: Platform.OS === 'web' ? 'blur(35px)' : undefined,
  },
  centerRadarWrap: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPctText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  centerPctSub: {
    color: 'rgba(192, 132, 252, 0.85)',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  cardinalBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeTop: {
    top: -4,
    alignSelf: 'center',
  },
  badgeBottom: {
    bottom: -4,
    alignSelf: 'center',
  },
  badgeLeft: {
    left: -22,
    top: '44%',
  },
  badgeRight: {
    right: -16,
    top: '44%',
  },
  cardinalEmoji: {
    fontSize: 9,
  },
  cardinalLabel: {
    color: '#CBD5E1',
    fontSize: 8,
    fontWeight: '700',
  },
  nodeAbsoluteWrap: {
    position: 'absolute',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePinContainer: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    zIndex: 30,
  },
  activePinShape: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nodeTouchTarget: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNodeGlow: {
    shadowColor: '#A855F7',
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  nodePill: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  activeNodeBorder: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  lockedNodeBorder: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  nodeNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  activeNumberText: {
    fontSize: 15,
    fontWeight: '900',
  },
  lockedNumberText: {
    color: '#94A3B8',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 1,
  },
});

