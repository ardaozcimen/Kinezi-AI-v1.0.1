// Kinezi-AI Exercise Detail Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { EXERCISES } from '@/constants/exercises';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const exercise = EXERCISES.find((e) => e.id === id);

  const [sets, setSets] = useState(exercise?.defaultSets || 3);
  const [reps, setReps] = useState(exercise?.defaultReps || 12);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Egzersiz bulunamadı</Text>
      </SafeAreaView>
    );
  }

  const handleStart = () => {
    router.push({
      pathname: '/camera',
      params: {
        exerciseId: exercise.id,
        sets: sets.toString(),
        reps: reps.toString(),
      },
    } as any);
  };

  const NumberStepper = ({
    value,
    onChange,
    min = 1,
    max = 30,
    label,
  }: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    label: string;
  }) => (
    <View style={styles.stepperContainer}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - 1))}
          style={styles.stepperButton}
          activeOpacity={0.6}
        >
          <Text style={styles.stepperButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + 1))}
          style={styles.stepperButton}
          activeOpacity={0.6}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>← Geri</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>{exercise.icon}</Text>
          <Text style={styles.heroName}>{exercise.name}</Text>
          <Text style={styles.heroDescription}>{exercise.descriptionTr}</Text>

          <View style={styles.heroBadges}>
            <View
              style={[
                styles.heroBadge,
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
                  styles.heroBadgeText,
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
                  ? '🟢 Başlangıç'
                  : exercise.difficulty === 'intermediate'
                  ? '🟡 Orta'
                  : '🔴 İleri'}
              </Text>
            </View>
            <View style={[styles.heroBadge, { backgroundColor: Colors.neonCyanDim }]}>
              <Text style={[styles.heroBadgeText, { color: Colors.neonCyan }]}>
                📸 {exercise.cameraPosition === 'side' ? 'Yan Görünüm' : 'Ön Görünüm'}
              </Text>
            </View>
          </View>
        </View>

        {/* Demo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nasıl Yapılır?</Text>
          <View style={styles.demoContainer}>
            <Image
              source={{ uri: exercise.demoUrl || 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTB1MzYzaTlmNXZtNWcwc3oxZWl5OXBwbGF5NXlmeTBwaWhwcXo2aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKrEzvPNBgWEIGM/giphy.gif' }}
              style={styles.demoImage}
              resizeMode="cover"
            />
            {!exercise.demoUrl && (
              <View style={styles.demoPlaceholderBadge}>
                <Text style={styles.demoPlaceholderText}>Temsili Görüntü</Text>
              </View>
            )}
          </View>
        </View>

        {/* Muscles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hedef Kaslar</Text>
          <View style={styles.muscleGrid}>
            {exercise.muscleGroups.map((muscle) => (
              <View key={muscle} style={styles.muscleChip}>
                <Text style={styles.muscleChipText}>
                  {muscle === 'quads' ? 'Quadriceps' :
                   muscle === 'hamstrings' ? 'Hamstring' :
                   muscle === 'glutes' ? 'Kalça' :
                   muscle === 'chest' ? 'Göğüs' :
                   muscle === 'back' ? 'Sırt' :
                   muscle === 'shoulders' ? 'Omuz' :
                   muscle === 'core' ? 'Core' :
                   muscle === 'arms' ? 'Kollar' :
                   muscle === 'calves' ? 'Baldır' : muscle}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İpuçları</Text>
          {exercise.tipsTr.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View style={styles.tipBullet}>
                <Text style={styles.tipBulletText}>{index + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Set/Rep Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>
          <View style={styles.configCard}>
            <NumberStepper
              value={sets}
              onChange={setSets}
              min={1}
              max={10}
              label="Set Sayısı"
            />
            {exercise.id !== 'plank' && (
              <NumberStepper
                value={reps}
                onChange={setReps}
                min={1}
                max={30}
                label="Tekrar Sayısı"
              />
            )}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity onPress={handleStart} activeOpacity={0.8}>
          <LinearGradient
            colors={Colors.gradientCyan}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startButton}
          >
            <Text style={styles.startButtonIcon}>📸</Text>
            <Text style={styles.startButtonText}>Antrenmana Başla</Text>
            <Text style={styles.startButtonSubtext}>
              Kamerayı aç ve formunu analiz et
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backText: {
    fontSize: FontSize.lg,
    color: Colors.neonCyan,
    fontWeight: FontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  heroIcon: {
    fontSize: 72,
    marginBottom: Spacing.lg,
  },
  heroName: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
  },
  heroDescription: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
    maxWidth: 300,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  heroBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  heroBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  muscleChip: {
    backgroundColor: Colors.neonMagentaGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.neonMagentaDim,
  },
  muscleChipText: {
    fontSize: FontSize.sm,
    color: Colors.neonMagenta,
    fontWeight: FontWeight.semibold,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  tipBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neonCyanGlow,
    borderWidth: 1,
    borderColor: Colors.neonCyanDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBulletText: {
    fontSize: FontSize.sm,
    color: Colors.neonCyan,
    fontWeight: FontWeight.bold,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  configCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    gap: Spacing.xl,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  stepperButtonText: {
    fontSize: FontSize.xxl,
    color: Colors.neonCyan,
    fontWeight: FontWeight.bold,
  },
  stepperValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },
  demoContainer: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    position: 'relative',
  },
  demoImage: {
    width: '100%',
    height: '100%',
  },
  demoPlaceholderBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  demoPlaceholderText: {
    color: '#FFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  startButton: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.neonCyan,
  },
  startButtonIcon: {
    fontSize: 32,
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
    color: 'rgba(10, 10, 15, 0.6)',
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: FontSize.lg,
    color: Colors.neonRed,
    textAlign: 'center',
    marginTop: Spacing.huge,
  },
});
