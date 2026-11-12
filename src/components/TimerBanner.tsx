import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, formatTimeDigital } from '../stores/appStore';

export const TimerBanner: React.FC = () => {
  const {
    isTimerRunning,
    isTimerPaused,
    timerSeconds,
    timerSubjectId,
    timerTaskCategory,
    tickTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    discardTimer
  } = useAppStore();

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !isTimerPaused) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isTimerPaused, tickTimer]);

  if (!isTimerRunning) {
    return null;
  }

  const handleStop = async () => {
    const elapsed = await stopTimer();
    const mins = Math.round(elapsed / 60);
    Alert.alert('Session Logged', `Logged ${mins} minutes of focused study.`);
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Session?',
      'Are you sure you want to discard this study timer without saving?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: discardTimer }
      ]
    );
  };

  return (
    <View style={styles.banner}>
      <View style={styles.infoCol}>
        <View style={styles.tagRow}>
          <View style={styles.pulsingDot} />
          <Text style={styles.tagText}>
            {timerSubjectId.toUpperCase()} • {timerTaskCategory.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.digitalClock}>{formatTimeDigital(timerSeconds)}</Text>
      </View>

      <View style={styles.actionsRow}>
        {isTimerPaused ? (
          <TouchableOpacity style={styles.actionBtn} onPress={resumeTimer}>
            <Ionicons name="play" size={18} color="#10B981" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={pauseTimer}>
            <Ionicons name="pause" size={18} color="#F59E0B" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.actionBtn, styles.stopBtn]} onPress={handleStop}>
          <Ionicons name="stop" size={18} color="#F8FAFC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleDiscard}>
          <Ionicons name="trash-outline" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#171C28',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#38BDF8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
    letterSpacing: 0.3,
  },
  digitalClock: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#232A3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    backgroundColor: '#F43F5E',
  }
});

