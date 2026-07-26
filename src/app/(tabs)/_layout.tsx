// Kinezi-AI Tab Layout
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ name, focused, icon }: { name: string; focused: boolean; icon: string }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{name}</Text>
      {focused && <View style={styles.tabIndicator} />}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: insets.bottom || (Platform.OS === 'ios' ? 28 : 16),
            height: 60 + (insets.bottom || (Platform.OS === 'ios' ? 28 : 16)),
          }
        ],
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.neonCyan,
        tabBarInactiveTintColor: Colors.tabInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Ana Sayfa" focused={focused} icon="🏠" />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Antrenman',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Antrenman" focused={focused} icon="🏋️" />
          ),
        }}
      />
      <Tabs.Screen
        name="program"
        options={{
          title: 'Programım',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Programım" focused={focused} icon="📋" />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Geçmiş',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Geçmiş" focused={focused} icon="📊" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Profil" focused={focused} icon="⚙️" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: Colors.bgGlassBorder,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
    fontSize: 24,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    color: Colors.tabInactive,
    fontWeight: FontWeight.medium,
  },
  tabLabelActive: {
    color: Colors.neonCyan,
    fontWeight: FontWeight.semibold,
  },
  tabIndicator: {
    width: 20,
    height: 2,
    backgroundColor: Colors.neonCyan,
    borderRadius: 1,
    marginTop: 2,
    shadowColor: Colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
