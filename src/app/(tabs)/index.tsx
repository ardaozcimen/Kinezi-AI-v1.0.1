// Kinezi-AI Dashboard (Home Screen)
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { EXERCISES } from '@/constants/exercises';
import { getUserStats, getRecentWorkouts } from '@/lib/storage';
import { UserStats, WorkoutHistory } from '@/lib/pose/types';
import { getScoreColor } from '@/lib/pose/rules';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutHistory[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef(EXERCISES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    loadData();
    startAnimations();
  }, []);

  const loadData = async () => {
    const userStats = await getUserStats();
    const recent = await getRecentWorkouts(5);
    setStats(userStats);
    setRecentWorkouts(recent);
  };

  const startAnimations = () => {
    // Pulse animation for start button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered card animations
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 200 + index * 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const renderStatCard = (
    label: string,
    value: string | number,
    icon: string,
    color: string
  ) => (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba! 👋</Text>
            <Text style={styles.title}>{user?.username ? user.username : 'Kinezi-AI'}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>{stats?.currentStreak || 0}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {renderStatCard(
            'Antrenman',
            stats?.totalWorkouts || 0,
            '💪',
            Colors.neonCyan
          )}
          {renderStatCard(
            'Seri',
            stats?.currentStreak || 0,
            '🔥',
            Colors.neonOrange
          )}
          {renderStatCard(
            'Ort. Skor',
            stats?.averageScore || '-',
            '⭐',
            Colors.neonGreen
          )}
          {renderStatCard(
            'Toplam Rep',
            stats?.totalReps || 0,
            '🎯',
            Colors.neonMagenta
          )}
        </View>

        {/* Quick Start Button */}
        <Animated.View
          style={[
            styles.startButtonWrapper,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/workout')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors.gradientCyan}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButton}
            >
              <Text style={styles.startButtonIcon}>⚡</Text>
              <Text style={styles.startButtonText}>Antrenmana Başla</Text>
              <Text style={styles.startButtonSubtext}>
                Kameranı aç, formunu analiz et
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Exercise Cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Egzersizler</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/workout')}>
            <Text style={styles.seeAllText}>Tümünü Gör →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.exerciseScroll}
        >
          {EXERCISES.map((exercise, index) => (
            <Animated.View
              key={exercise.id}
              style={[
                styles.exerciseCard,
                {
                  opacity: fadeAnims[index],
                  transform: [
                    {
                      translateY: fadeAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => router.push(`/exercise/${exercise.id}` as any)}
                activeOpacity={0.7}
                style={styles.exerciseCardInner}
              >
                <LinearGradient
                  colors={[Colors.bgTertiary, Colors.bgSecondary]}
                  style={styles.exerciseGradient}
                >
                  <Text style={styles.exerciseIcon}>{exercise.icon}</Text>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.exerciseMeta}>
                    <View
                      style={[
                        styles.difficultyBadge,
                        {
                          backgroundColor:
                            exercise.difficulty === 'beginner'
                              ? Colors.neonGreenDim
                              : exercise.difficulty === 'intermediate'
                              ? 'rgba(255, 229, 0, 0.2)'
                              : Colors.neonRedDim,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          {
                            color:
                              exercise.difficulty === 'beginner'
                                ? Colors.neonGreen
                                : exercise.difficulty === 'intermediate'
                                ? Colors.neonYellow
                                : Colors.neonRed,
                          },
                        ]}
                      >
                        {exercise.difficulty === 'beginner'
                          ? 'Başlangıç'
                          : exercise.difficulty === 'intermediate'
                          ? 'Orta'
                          : 'İleri'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.exerciseReps}>
                    {exercise.id === 'plank'
                      ? `${exercise.defaultSets} set`
                      : `${exercise.defaultSets}×${exercise.defaultReps}`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Son Antrenmanlar</Text>
            </View>
            {recentWorkouts.map((workout, index) => (
              <View key={workout.id} style={styles.recentCard}>
                <View style={styles.recentLeft}>
                  <Text style={styles.recentExercise}>
                    {EXERCISES.find((e) => e.id === workout.exerciseId)?.icon}{' '}
                    {workout.exerciseName}
                  </Text>
                  <Text style={styles.recentDate}>{workout.date}</Text>
                </View>
                <View style={styles.recentRight}>
                  <Text
                    style={[
                      styles.recentScore,
                      { color: getScoreColor(workout.score) },
                    ]}
                  >
                    {workout.score}
                  </Text>
                  <Text style={styles.recentReps}>
                    {workout.reps} rep · {workout.sets} set
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Empty state */}
        {recentWorkouts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Henüz antrenman yok</Text>
            <Text style={styles.emptySubtext}>
              İlk antrenmanını başlat ve formunu analiz et!
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  title: {
    fontSize: FontSize.title,
    color: Colors.textPrimary,
    fontWeight: FontWeight.black,
    letterSpacing: -1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    gap: 4,
  },
  streakIcon: {
    fontSize: 18,
  },
  streakText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.neonOrange,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },
  startButtonWrapper: {
    marginBottom: Spacing.xxxl,
  },
  startButton: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.neonCyan,
  },
  startButtonIcon: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  startButtonText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.bgPrimary,
    letterSpacing: -0.5,
  },
  startButtonSubtext: {
    fontSize: FontSize.sm,
    color: 'rgba(10, 10, 15, 0.7)',
    marginTop: Spacing.xs,
    fontWeight: FontWeight.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: FontSize.md,
    color: Colors.neonCyan,
    fontWeight: FontWeight.semibold,
  },
  exerciseScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  exerciseCard: {
    width: SCREEN_WIDTH * 0.38,
  },
  exerciseCardInner: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  exerciseGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  exerciseIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  exerciseName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  exerciseReps: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  recentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  recentLeft: {
    flex: 1,
  },
  recentExercise: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  recentDate: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  recentRight: {
    alignItems: 'flex-end',
  },
  recentScore: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  recentReps: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
