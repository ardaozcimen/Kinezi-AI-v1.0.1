// Kinezi-AI Workout Selection Screen
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { EXERCISES, CATEGORY_LABELS, ExerciseCategory, Exercise } from '@/constants/exercises';

type FilterType = 'all' | ExerciseCategory;

export default function WorkoutScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnims = useRef(EXERCISES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    animateCards();
  }, [activeFilter]);

  const animateCards = () => {
    // Reset
    fadeAnims.forEach((a) => a.setValue(0));
    // Stagger in
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'lower_body', label: 'Alt Vücut' },
    { key: 'upper_body', label: 'Üst Vücut' },
    { key: 'core', label: 'Core' },
    { key: 'pilates', label: 'Pilates' },
  ];

  const filteredExercises = EXERCISES.filter((e) => {
    const matchesCategory = activeFilter === 'all' || e.category === activeFilter;
    const matchesSearch = (e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.nameTr.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          e.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleExerciseSelect = (exercise: Exercise) => {
    router.push(`/exercise/${exercise.id}` as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Antrenman</Text>
        <Text style={styles.subtitle}>Egzersiz seç ve formunu analiz et</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Egzersiz Ara (Örn: Squat)..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={{ height: 60, flexGrow: 0 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            onPress={() => setActiveFilter(filter.key)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>

      {/* Exercise List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredExercises.map((exercise, index) => (
          <Animated.View
            key={exercise.id}
            style={{
              opacity: fadeAnims[index] || 1,
              transform: [
                {
                  translateY: (fadeAnims[index] || new Animated.Value(1)).interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              onPress={() => handleExerciseSelect(exercise)}
              activeOpacity={0.7}
              style={styles.exerciseCard}
            >
              <View style={styles.exerciseLeft}>
                <Text style={styles.exerciseIcon}>{exercise.icon}</Text>
              </View>
              <View style={styles.exerciseMiddle}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDescription} numberOfLines={2}>
                  {exercise.descriptionTr}
                </Text>
                <View style={styles.exerciseTags}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor:
                          exercise.difficulty === 'beginner'
                            ? Colors.neonGreenDim
                            : exercise.difficulty === 'intermediate'
                            ? 'rgba(255, 229, 0, 0.15)'
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
                  <Text style={styles.muscleText}>
                    {exercise.muscleGroups.slice(0, 2).join(' · ')}
                  </Text>
                </View>
              </View>
              <View style={styles.exerciseRight}>
                <Text style={styles.exerciseReps}>
                  {exercise.id === 'plank'
                    ? `${exercise.defaultSets} set`
                    : `${exercise.defaultSets}×${exercise.defaultReps}`}
                </Text>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  clearSearchBtn: {
    padding: Spacing.sm,
  },
  clearSearchText: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.neonCyanDim,
    borderColor: Colors.neonCyan,
  },
  filterText: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  filterTextActive: {
    color: Colors.neonCyan,
    fontWeight: FontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  exerciseLeft: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  exerciseIcon: {
    fontSize: 28,
  },
  exerciseMiddle: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  exerciseDescription: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  exerciseTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
  muscleText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  exerciseRight: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  exerciseReps: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  arrowIcon: {
    fontSize: FontSize.xl,
    color: Colors.neonCyan,
    fontWeight: FontWeight.bold,
  },
});
