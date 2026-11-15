import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/appStore';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
  const { theme } = useAppStore();
  const isLight = theme === 'light';
  const insets = useSafeAreaInsets();
  const themeColors = Colors[isLight ? 'light' : 'dark'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isLight ? '#7C3AED' : '#C084FC',
        tabBarInactiveTintColor: isLight ? '#94A3B8' : '#818CF8',
        tabBarStyle: {
          backgroundColor: themeColors.navBg,
          borderTopColor: themeColors.tabBarBorder,
          borderTopWidth: 1,
          height: 62 + (insets.bottom > 0 ? insets.bottom - 6 : 0),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size - 2} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{
          title: 'Queue',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'layers' : 'layers-outline'} size={size - 2} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size - 2} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="pyq"
        options={{
          title: 'PYQ',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={size - 2} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={size - 2} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
