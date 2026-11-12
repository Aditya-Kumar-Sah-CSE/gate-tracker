import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getDatabase } from '../db/database';
import { useAppStore } from '../stores/appStore';
import { TimerBanner } from '../components/TimerBanner';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { loadSettings, theme } = useAppStore();

  useEffect(() => {
    async function prepare() {
      try {
        await getDatabase();
        const settings = await loadSettings();
        setIsReady(true);
        await SplashScreen.hideAsync().catch(() => {});

        if (!settings.is_onboarded) {
          router.replace('/onboarding');
        }
      } catch (e) {
        console.error('Initialization error:', e);
        setIsReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
      <TimerBanner />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#0A0C10',
          },
          headerTintColor: theme === 'light' ? '#0F172A' : '#F8FAFC',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: theme === 'light' ? '#F8FAFC' : '#0A0C10',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings & PW Batch',
            presentation: 'modal',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0C10',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
