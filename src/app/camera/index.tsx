// Kinezi-AI Camera Screen
// Real-time pose detection with skeleton overlay and voice feedback
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { EXERCISES } from '@/constants/exercises';
import { PoseLandmarks, FormFeedback, ExercisePhase, WorkoutHistory } from '@/lib/pose/types';
import {
  EXERCISE_ANALYZERS,
  EXERCISE_PHASE_DETECTORS,
  calculateFormScore,
  getScoreColor,
} from '@/lib/pose/rules';
import { getKneeAngle } from '@/lib/pose/angles';
import { processFeedbacks, getVoiceFeedback, resetFeedbackState, getSkeletonColor } from '@/lib/pose/feedback';
import { speakFeedback, speakRepCount, speakSetComplete, stopSpeaking } from '@/lib/speech';
import { saveWorkout, getLastWeight, saveWeightEntry, getProgressSuggestion, WeightEntry } from '@/lib/storage';
import { PoseLandmarkIndex } from '@/constants/landmarks';

// Nitro Pose Detection
let nitroPoseExercises: any = null;
let SQUAT_CONFIG: any = null;

if (Platform.OS !== 'web') {
  try {
    const NitroPose = require('react-native-nitro-pose-exercises');
    nitroPoseExercises = NitroPose.nitroPoseExercises;
    SQUAT_CONFIG = NitroPose.SQUAT_CONFIG;
  } catch (e) {
    console.log('Nitro Pose not available', e);
  }
}

let Camera: any = null;
let useCameraDevice: any = null;
let useCameraPermission: any = null;
let useFrameOutput: any = null;
if (Platform.OS !== 'web') {
  try {
    const VisionCamera = require('react-native-vision-camera');
    Camera = VisionCamera.Camera;
    useCameraDevice = VisionCamera.useCameraDevice;
    useCameraPermission = VisionCamera.useCameraPermission;
    useFrameOutput = VisionCamera.useFrameOutput;
  } catch (e) {
    console.log('Vision Camera not available');
  }
}

