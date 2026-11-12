import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/appStore';

export default function TabLayout() {
  const { theme } = useAppStore();
  const isLight = theme === 'light';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: isLight ? '#94A3B8' : '#64748B',
        tabBarStyle: {
          backgroundColor: isLight ? '#FFFFFF' : '#0D1017',
          borderTopColor: isLight ? '#E2E8F0' : '#1A212E',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
          title: 'Roadmap',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={size - 2} color={color as string} />
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
