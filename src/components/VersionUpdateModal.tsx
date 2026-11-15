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
                  <Text style={styles.headerTitle}>GATE TRACK 90 • v1.3.6</Text>
                  <Text style={styles.headerSubtitle}>{"Pure 3 Pillars • Clean 9 PM Review • Direct Updater"}</Text>
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
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Add & Delete Subjects</Text>
                  <Text style={styles.featureDesc}>
                    Add your own subjects with custom lectures, DPPs, and codes. Delete finished or unwanted subjects with 3D confirmation.
                  </Text>
                </View>
              </View>
            </Card3D>

            {/* Feature 2 */}
            <Card3D gradient={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)'] as any} style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="apps" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Clean & Focused Dashboard</Text>
                  <Text style={styles.featureDesc}>
                    Removed confusing circular 1-12 node wheel from Home screen. Focus directly on today targets and active subject missions.
                  </Text>
                </View>
              </View>
            </Card3D>

            {/* Feature 3 */}
            <Card3D gradient={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)'] as any} style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#06B6D4' }]}>
                  <Ionicons name="cloud-download" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Direct APK Downloader</Text>
                  <Text style={styles.featureDesc}>
                    Fixed update downloading: opens system browser directly to download and prompt package installer without native share sheets.
                  </Text>
                </View>
              </View>
            </Card3D>

            {/* Feature 4 */}
            <Card3D gradient={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)'] as any} style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="star" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>3D Active Focus Confirmation</Text>
                  <Text style={styles.featureDesc}>
                    Switching your primary active subject prompts with a radiant 3D confirmation card, preventing accidental changes to your queue.
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