// React Native Worklets
let scheduleOnRN: any = null;
if (Platform.OS !== 'web') {
  try {
    const Worklets = require('react-native-worklets');
    scheduleOnRN = Worklets.scheduleOnRN;
  } catch (e) {
    console.log('Worklets not available', e);
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CameraScreen() {
  const params = useLocalSearchParams<{
    exerciseId: string;
    sets: string;
    reps: string;
  }>();
  const router = useRouter();

  const exerciseId = params.exerciseId || 'squat';
  const totalSets = parseInt(params.sets || '3', 10);
  const totalReps = parseInt(params.reps || '12', 10);
  const exercise = EXERCISES.find((e) => e.id === exerciseId) || EXERCISES[0];

  // Hardware Camera
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice ? useCameraDevice(cameraPosition) : null;
  const { hasPermission, requestPermission } = useCameraPermission ? useCameraPermission() : { hasPermission: true, requestPermission: async () => true };

  // State
  const [isActive, setIsActive] = useState(false);
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [activeFeedbacks, setActiveFeedbacks] = useState<FormFeedback[]>([]);
  const [skeletonColor, setSkeletonColor] = useState(Colors.neonCyan);
  const [currentLandmarks, setCurrentLandmarks] = useState<PoseLandmarks | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [phase, setPhase] = useState<ExercisePhase>(ExercisePhase.IDLE);
  const [debugText, setDebugText] = useState<string>('Wait...');
  const [isFinished, setIsFinished] = useState(false);
  const [allScores, setAllScores] = useState<number[]>([]);
  
  // Weight tracking
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [lastWeightEntry, setLastWeightEntry] = useState<WeightEntry | null>(null);
  const [progressSuggestion, setProgressSuggestion] = useState<any>(null);
  const [pendingWorkoutData, setPendingWorkoutData] = useState<any>(null);
  const fromProgram = params.fromProgram === 'true';

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(ExercisePhase.IDLE);
  const repRef = useRef(0);
  const activeRef = useRef(false);

  // Animations
  const flashAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Sync state to ref
  useEffect(() => {
    activeRef.current = isActive && !isFinished && !isCountdown;
  }, [isActive, isFinished, isCountdown]);

  // Init Nitro Pose
  useEffect(() => {
    if (Platform.OS !== 'web' && nitroPoseExercises) {
      const initEngine = async () => {
        try {
          await nitroPoseExercises.initialize('');
          if (SQUAT_CONFIG) {
            nitroPoseExercises.loadExercise(SQUAT_CONFIG); // Must load config for engine to fully initialize gates
          }
          nitroPoseExercises.startSession(999, 0); // Start processing frames IMMEDIATELY
          console.log('Nitro Pose Exercises initialized');
        } catch (e) {
          console.error('Failed to initialize pose engine', e);
        }
      };
      initEngine();

      return () => {
        try {
          nitroPoseExercises.release();
        } catch (e) {}
      };
    }
  }, []);

  const analyzePose = (landmarks: PoseLandmarks) => {
    // Run exercise analyzer
    const analyzer = EXERCISE_ANALYZERS[exerciseId];
    if (analyzer) {
      const rawFeedbacks = analyzer(landmarks);
      const processed = processFeedbacks(rawFeedbacks);
      setActiveFeedbacks(processed);

      const score = calculateFormScore(rawFeedbacks);
      setFormScore(score);
      setSkeletonColor(getSkeletonColor(processed));

      // Voice feedback
      const voiceFb = getVoiceFeedback(processed);
      if (voiceFb) {
        speakFeedback(voiceFb);
      }

      // Flash on errors
      if (processed.some((fb) => fb.type === 'error')) {
        triggerFlash();
      }
    }

    // Detect phase and count reps dynamically based on exercise
    const phaseDetector = EXERCISE_PHASE_DETECTORS[exerciseId];
    let newPhase = phaseRef.current;
    
    if (phaseDetector) {
      newPhase = phaseDetector(landmarks, phaseRef.current);
    } else {
      // Fallback for exercises without specific phase detectors
      // (Uses knee angle as a generic lower body fallback)
      const kneeAngle = getKneeAngle(landmarks, 'left');
      if (kneeAngle > 160) newPhase = ExercisePhase.TOP;
      else if (kneeAngle < 100) newPhase = ExercisePhase.BOTTOM;
      else if (phaseRef.current === ExercisePhase.TOP || phaseRef.current === ExercisePhase.ECCENTRIC) {
        newPhase = ExercisePhase.ECCENTRIC;
      } else {
        newPhase = ExercisePhase.CONCENTRIC;
      }
    }

    if (phaseRef.current === ExercisePhase.CONCENTRIC && newPhase === ExercisePhase.TOP) {
      // Rep completed!
      const newRep = repRef.current + 1;
      repRef.current = newRep;
      setCurrentRep(newRep);
      speakRepCount(newRep);
      setAllScores((prev) => [...prev, formScore]);

      if (newRep >= totalReps) {
        handleSetComplete();
      }
    }

    phaseRef.current = newPhase;
    setPhase(newPhase);
  };

  const rawHandleLandmarks = (lms: any[]) => {
    if (lms && lms.length > 0) {
      // Ensure we map perfectly to our expected PoseLandmarks interface
      const landmarks: PoseLandmarks = [];
      for (let i = 0; i < lms.length; i++) {
        const lm = lms[i];
        if (lm) {
          landmarks.push({
             x: lm.x,
             y: lm.y,
             z: lm.z,
             visibility: lm.visibility ?? 1.0,
          });
        }
      }
      setDebugText(`LMS: ${lms.length} | LM0 Vis: ${lms[0]?.visibility?.toFixed(2)}`);
      
      setCurrentLandmarks(landmarks);
      
      if (activeRef.current) {
        analyzePose(landmarks);
      }
    } else {
      setDebugText('LMS: 0/null');
      setCurrentLandmarks(null);
    }
  };

  const rawHandleDebug = (text: string) => { setDebugText(text); };
  const isIos = Platform.OS === 'ios';

  // Frame Processor via VisionCamera V5
  const frameOutput = useFrameOutput ? useFrameOutput({
    pixelFormat: 'yuv',
    onFrame: (frame: any) => {
      'worklet';
      try {
        if (scheduleOnRN) scheduleOnRN(rawHandleDebug, 'RUNNING...');
        if (isIos) {
          nitroPoseExercises.processFrameIOS(frame);
        } else {
          nitroPoseExercises.processFrameAndroid(frame);
        }

        const lms = nitroPoseExercises.landmarks;
        if (scheduleOnRN) {
          scheduleOnRN(rawHandleLandmarks, lms);
        }
      } catch (e: any) {
        if (scheduleOnRN) scheduleOnRN(rawHandleDebug, 'ERR: ' + (e?.message || 'Unknown'));
      } finally {
        try {
          frame.dispose();
        } catch (e) {}
      }
    }
  }) : null;

  useEffect(() => {
    // Start scan line animation
    Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
    
    if (Platform.OS !== 'web' && requestPermission && !hasPermission) {
      requestPermission();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeaking();
      resetFeedbackState();
    };
  }, []);

  const startCountdown = async () => {
    setIsCountdown(true);
    setCountdownValue(3);

    for (let i = 3; i >= 1; i--) {
      setCountdownValue(i);
      await new Promise((r) => setTimeout(r, 1000));
    }

    setIsCountdown(false);
    startWorkout();
  };

  useEffect(() => {
    requestPermission();
    resetFeedbackState();
    // Load previous weight data
    loadWeightData();
  }, []);

  const loadWeightData = async () => {
    const lastWeight = await getLastWeight(exerciseId);
    setLastWeightEntry(lastWeight);
    const suggestion = await getProgressSuggestion(exerciseId);
    setProgressSuggestion(suggestion);
    
    // Show reminder if there's a previous weight
    if (lastWeight) {
      setTimeout(() => {
        Alert.alert(
          '💪 Ağırlık Hatırlatma',
          `Geçen sefer ${lastWeight.weight} kg kaldırdın.${suggestion?.shouldIncrease ? `\n\n🚀 ${suggestion.messageTr}` : ''}`,
          [{ text: 'Tamam', style: 'default' }]
        );
      }, 500);
    }
  };

  const startWorkout = () => {
    setIsActive(true);
    resetFeedbackState();
    
    if (Platform.OS !== 'web' && nitroPoseExercises) {
      try {
        nitroPoseExercises.startSession(999, 0); // Activate frame processing
      } catch (e) {}
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const handleSetComplete = () => {
    speakSetComplete(currentSet, totalSets);

    if (currentSet >= totalSets) {
      // Workout done
      finishWorkout();
    } else {
      // Next set after rest
      setCurrentSet((prev) => prev + 1);
      repRef.current = 0;
      setCurrentRep(0);
      phaseRef.current = ExercisePhase.IDLE;

      setIsActive(false); // Pause detection
      if (Platform.OS !== 'web' && nitroPoseExercises) {
        try { nitroPoseExercises.stopSession(); } catch (e) {}
      }
      
      // Rest timer then restart
      setTimeout(() => {
        setIsActive(true);
        if (Platform.OS !== 'web' && nitroPoseExercises) {
          try { nitroPoseExercises.startSession(999, 0); } catch (e) {}
        }
      }, exercise.restSeconds * 1000);
    }
  };

  const finishWorkout = async () => {
    setIsActive(false);
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (Platform.OS !== 'web' && nitroPoseExercises) {
      try { nitroPoseExercises.stopSession(); } catch (e) {}
    }

    const avgScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : formScore;

    // Save workout
    const workout: WorkoutHistory = {
      id: Date.now().toString(),
      exerciseId: exerciseId,
      exerciseName: exercise.name,
      date: new Date().toLocaleDateString('tr-TR'),
      score: avgScore,
      reps: totalReps * totalSets,
      sets: totalSets,
      duration: elapsedTime,
    };

    await saveWorkout(workout);

    // If coming from program, ask for weight
    if (fromProgram) {
      setPendingWorkoutData({ workout, avgScore });
      setWeightInput(lastWeightEntry ? lastWeightEntry.weight.toString() : '');
      setShowWeightModal(true);
    } else {
      // Navigate to result screen directly
      navigateToResult(workout, avgScore);
    }
  };

  const handleWeightSubmit = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir ağırlık girin.');
      return;
    }

    const { workout, avgScore } = pendingWorkoutData;

    // Save weight entry
    await saveWeightEntry({
      exerciseId,
      weight,
      sets: totalSets,
      reps: totalReps,
      score: avgScore,
      date: new Date().toLocaleDateString('tr-TR'),
      timestamp: Date.now(),
    });

    setShowWeightModal(false);

    // Check if we should suggest increase
    const suggestion = await getProgressSuggestion(exerciseId);
    if (suggestion?.shouldIncrease) {
      Alert.alert(
        '🚀 Ağırlık Arttır!',
        suggestion.messageTr,
        [
          { text: 'Hayır, aynı kalsın', style: 'cancel', onPress: () => navigateToResult(workout, avgScore) },
          { text: 'Tamam!', style: 'default', onPress: () => navigateToResult(workout, avgScore) },
        ]
      );
    } else {
      navigateToResult(workout, avgScore);
    }
  };

  const handleWeightSkip = () => {
    setShowWeightModal(false);
    if (pendingWorkoutData) {
      navigateToResult(pendingWorkoutData.workout, pendingWorkoutData.avgScore);
    }
  };

  const navigateToResult = (workout: WorkoutHistory, avgScore: number) => {
    setTimeout(() => {
      router.replace({
        pathname: '/result/[id]',
        params: {
          id: workout.id,
          score: avgScore.toString(),
          exerciseId,
          reps: (totalReps * totalSets).toString(),
          sets: totalSets.toString(),
          duration: elapsedTime.toString(),
        },
      } as any);
    }, 500);
  };

  const triggerFlash = () => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleStop = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Antrenmanı bitirmek istediğine emin misin?');
      if (confirm) finishWorkout();
    } else {
      Alert.alert(
        'Antrenmanı Bitir',
        'Antrenmanı bitirmek istediğine emin misin?',
        [
          { text: 'Devam Et', style: 'cancel' },
          {
            text: 'Bitir',
            style: 'destructive',
            onPress: finishWorkout,
          },
        ]
      );
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Render skeleton overlay
  const renderSkeleton = () => {
    if (!currentLandmarks) return null;

    // Key connections for the main skeleton
    const mainConnections = [
      // Torso
      [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER],
      [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_HIP],
      [PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_HIP],
      [PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP],
      // Arms
      [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_ELBOW],
      [PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.LEFT_WRIST],
      [PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_ELBOW],
      [PoseLandmarkIndex.RIGHT_ELBOW, PoseLandmarkIndex.RIGHT_WRIST],
      // Legs
      [PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.LEFT_KNEE],
      [PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.LEFT_ANKLE],
      [PoseLandmarkIndex.RIGHT_HIP, PoseLandmarkIndex.RIGHT_KNEE],
      [PoseLandmarkIndex.RIGHT_KNEE, PoseLandmarkIndex.RIGHT_ANKLE],
    ];

    const keyJoints = [
      PoseLandmarkIndex.NOSE,
      PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER,
      PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.RIGHT_ELBOW,
      PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.RIGHT_WRIST,
      PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP,
      PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.RIGHT_KNEE,
      PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.RIGHT_ANKLE,
    ];

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Connection lines */}
        {mainConnections.map(([from, to], index) => {
          const fromLm = currentLandmarks[from];
          const toLm = currentLandmarks[to];
          if (!fromLm || !toLm || fromLm.visibility < 0.3 || toLm.visibility < 0.3) return null;

          const x1 = fromLm.x * SCREEN_WIDTH;
          const y1 = fromLm.y * SCREEN_HEIGHT;
          const x2 = toLm.x * SCREEN_WIDTH;
          const y2 = toLm.y * SCREEN_HEIGHT;

          const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

          return (
            <View
              key={`line-${index}`}
              style={[
                styles.skeletonLine,
                {
                  left: x1,
                  top: y1,
                  width: length,
                  transform: [{ rotate: `${angle}deg` }],
                  backgroundColor: skeletonColor,
                  shadowColor: skeletonColor,
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                },
              ]}
            />
          );
        })}

        {/* Joint dots */}
        {keyJoints.map((jointIdx) => {
          const lm = currentLandmarks[jointIdx];
          if (!lm || lm.visibility < 0.3) return null;

          return (
            <View
              key={`joint-${jointIdx}`}
              style={[
                styles.skeletonJoint,
                {
                  left: lm.x * SCREEN_WIDTH - 6,
                  top: lm.y * SCREEN_HEIGHT - 6,
                  backgroundColor: skeletonColor,
                  shadowColor: skeletonColor,
                  shadowOpacity: 1,
                  shadowRadius: 8,
                },
              ]}
            />
          );
        })}

        {/* Head circle */}
        {currentLandmarks[PoseLandmarkIndex.NOSE] && currentLandmarks[PoseLandmarkIndex.NOSE].visibility > 0.3 && (
          <View
            style={[
              styles.headCircle,
              {
                left: currentLandmarks[PoseLandmarkIndex.NOSE].x * SCREEN_WIDTH - 18,
                top: currentLandmarks[PoseLandmarkIndex.NOSE].y * SCREEN_HEIGHT - 18,
                borderColor: skeletonColor,
                shadowColor: skeletonColor,
              },
            ]}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Camera Background */}
      <View style={styles.cameraPreview}>
        {Platform.OS !== 'web' && Camera && device && hasPermission ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={!isFinished}
            outputs={frameOutput ? [frameOutput] : []}
          />
        ) : (
          <LinearGradient
            colors={['#0D0D14', '#151520', '#0D0D14']}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Scan line animation */}
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [
                {
                  translateY: scanLineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, SCREEN_HEIGHT + 20],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Grid overlay */}
        <View style={styles.gridOverlay}>
          <View style={[styles.gridLine, styles.gridVertical, { left: '33%' }]} />
          <View style={[styles.gridLine, styles.gridVertical, { left: '66%' }]} />
          <View style={[styles.gridLine, styles.gridHorizontal, { top: '33%' }]} />
          <View style={[styles.gridLine, styles.gridHorizontal, { top: '66%' }]} />
        </View>

        {/* Skeleton overlay */}
        {renderSkeleton()}

        {/* Error flash */}
        <Animated.View
          style={[
            styles.flashOverlay,
            { opacity: flashAnim, backgroundColor: Colors.neonRed },
          ]}
        />
      </View>

      {/* Top HUD */}
      <SafeAreaView style={styles.topHud} edges={['top']}>
        <View style={styles.topHudRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.hudButton}
          >
            <Text style={styles.hudButtonText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.exerciseBadge}>
            <Text style={styles.exerciseBadgeText}>
              {exercise.icon} {exercise.name}
            </Text>
          </View>
          
          <View style={styles.topRightControls}>
            <TouchableOpacity
              onPress={() => setCameraPosition(prev => prev === 'front' ? 'back' : 'front')}
              style={[styles.hudButton, { marginRight: Spacing.sm }]}
            >
              <Text style={styles.hudButtonText}>🔄</Text>
            </TouchableOpacity>

            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Countdown Overlay */}
      {isCountdown && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdownValue}</Text>
          <Text style={styles.countdownLabel}>Hazırlan!</Text>
        </View>
      )}

      {/* Finished Overlay */}
      {isFinished && (
        <View style={styles.finishedOverlay}>
          <Text style={styles.finishedIcon}>🎉</Text>
          <Text style={styles.finishedText}>Antrenman Tamamlandı!</Text>
          <Text style={[styles.finishedScore, { color: getScoreColor(formScore) }]}>
            {formScore}
          </Text>
          <Text style={styles.finishedLabel}>Form Skoru</Text>
        </View>
      )}

      {/* Bottom HUD */}
      <View style={styles.bottomHud}>
        {/* Feedback Banner */}
        {activeFeedbacks.length > 0 && isActive && (
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor:
                  activeFeedbacks[0].type === 'error'
                    ? 'rgba(255, 49, 49, 0.9)'
                    : activeFeedbacks[0].type === 'warning'
                    ? 'rgba(255, 229, 0, 0.9)'
                    : 'rgba(57, 255, 20, 0.9)',
              },
            ]}
          >
            <Text style={styles.feedbackText}>
              {activeFeedbacks[0].type === 'error' ? '⚠️ ' :
               activeFeedbacks[0].type === 'warning' ? '💡 ' : '✅ '}
              {activeFeedbacks[0].messageTr}
            </Text>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{currentSet}/{totalSets}</Text>
            <Text style={styles.statLabel}>Set</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{currentRep}/{totalReps}</Text>
            <Text style={styles.statLabel}>Rep</Text>
          </View>
          <View style={[styles.statBox, styles.scoreBox]}>
            <Text style={[styles.statValue, styles.scoreValue, { color: getScoreColor(formScore) }]}>
              {formScore}
            </Text>
            <Text style={styles.statLabel}>Skor</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          {!isActive && !isCountdown && !isFinished ? (
            <TouchableOpacity
              onPress={startCountdown}
              activeOpacity={0.8}
              style={styles.startCameraButton}
            >
              <LinearGradient
                colors={Colors.gradientCyan}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startCameraGradient}
              >
                <Text style={styles.startCameraText}>▶ BAŞLA</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : isActive ? (
            <TouchableOpacity
              onPress={handleStop}
              activeOpacity={0.8}
              style={styles.stopButton}
            >
              <Text style={styles.stopButtonText}>⏹ BİTİR</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Weight Input Modal */}
      <Modal
        visible={showWeightModal}
        transparent
        animationType="fade"
        onRequestClose={handleWeightSkip}
      >
        <View style={styles.weightModalOverlay}>
          <View style={styles.weightModalCard}>
            <Text style={styles.weightModalTitle}>🏋️ Kaç kg kaldırdın?</Text>
            {lastWeightEntry && (
              <Text style={styles.weightModalHint}>
                Geçen sefer: {lastWeightEntry.weight} kg
              </Text>
            )}
            <View style={styles.weightInputRow}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              <Text style={styles.weightInputUnit}>kg</Text>
            </View>
            <View style={styles.weightModalActions}>
              <TouchableOpacity
                onPress={handleWeightSkip}
                style={styles.weightSkipButton}
                activeOpacity={0.7}
              >
                <Text style={styles.weightSkipText}>Atla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleWeightSubmit}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={Colors.gradientCyan}
                  style={styles.weightSaveButton}
                >
                  <Text style={styles.weightSaveText}>Kaydet</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  cameraPreview: {
    ...StyleSheet.absoluteFill,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.neonCyan,
    shadowColor: Colors.neonCyan,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    opacity: 0.4,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 245, 255, 0.06)',
  },
  gridVertical: {
    width: 1,
    top: 0,
    bottom: 0,
  },
  gridHorizontal: {
    height: 1,
    left: 0,
    right: 0,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFill,
  },
  // Skeleton
  skeletonLine: {
    position: 'absolute',
    height: 3,
    transformOrigin: 'left center',
    borderRadius: 1.5,
  },
  skeletonJoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  headCircle: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: 'transparent',
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  // Top HUD
  topHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topHudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  hudButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  hudButtonText: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  exerciseBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  exerciseBadgeText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  timerText: {
    fontSize: FontSize.md,
    color: Colors.neonCyan,
    fontWeight: FontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  // Countdown
  countdownOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 20,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: FontWeight.black,
    color: Colors.neonCyan,
    textShadowColor: Colors.neonCyan,
    textShadowRadius: 30,
  },
  countdownLabel: {
    fontSize: FontSize.xxl,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    fontWeight: FontWeight.semibold,
  },
  // Finished
  finishedOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 20,
  },
  finishedIcon: {
    fontSize: 72,
    marginBottom: Spacing.lg,
  },
  finishedText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  finishedScore: {
    fontSize: 84,
    fontWeight: FontWeight.black,
  },
  finishedLabel: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  // Bottom HUD
  bottomHud: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    zIndex: 10,
  },
  feedbackBanner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  feedbackText: {
    color: '#000',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  scoreBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  scoreValue: {
    fontSize: FontSize.xxl,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },
  controlsRow: {
    alignItems: 'center',
    minHeight: 60,
  },
  startCameraButton: {
    width: '100%',
    shadowColor: Colors.neonCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  startCameraGradient: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  startCameraText: {
    color: '#000',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
  },
  stopButton: {
    backgroundColor: 'rgba(255, 49, 49, 0.2)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neonRed,
  },
  stopButtonText: {
    color: Colors.neonRed,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  // Weight Modal
  weightModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  weightModalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    alignItems: 'center',
  },
  weightModalTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  weightModalHint: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  weightInput: {
    fontSize: 48,
    fontWeight: FontWeight.black,
    color: Colors.neonCyan,
    textAlign: 'center',
    minWidth: 120,
    borderBottomWidth: 2,
    borderBottomColor: Colors.neonCyan,
    paddingVertical: Spacing.sm,
  },
  weightInputUnit: {
    fontSize: FontSize.xxl,
    color: Colors.textTertiary,
    fontWeight: FontWeight.bold,
  },
  weightModalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  weightSkipButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    alignItems: 'center',
  },
  weightSkipText: {
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  weightSaveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
  },
  weightSaveText: {
    color: Colors.bgPrimary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
});
