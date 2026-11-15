import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAppStore } from '../stores/appStore';
import {
  exportDatabaseToJson,
  importDatabaseFromJson,
} from '../db/database';
import { DatabaseBackup } from '../types';
import { Badge } from '../components/Badge';
import { CosmicModal } from '../components/CosmicModal';
import { UpdateAvailableModal } from '../components/UpdateAvailableModal';
import { checkForAppUpdate, AppUpdateInfo, APP_VERSION, APP_VERSION_CODE } from '../services/updateService';

export default function SettingsScreen() {
  const { settings, updateSettings, triggerRefresh, theme, setTheme } = useAppStore();

  const [startDate, setStartDate] = useState(settings?.prep_start_date || '2026-11-12');
  const [examDate, setExamDate] = useState(settings?.target_exam_date || '2027-02-06');
  const [dailyHours, setDailyHours] = useState(String(settings?.daily_study_hours_target ?? 8));
  const [dailyLectures, setDailyLectures] = useState(String(settings?.daily_lecture_target ?? 5));
  const [dailyDpps, setDailyDpps] = useState(String(settings?.daily_dpp_target ?? 2));
  const [dailyPyqs, setDailyPyqs] = useState(String(settings?.daily_pyq_target ?? 20));
  const [dailyRev, setDailyRev] = useState(String(settings?.daily_revision_minutes_target ?? 60));
  const [notifEnabled, setNotifEnabled] = useState(settings?.notifications_enabled === 1);
  const [morningTime, setMorningTime] = useState(settings?.morning_reminder_time || '07:00');
  const [nightTime, setNightTime] = useState(settings?.night_reminder_time || '21:00');

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [cosmicModalVisible, setCosmicModalVisible] = useState(false);
  const [cosmicModalConfig, setCosmicModalConfig] = useState<{
    title: string;
    subtitle?: string;
    type?: 'success' | 'warning' | 'info' | 'error';
    badgeEmoji?: string;
  }>({ title: '' });

  const showCosmicAlert = (
    title: string,
    subtitle?: string,
    type: 'success' | 'warning' | 'info' | 'error' = 'success',
    badgeEmoji: string = '✨'
  ) => {
    setCosmicModalConfig({ title, subtitle, type, badgeEmoji });
    setCosmicModalVisible(true);
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        prep_start_date: startDate.trim(),
        target_exam_date: examDate.trim(),
        daily_study_hours_target: parseFloat(dailyHours) || 8.0,
        daily_lecture_target: parseInt(dailyLectures, 10) || 5,
        daily_dpp_target: parseInt(dailyDpps, 10) || 2,
        daily_pyq_target: parseInt(dailyPyqs, 10) || 20,
        daily_revision_minutes_target: parseInt(dailyRev, 10) || 60,
        notifications_enabled: notifEnabled ? 1 : 0,
        morning_reminder_time: morningTime.trim(),
        night_reminder_time: nightTime.trim(),
      });

      triggerRefresh();
      showCosmicAlert(
        'Settings Saved! ⚙️',
        'Target configurations and daily preparation parameters updated successfully.',
        'success',
        '⚙️'
      );
    } catch (err: any) {
      showCosmicAlert('Error Saving Settings', err.message || 'Failed to update settings', 'error', '⚠️');
    }
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const info = await checkForAppUpdate();
      if (info && info.updateAvailable) {
        setUpdateInfo(info);
        setUpdateModalVisible(true);
      } else {
        showCosmicAlert(
          'All Up To Date! ✨',
          `You are running the latest version v${APP_VERSION} (Build ${APP_VERSION_CODE}). No new updates available right now.`,
          'success',
          '🚀'
        );
      }
    } catch (err: any) {
      showCosmicAlert('Update Check Failed', err?.message || 'Could not reach update server. Check network.', 'error', '⚠️');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const backupData = await exportDatabaseToJson();
      const jsonString = JSON.stringify(backupData, null, 2);

      const fileName = `GATE_TRACK_90_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      const fileUri = `${FileSystem.documentDirectory || ''}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export GATE TRACK 90 Data Backup',
          UTI: 'public.json'
        });
      } else {
        showCosmicAlert('Backup Exported 📁', `Saved to ${fileUri}`, 'success', '💾');
      }
    } catch (e: any) {
      showCosmicAlert('Export Failed', e.message || 'Could not export database backup', 'error', '⚠️');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackupConfirm = async () => {
    try {
      const fileName = `GATE_TRACK_90_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      const fileUri = `${FileSystem.documentDirectory || ''}${fileName}`;
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        setIsImporting(true);
        const content = await FileSystem.readAsStringAsync(fileUri);
        const parsed = JSON.parse(content) as DatabaseBackup;
        await importDatabaseFromJson(parsed);
        triggerRefresh();
        showCosmicAlert('Restore Complete! 🎉', 'All study records restored successfully from backup.', 'success', '✨');
        router.replace('/(tabs)');
      } else {
        showCosmicAlert(
          'Restore Backup 📥',
          'Place your exported GATE_TRACK_90_BACKUP_YYYY-MM-DD.json file in the app documents folder to auto-restore.',
          'info',
          '📥'
        );
      }
    } catch (e: any) {
      showCosmicAlert('Import Failed', e?.message || 'Could not restore backup file.', 'error', '⚠️');
    } finally {
      setIsImporting(false);
    }
  };

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16) + 8;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: topInset }]}>
      <StatusBar barStyle="light-content" />
      {/* Batch Information Card */}
      <View style={styles.batchCard}>
        <View style={styles.batchHeaderRow}>
          <Ionicons name="school" size={20} color="#38BDF8" />
          <Badge label="ACTIVE PW BATCH" variant="primary" />
        </View>
        <Text style={styles.batchTitle}>
          Parakram GATE 2027 Batch B - (Hinglish) - Computer Science
        </Text>
        <Text style={styles.batchInfo}>
          • Physics Wallah does not provide an open public API. All preparation tracking runs 100% offline with zero cloud dependency.{'\n'}
          • Confirmed Batch Counts: General Aptitude (18 Lec / 19 DPP), TOC (29 Lec / 5 DPP), C Programming (22 Lec / 11 DPP), Discrete Mathematics (48 Lec / 6 DPP).{'\n'}
          • All remaining subjects use 30 estimated lectures, fully editable in Roadmap.
        </Text>
      </View>

      {/* Preparation Timeline */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={18} color="#38BDF8" />
          <Text style={styles.cardTitle}>Preparation Timeline</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target GATE 2027 Exam Date</Text>
          <TextInput
            style={styles.input}
            value={examDate}
            onChangeText={setExamDate}
            placeholderTextColor="#64748B"
          />
        </View>
      </View>

      {/* Daily Fixed Targets */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="flame-outline" size={18} color="#F59E0B" />
          <Text style={styles.cardTitle}>Daily Fixed Targets</Text>
        </View>

        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>PW Lectures</Text>
            <TextInput
              style={styles.input}
              value={dailyLectures}
              onChangeText={setDailyLectures}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>DPP Sheets</Text>
            <TextInput
              style={styles.input}
              value={dailyDpps}
              onChangeText={setDailyDpps}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>GATE PYQs</Text>
            <TextInput
              style={styles.input}
              value={dailyPyqs}
              onChangeText={setDailyPyqs}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Revision (Mins)</Text>
            <TextInput
              style={styles.input}
              value={dailyRev}
              onChangeText={setDailyRev}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Daily Study Hours Target</Text>
          <TextInput
            style={styles.input}
            value={dailyHours}
            onChangeText={setDailyHours}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="notifications-outline" size={18} color="#818CF8" />
          <Text style={styles.cardTitle}>Local Daily Reminders</Text>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Enable Daily Reminders</Text>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            trackColor={{ false: '#232A3B', true: '#38BDF8' }}
          />
        </View>

        {notifEnabled && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Morning Focus Reminder (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={morningTime}
                onChangeText={setMorningTime}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Night 9 PM Check-In Reminder (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={nightTime}
                onChangeText={setNightTime}
              />
            </View>
          </>
        )}
      </View>

      {/* Theme */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="moon-outline" size={18} color="#38BDF8" />
          <Text style={styles.cardTitle}>Appearance Theme</Text>
        </View>

        <View style={styles.themeRow}>
          <TouchableOpacity
            style={[styles.themeBtn, theme === 'dark' && styles.themeBtnActive]}
            onPress={() => setTheme('dark')}
          >
            <Ionicons name="moon" size={16} color={theme === 'dark' ? '#38BDF8' : '#94A3B8'} />
            <Text style={[styles.themeBtnText, theme === 'dark' && styles.themeBtnTextActive]}>
              OLED Dark
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeBtn, theme === 'light' && styles.themeBtnActive]}
            onPress={() => setTheme('light')}
          >
            <Ionicons name="sunny" size={16} color={theme === 'light' ? '#38BDF8' : '#94A3B8'} />
            <Text style={[styles.themeBtnText, theme === 'light' && styles.themeBtnTextActive]}>
              Clean Light
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Settings Button */}
      <TouchableOpacity style={styles.saveSettingsBtn} onPress={handleSaveSettings}>
        <Ionicons name="save-outline" size={18} color="#0A0C10" />
        <Text style={styles.saveSettingsBtnText}>Save All Settings</Text>
      </TouchableOpacity>

      {/* Backup and Restore */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
          <Text style={styles.cardTitle}>Offline Data Backup & Restore</Text>
        </View>
        <Text style={styles.cardDesc}>
          Export your entire SQLite database into a portable JSON backup file. No cloud or internet connection needed.
        </Text>

        <View style={styles.backupBtnRow}>
          <TouchableOpacity
            style={styles.exportBtn}
            disabled={isExporting}
            onPress={handleExportBackup}
          >
            <Ionicons name="download-outline" size={16} color="#38BDF8" />
            <Text style={styles.exportBtnText}>
              {isExporting ? 'Exporting...' : 'Export JSON Backup'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.importBtn}
            disabled={isImporting}
            onPress={handleImportBackupConfirm}
          >
            <Ionicons name="refresh-outline" size={16} color="#10B981" />
            <Text style={styles.importBtnText}>Restore JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Version & In-App Update Engine */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={18} color="#C084FC" />
          <Text style={styles.cardTitle}>App Information & Updates</Text>
        </View>
        <View style={styles.versionRow}>
          <View>
            <Text style={styles.versionTitle}>GATE TRACK 90</Text>
            <Text style={styles.versionSub}>Release Version 1.3.3 (Build 7)</Text>
          </View>
          <View style={styles.versionTag}>
            <Text style={styles.versionTagText}>OFFICIAL</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCheckUpdates}
          disabled={isCheckingUpdate}
          style={styles.checkUpdateBtn}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isCheckingUpdate ? 'sync' : 'cloud-download-outline'}
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.checkUpdateText}>
            {isCheckingUpdate ? 'Checking for updates...' : 'Check for Updates Now 🔄'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>

    {/* 3D Cosmic Alert Modal */}
    <CosmicModal
      visible={cosmicModalVisible}
      onClose={() => setCosmicModalVisible(false)}
      badgeEmoji={cosmicModalConfig.badgeEmoji}
      title={cosmicModalConfig.title}
      subtitle={cosmicModalConfig.subtitle}
      type={cosmicModalConfig.type}
      primaryButtonText="GOT IT"
      onPrimaryPress={() => setCosmicModalVisible(false)}
    />

    {/* In-App Auto-Updater Modal */}
    <UpdateAvailableModal
      visible={updateModalVisible}
      onClose={() => setUpdateModalVisible(false)}
      updateInfo={updateInfo}
    />
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0C10',
  },
  content: {
    padding: 16,
  },
  batchCard: {
    backgroundColor: '#131720',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
    padding: 16,
    marginBottom: 16,
  },
  batchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 22,
    marginBottom: 8,
  },
  batchInfo: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#131720',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232A3B',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  cardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  themeBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  themeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  themeBtnTextActive: {
    color: '#38BDF8',
  },
  saveSettingsBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  saveSettingsBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0C10',
  },
  backupBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  importBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  importBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  versionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  versionSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  versionTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  versionTagText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkUpdateBtn: {
    marginTop: 14,
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  checkUpdateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
