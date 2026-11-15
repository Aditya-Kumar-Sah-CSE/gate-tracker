import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { Gradients } from '../constants/theme';
import { AppUpdateInfo, downloadAndInstallUpdate } from '../services/updateService';

interface UpdateAvailableModalProps {
  visible: boolean;
  onClose: () => void;
  updateInfo: AppUpdateInfo | null;
}

export const UpdateAvailableModal: React.FC<UpdateAvailableModalProps> = ({
  visible,
  onClose,
  updateInfo,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  if (!updateInfo) return null;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleDownload = async () => {
    triggerHaptic();
    setIsDownloading(true);
    setDownloadProgress(5);
    try {
      await downloadAndInstallUpdate(updateInfo.downloadUrl, (pct) => {
        setDownloadProgress(pct);
      });
    } catch (e) {
      console.error('Update download error:', e);
      // Fallback: open release page
      await Linking.openURL(updateInfo.releasesUrl || updateInfo.downloadUrl);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenReleases = async () => {
    triggerHaptic();
    await Linking.openURL(updateInfo.releasesUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.45)', 'rgba(168, 85, 247, 0.35)', 'rgba(99, 102, 241, 0.25)'] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardBorderGradient}
          >
            <View style={styles.cardInner}>
              {/* Floating Rocket Orb */}
              <View style={styles.orbOuterRing}>
                <LinearGradient
                  colors={Gradients.sunsetBlaze as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.orbInnerBadge}
                >
                  <Text style={styles.orbEmoji}>🚀</Text>
                </LinearGradient>
              </View>

              <ScrollView
                style={{ maxHeight: 440 }}
                contentContainerStyle={styles.scrollBody}
                showsVerticalScrollIndicator={false}
              >
                {/* Release Tag Pill */}
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>⚡ OFFICIAL UPDATE</Text>
                </View>

                {/* Title */}
                <Text style={styles.titleText}>New Update Available!</Text>
                <Text style={styles.subtitleText}>
                  A new version of GATE TRACK 90 is ready for you.
                </Text>

                {/* Version Jump Box */}
                <View style={styles.versionRow}>
                  <View style={styles.versionBox}>
                    <Text style={styles.versionLabel}>CURRENT</Text>
                    <Text style={styles.versionOld}>v{updateInfo.currentVersion}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#C084FC" />
                  <View style={[styles.versionBox, styles.versionBoxNew]}>
                    <Text style={[styles.versionLabel, { color: '#FDE68A' }]}>LATEST</Text>
                    <Text style={styles.versionNew}>v{updateInfo.latestVersion}</Text>
                  </View>
                </View>

                {/* Release Notes */}
                <Text style={styles.notesSectionTitle}>What&apos;s New in this release:</Text>
                <View style={styles.notesContainer}>
                  {updateInfo.releaseNotes.map((note, index) => (
                    <View key={index} style={styles.noteItem}>
                      <Ionicons name="sparkles" size={12} color="#FBBF24" style={{ marginTop: 2 }} />
                      <Text style={styles.noteText}>{note}</Text>
                    </View>
                  ))}
                </View>

                {/* Progress Bar during Download */}
                {isDownloading && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressTitle}>Downloading APK Update...</Text>
                      <Text style={styles.progressPct}>{downloadProgress}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.btnColumn}>
                <TouchableOpacity
                  onPress={handleDownload}
                  disabled={isDownloading}
                  style={styles.primaryBtnWrap}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={Gradients.sunsetBlaze as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtnGradient}
                  >
                    {isDownloading ? (
                      <View style={styles.btnRowLoading}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.primaryBtnText}>
                          DOWNLOADING ({downloadProgress}%)...
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.btnRowLoading}>
                        <Ionicons name="cloud-download" size={16} color="#FFFFFF" />
                        <Text style={styles.primaryBtnText}>DOWNLOAD & INSTALL NOW 📥</Text>
                      </View>
                    )}
                  </LinearGradient>
                  <View style={styles.btnBevelShadow} />
                </TouchableOpacity>

                <View style={styles.secondaryRow}>
                  <TouchableOpacity
                    onPress={handleOpenReleases}
                    style={styles.browserBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="globe-outline" size={13} color="#C084FC" />
                    <Text style={styles.browserBtnText}>GitHub Releases</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.laterBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.laterBtnText}>Later</Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: 'rgba(5, 3, 18, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    shadowColor: '#F59E0B',
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
    backgroundColor: '#120D2C',
    borderRadius: 26.5,
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
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
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  tagText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitleText: {
    color: '#A5B4FC',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 14,
  },
  versionBox: {
    backgroundColor: 'rgba(28, 22, 68, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  versionBoxNew: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  versionLabel: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  versionOld: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '800',
  },
  versionNew: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '900',
  },
  notesSectionTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  notesContainer: {
    width: '100%',
    backgroundColor: 'rgba(20, 16, 50, 0.7)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
    marginBottom: 14,
    gap: 6,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
  progressContainer: {
    width: '100%',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTitle: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
  },
  progressPct: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  btnColumn: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  primaryBtnWrap: {
    width: '100%',
    position: 'relative',
    borderRadius: 18,
  },
  primaryBtnGradient: {
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRowLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
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
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  browserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  browserBtnText: {
    color: '#C084FC',
    fontSize: 11.5,
    fontWeight: '700',
  },
  laterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  laterBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});

