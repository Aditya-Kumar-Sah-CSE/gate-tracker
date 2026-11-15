import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Gradients } from '../constants/theme';
import { Card3D } from './Card3D';

interface VersionUpdateModalProps {
  visible: boolean;
  onClose: () => void;
}

export function VersionUpdateModal({ visible, onClose }: VersionUpdateModalProps) {
  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleClose = () => {
    triggerHaptic();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <LinearGradient
            colors={Gradients.cyberViolet as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerIcon}>🚀</Text>
                <View>
                  <Text style={styles.headerTitle}>GATE TRACK 90 • v1.2.0</Text>
                  <Text style={styles.headerSubtitle}>{"New update features & fixes active!"}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Feature 1 */}
            <Card3D gradient={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)'] as any} style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#8B5CF6' }]}>
                  <Ionicons name="list" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>All 12 Subjects Active & Loaded</Text>
                  <Text style={styles.featureDesc}>
                    Permanent database self-healing guarantee. All 12 GATE CSE subjects from PW Batch are visible in the study queue.
                  </Text>
                </View>
              </View>
            </Card3D>

            {/* Feature 2 */}
            <Card3D gradient={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)'] as any} style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="toggle" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Side Toggle: [ Doing | Done ]</Text>
                  <Text style={styles.featureDesc}>
                    {'Every subject card has a side toggle to mark it actively "Doing" or completed "Done" with 1 tap.'}
                  </Text>
                </View>
              </View>
            </Card3D>

            {/* Feature 3 */}
            <Card3D gradient={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)'] as any} style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="sunny" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Step 1 ➔ Step 2 Morning Target</Text>
                  <Text style={styles.featureDesc}>
                    Select your focus subject first, then lock daily Lectures, DPP, PYQ, and Study Hours for the day.
                  </Text>
                </View>
              </View>
            </Card3D>

            {/* Feature 4 */}
            <Card3D gradient={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)'] as any} style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#06B6D4' }]}>
                  <Ionicons name="moon" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>9:00 PM Night Target Confirmation</Text>
                  <Text style={styles.featureDesc}>
                    Check in every evening to confirm what you achieved vs your morning goal and save your daily streak!
                  </Text>
                </View>
              </View>
            </Card3D>

            {/* Dismiss Button */}
            <TouchableOpacity onPress={handleClose} style={styles.confirmBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={Gradients.sunsetBlaze as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmGradient}
              >
                <Ionicons name="rocket" size={18} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>{"GOT IT, LET'S CRUSH GATE 2027 🚀"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 16 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#0F131D',
    borderRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  headerGradient: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    fontSize: 26,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 16,
  },
  featureCard: {
    marginBottom: 10,
    borderRadius: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  featureDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  confirmBtn: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
