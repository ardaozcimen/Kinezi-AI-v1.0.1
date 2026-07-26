// Kinezi-AI Workout Result Screen
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { EXERCISES } from '@/constants/exercises';
import { getScoreColor, getScoreLabel } from '@/lib/pose/rules';
import { speakSummary } from '@/lib/speech';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    id: string;
    score: string;
    exerciseId: string;
    reps: string;
    sets: string;
    duration: string;
  }>();
  const router = useRouter();

  const score = parseInt(params.score || '85', 10);
  const exercise = EXERCISES.find((e) => e.id === params.exerciseId) || EXERCISES[0];
  const reps = parseInt(params.reps || '0', 10);
  const sets = parseInt(params.sets || '0', 10);
  const duration = parseInt(params.duration || '0', 10);

  // Animations
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Speak summary
    setTimeout(() => {
      speakSummary(score, reps);
    }, 1000);

    // Animate score
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(scoreAnim, {
          toValue: score,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🤖 Kinezi-AI ile ${exercise.name} antrenmanımı tamamladım!\n\n` +
          `📊 Form Skoru: ${score}/100\n` +
          `💪 ${reps} tekrar · ${sets} set\n` +
          `⏱️ Süre: ${formatTime(duration)}\n\n` +
          `#KineziAI #FormAnalizi #Fitness`,
        title: 'Kinezi-AI Antrenman Sonucu',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} dk ${s} sn`;
  };

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  const getImprovementTips = (): string[] => {
    if (score >= 90) {
      return [
        'Mükemmel performans! Formunu korudun.',
        'Ağırlığı artırmayı deneyebilirsin.',
        'Sonraki hedef: %100 tutarlılık!',
      ];
    }
    if (score >= 75) {
      return [
        'İyi iş! Küçük düzeltmeler yap.',
        `${exercise.tipsTr[0]}`,
        'Ayna karşısında pratik yap.',
      ];
    }
    if (score >= 60) {
      return [
        'Formunda iyileştirme gerekiyor.',
        `${exercise.tipsTr[0]}`,
        `${exercise.tipsTr[1]}`,
        'Daha hafif ağırlıkla çalış.',
      ];
    }
    return [
      'Formuna özellikle dikkat etmelisin!',
      ...exercise.tipsTr.slice(0, 3),
      'Profesyonel destek almayı düşün.',
    ];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.headerIcon}>{exercise.icon}</Text>
          <Text style={styles.headerTitle}>{exercise.name}</Text>
          <Text style={styles.headerSubtitle}>Antrenman Tamamlandı!</Text>
        </Animated.View>

        {/* Score Circle */}
        <Animated.View
          style={[
            styles.scoreContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.scoreCircle,
              {
                borderColor: scoreColor,
                shadowColor: scoreColor,
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.scoreValue,
                { color: scoreColor },
              ]}
            >
              {score}
            </Animated.Text>
            <Text style={styles.scoreMax}>/100</Text>
            <Text style={[styles.scoreLabel, { color: scoreColor }]}>
              {scoreLabel.tr}
            </Text>
          </View>
        </Animated.View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statsCard}>
            <Text style={styles.statsIcon}>💪</Text>
            <Text style={styles.statsValue}>{reps}</Text>
            <Text style={styles.statsLabel}>Toplam Tekrar</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsIcon}>🔄</Text>
            <Text style={styles.statsValue}>{sets}</Text>
            <Text style={styles.statsLabel}>Set</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsIcon}>⏱️</Text>
            <Text style={styles.statsValue}>{formatTime(duration)}</Text>
            <Text style={styles.statsLabel}>Süre</Text>
          </View>
        </View>

        {/* Improvement Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>
            {score >= 75 ? '🌟 Harika İş!' : '📝 İyileştirme Önerileri'}
          </Text>
          {getImprovementTips().map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View
                style={[
                  styles.tipBullet,
                  { backgroundColor: scoreColor + '30', borderColor: scoreColor + '60' },
                ]}
              >
                <Text style={[styles.tipBulletText, { color: scoreColor }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* AR Video Preview Placeholder */}
        <View style={styles.videoPreview}>
          <LinearGradient
            colors={[Colors.bgTertiary, Colors.bgSecondary]}
            style={styles.videoGradient}
          >
            <Text style={styles.videoIcon}>🎬</Text>
            <Text style={styles.videoTitle}>AR Video</Text>
            <Text style={styles.videoSubtitle}>
              Neon iskelet overlay'li video{'\n'}yakında aktif!
            </Text>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.8}
            style={styles.shareButton}
          >
            <LinearGradient
              colors={Colors.gradientMagenta}
              style={styles.shareGradient}
            >
              <Text style={styles.shareText}>📱 Paylaş</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)' as any)}
          activeOpacity={0.8}
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>🏠 Ana Sayfaya Dön</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.replace({
              pathname: '/exercise/[id]',
              params: { id: exercise.id },
            } as any)
          }
          activeOpacity={0.8}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>🔄 Tekrar Dene</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  scoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: FontWeight.black,
  },
  scoreMax: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    marginTop: -8,
  },
  scoreLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  statsCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  statsIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  statsValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
  },
  statsLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  tipsSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  tipsTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBulletText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  videoPreview: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xxl,
  },
  videoGradient: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  videoIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  videoTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  videoSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  actionsRow: {
    marginBottom: Spacing.md,
  },
  shareButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  shareGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    ...Shadows.neonMagenta,
  },
  shareText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  homeButton: {
    backgroundColor: Colors.bgCard,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  homeButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  retryButton: {
    backgroundColor: Colors.neonCyanGlow,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neonCyanDim,
  },
  retryButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.neonCyan,
  },
});
