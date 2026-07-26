// Kinezi-AI History Screen
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { getWorkoutHistory, getUserStats, getMuscleGroupStats, getWeightHistory, WeightEntry } from '@/lib/storage';
import { WorkoutHistory, UserStats } from '@/lib/pose/types';
import { getScoreColor } from '@/lib/pose/rules';
import { EXERCISES } from '@/constants/exercises';
import { LineChart, PieChart } from 'react-native-gifted-charts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Colors for Pie Chart
const PIE_COLORS = [
  Colors.neonCyan,
  Colors.neonOrange,
  Colors.neonGreen,
  Colors.neonMagenta,
  Colors.neonYellow,
  Colors.neonRed,
  '#A855F7',
  '#3B82F6',
  '#EC4899',
];

export default function HistoryScreen() {
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [muscleStats, setMuscleStats] = useState<{ muscle: string; value: number }[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('bench_press');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const h = await getWorkoutHistory();
    const s = await getUserStats();
    const m = await getMuscleGroupStats();
    const w = await getWeightHistory(); // Fetch all to find available exercises

    setHistory(h);
    setStats(s);
    setMuscleStats(m);
    setWeightHistory(w);

    // Auto-select the first available exercise if the current one has no data
    const uniqueIds = Array.from(new Set(w.map(entry => entry.exerciseId)));
    if (uniqueIds.length > 0 && !uniqueIds.includes(selectedExerciseId)) {
      setSelectedExerciseId(uniqueIds[0]);
    }
  };

  // Build Pie Chart Data
  const pieData = muscleStats.map((item, index) => ({
    value: item.value,
    text: `${item.value}`,
    color: PIE_COLORS[index % PIE_COLORS.length],
    label: item.muscle,
  }));

  // Build Line Chart Data for the selected exercise
  const selectedExerciseWeights = weightHistory.filter(w => w.exerciseId === selectedExerciseId);
  const lineData = selectedExerciseWeights.slice(-10).map((entry) => {
    const date = new Date(entry.timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return {
      value: entry.weight,
      label: `${day}/${month}`,
    };
  });

  const uniqueExercises = Array.from(new Set(weightHistory.map(w => w.exerciseId)));

  // Filter ALL exercises based on search query
  const filteredExercises = EXERCISES.filter(ex => {
    if (!searchQuery) return false; // Only show suggestions when searching
    return ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || ex.nameTr.toLowerCase().includes(searchQuery.toLowerCase());
  }).map(ex => ex.id);

  const selectedExerciseName = EXERCISES.find(e => e.id === selectedExerciseId)?.name || 'Egzersiz';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Geçmiş</Text>
        <Text style={styles.subtitle}>İstatistiklerin ve Gelişimin</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Line Chart: Weight Progression */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Gelişim Grafiği (kg)</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Egzersiz Ara (Örn: Hammer)..."
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

          {/* Autocomplete Suggestions */}
          {searchQuery.length > 0 && filteredExercises.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {filteredExercises.map((exId) => {
                const ex = EXERCISES.find(e => e.id === exId);
                return (
                  <TouchableOpacity
                    key={exId}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSelectedExerciseId(exId);
                      setSearchQuery(''); // Clear search to hide suggestions
                    }}
                  >
                    <Text style={styles.suggestionText}>{ex?.icon} {ex?.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {searchQuery.length > 0 && filteredExercises.length === 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.noSuggestionText}>Sonuç bulunamadı.</Text>
            </View>
          )}

          <Text style={styles.selectedExerciseLabel}>
            Şu an gösterilen: {selectedExerciseName}
          </Text>

          {lineData.length > 1 ? (
            <View style={{ marginLeft: -10 }}>
              <LineChart
                data={lineData}
                height={180}
                width={SCREEN_WIDTH - 80}
                spacing={50}
                initialSpacing={20}
                color={Colors.neonCyan}
                thickness={3}
                dataPointsColor={Colors.neonCyan}
                dataPointsRadius={5}
                yAxisTextStyle={{ color: Colors.textTertiary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: Colors.textTertiary, fontSize: 10 }}
                yAxisColor="rgba(255,255,255,0.1)"
                xAxisColor="rgba(255,255,255,0.1)"
                hideRules
                isAnimated
                animationDuration={1000}
                areaChart
                startFillColor={Colors.neonCyan}
                startOpacity={0.2}
                endFillColor={Colors.neonCyan}
                endOpacity={0.0}
              />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>Bu egzersiz için henüz yeterli ağırlık verisi yok.</Text>
            </View>
          )}
        </View>

        {/* Pie Chart: Muscle Group Heatmap */}
        {pieData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Çalıştırılan Kas Grupları (Set)</Text>
            <View style={styles.pieContainer}>
              <PieChart
                data={pieData}
                radius={80}
                innerRadius={50}
                innerCircleColor={Colors.bgCard}
                textColor="white"
                textSize={12}
                showText
                donut
                isAnimated
                animationDuration={1000}
              />
              {/* Legend */}
              <View style={styles.legendContainer}>
                {pieData.slice(0, 6).map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Overall Stats */}
        {stats && (
          <View style={styles.overallStatsCard}>
            <Text style={styles.overallTitle}>Genel Özet</Text>
            <View style={styles.overallGrid}>
              <View style={styles.overallItem}>
                <Text style={[styles.overallValue, { color: Colors.neonCyan }]}>
                  {stats.totalWorkouts}
                </Text>
                <Text style={styles.overallLabel}>Toplam Antrenman</Text>
              </View>
              <View style={styles.overallItem}>
                <Text style={[styles.overallValue, { color: Colors.neonGreen }]}>
                  {stats.averageScore || '-'}
                </Text>
                <Text style={styles.overallLabel}>Ort. Form Skoru</Text>
              </View>
              <View style={styles.overallItem}>
                <Text style={[styles.overallValue, { color: Colors.neonOrange }]}>
                  {stats.bestStreak}
                </Text>
                <Text style={styles.overallLabel}>En İyi Seri</Text>
              </View>
              <View style={styles.overallItem}>
                <Text style={[styles.overallValue, { color: Colors.neonMagenta }]}>
                  {stats.totalReps}
                </Text>
                <Text style={styles.overallLabel}>Toplam Tekrar</Text>
              </View>
            </View>
          </View>
        )}

        {/* Workout List */}
        {history.length > 0 ? (
          <>
            <Text style={styles.listTitle}>Son Antrenmanlar</Text>
            {history.slice(0, 10).map((workout, index) => (
              <View key={workout.id} style={styles.historyCard}>
                <View style={styles.historyIcon}>
                  <Text style={styles.historyEmoji}>
                    {EXERCISES.find((e) => e.id === workout.exerciseId)?.icon || '💪'}
                  </Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName}>{workout.exerciseName}</Text>
                  <Text style={styles.historyDate}>{workout.date}</Text>
                  <Text style={styles.historyMeta}>
                    {workout.reps} tekrar · {workout.sets} set
                  </Text>
                </View>
                <View style={styles.historyScore}>
                  <Text
                    style={[
                      styles.historyScoreValue,
                      { color: getScoreColor(workout.score) },
                    ]}
                  >
                    {workout.score}
                  </Text>
                  <Text style={styles.historyScoreLabel}>puan</Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Henüz veri yok</Text>
            <Text style={styles.emptySubtext}>
              Antrenmanlarını tamamladıkça burada detaylı istatistiklerin görünecek.
            </Text>
          </View>
        )}

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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  chartCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
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
  suggestionsContainer: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgGlassBorder,
  },
  suggestionText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  noSuggestionText: {
    color: Colors.textMuted,
    padding: Spacing.md,
    textAlign: 'center',
  },
  selectedExerciseLabel: {
    color: Colors.neonCyan,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyChart: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
  },
  emptyChartText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  overallStatsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  overallTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  overallGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  overallItem: {
    width: '47%',
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  overallValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
  },
  overallLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontWeight: FontWeight.medium,
  },
  listTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  historyEmoji: {
    fontSize: 24,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  historyDate: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  historyMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyScore: {
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  historyScoreValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
  },
  historyScoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.massive,
  },
  emptyIcon: {
    fontSize: 56,
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
    maxWidth: 260,
  },
});
