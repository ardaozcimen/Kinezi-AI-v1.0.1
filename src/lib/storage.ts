// Kinezi-AI Storage Module
// Firestore wrapper for workout history and user stats

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { WorkoutHistory, UserStats } from './pose/types';
import { EXERCISES } from '@/constants/exercises';

let globalUserId: string | null = null;
let memoryCache: Record<string, any> = {};

export const setGlobalUserId = (id: string | null) => {
  globalUserId = id;
  memoryCache = {};
};

const BASE_KEYS = {
  WORKOUT_HISTORY: 'workout_history',
  USER_STATS: 'user_stats',
  USER_SETTINGS: 'user_settings',
  LAST_WORKOUT_DATE: 'last_workout_date',
  TRAINING_PROGRAM: 'training_program',
  SAVED_PROGRAMS: 'saved_programs',
  WEIGHT_HISTORY: 'weight_history',
};

const getDocRef = (baseKey: string) => {
  if (!globalUserId) throw new Error('No user logged in');
  return doc(db, 'users', globalUserId, 'data', baseKey);
};

async function getFirestoreData(baseKey: string) {
  if (!globalUserId) return null;
  
  if (memoryCache[baseKey] !== undefined) {
    return memoryCache[baseKey];
  }

  try {
    const docSnap = await getDoc(getDocRef(baseKey));
    if (docSnap.exists()) {
      memoryCache[baseKey] = docSnap.data().value;
      return memoryCache[baseKey];
    }
    return null;
  } catch (e) {
    console.error('Firestore get error:', e);
    return null;
  }
}

async function setFirestoreData(baseKey: string, value: any) {
  if (!globalUserId) return;
  
  // Optimistic UI: Update local cache instantly
  memoryCache[baseKey] = value;

  // Background Sync: Fire and forget to Firestore
  setDoc(getDocRef(baseKey), { value }).catch(e => 
    console.error('Firestore background set error:', e)
  );
}

// ============================================================
// WORKOUT HISTORY
// ============================================================

export async function saveWorkout(workout: WorkoutHistory): Promise<void> {
  try {
    const history = await getWorkoutHistory();
    history.unshift(workout); // Add to beginning
    // Keep last 100 workouts
    const trimmed = history.slice(0, 100);
    await setFirestoreData(BASE_KEYS.WORKOUT_HISTORY, trimmed);

    // Update stats
    await updateStats(workout);
  } catch (error) {
    console.error('Error saving workout:', error);
  }
}

export async function getWorkoutHistory(): Promise<WorkoutHistory[]> {
  try {
    const data = await getFirestoreData(BASE_KEYS.WORKOUT_HISTORY);
    return data || [];
  } catch (error) {
    console.error('Error loading workout history:', error);
    return [];
  }
}

export async function getRecentWorkouts(count: number = 10): Promise<WorkoutHistory[]> {
  const history = await getWorkoutHistory();
  return history.slice(0, count);
}

export async function getMuscleGroupStats(): Promise<{ muscle: string; value: number }[]> {
  try {
    const history = await getWorkoutHistory();
    const statsMap: Record<string, number> = {};

    history.forEach(workout => {
      const exercise = EXERCISES.find(e => e.id === workout.exerciseId);
      if (exercise && exercise.muscleGroups) {
        exercise.muscleGroups.forEach(muscle => {
          if (!statsMap[muscle]) statsMap[muscle] = 0;
          // Volume-based or set-based. Let's use sets to keep numbers reasonable
          statsMap[muscle] += workout.sets || 1;
        });
      }
    });

    // Translate muscle keys to readable names
    const MUSCLE_NAMES: Record<string, string> = {
      chest: 'Göğüs',
      back: 'Sırt',
      shoulders: 'Omuz',
      arms: 'Kol',
      core: 'Karın',
      quads: 'Ön Bacak',
      hamstrings: 'Arka Bacak',
      glutes: 'Kalça',
      calves: 'Kalf',
    };

    return Object.entries(statsMap)
      .map(([key, val]) => ({
        muscle: MUSCLE_NAMES[key] || key,
        value: val,
      }))
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error calculating muscle stats:', error);
    return [];
  }
}

// ============================================================
// USER STATS
// ============================================================

const DEFAULT_STATS: UserStats = {
  totalWorkouts: 0,
  currentStreak: 0,
  bestStreak: 0,
  averageScore: 0,
  totalReps: 0,
  exerciseHistory: {},
};

export async function getUserStats(): Promise<UserStats> {
  try {
    const data = await getFirestoreData(BASE_KEYS.USER_STATS);
    return data || { ...DEFAULT_STATS };
  } catch (error) {
    console.error('Error loading user stats:', error);
    return { ...DEFAULT_STATS };
  }
}

async function updateStats(workout: WorkoutHistory): Promise<void> {
  try {
    const stats = await getUserStats();

    // Update totals
    stats.totalWorkouts += 1;
    stats.totalReps += workout.reps;
    stats.averageScore = Math.round(
      (stats.averageScore * (stats.totalWorkouts - 1) + workout.score) / stats.totalWorkouts
    );

    // Update streak
    const today = new Date().toDateString();
    const lastDate = await getFirestoreData(BASE_KEYS.LAST_WORKOUT_DATE);

    if (lastDate) {
      const lastDateObj = new Date(lastDate);
      const todayObj = new Date(today);
      const diffDays = Math.floor(
        (todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        stats.currentStreak += 1;
      } else if (diffDays > 1) {
        stats.currentStreak = 1;
      }
      // If same day, don't change streak
    } else {
      stats.currentStreak = 1;
    }

    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }

    // Update exercise history
    if (!stats.exerciseHistory[workout.exerciseId]) {
      stats.exerciseHistory[workout.exerciseId] = [];
    }
    stats.exerciseHistory[workout.exerciseId].push(workout.score);
    // Keep last 50 scores per exercise
    if (stats.exerciseHistory[workout.exerciseId].length > 50) {
      stats.exerciseHistory[workout.exerciseId] =
        stats.exerciseHistory[workout.exerciseId].slice(-50);
    }

    await setFirestoreData(BASE_KEYS.USER_STATS, stats);
    await setFirestoreData(BASE_KEYS.LAST_WORKOUT_DATE, today);
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// ============================================================
// SETTINGS
// ============================================================

export interface UserSettings {
  voiceEnabled: boolean;
  hapticEnabled: boolean;
  cameraPosition: 'front' | 'back';
  sensitivity: 'low' | 'medium' | 'high';
  language: 'tr' | 'en';
}

const DEFAULT_SETTINGS: UserSettings = {
  voiceEnabled: true,
  hapticEnabled: true,
  cameraPosition: 'front',
  sensitivity: 'medium',
  language: 'tr',
};

export async function getUserSettings(): Promise<UserSettings> {
  try {
    const data = await getFirestoreData(BASE_KEYS.USER_SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...data } : { ...DEFAULT_SETTINGS };
  } catch (error) {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
  try {
    const current = await getUserSettings();
    const updated = { ...current, ...settings };
    await setFirestoreData(BASE_KEYS.USER_SETTINGS, updated);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Clear all data (for debugging/testing).
 */
export async function clearAllData(): Promise<void> {
  try {
    if (!globalUserId) return;
    memoryCache = {}; // Clear cache instantly
    const keys = Object.values(BASE_KEYS);
    for (const key of keys) {
      await deleteDoc(getDocRef(key));
    }
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

// ============================================================
// SAVED PROGRAMS
// ============================================================

export interface ProgramExercise {
  exerciseId: string;
  order: number;
  targetSets: number;
  targetReps: number;
  addedAt: number;
  day?: string;
}

export interface UserProgram {
  id: string;
  name: string;
  exercises: ProgramExercise[];
  updatedAt: number;
}

// Temporary compatibility type
export interface TrainingProgram {
  exercises: ProgramExercise[];
  updatedAt: number;
}

export async function getSavedPrograms(): Promise<UserProgram[]> {
  try {
    const data = await getFirestoreData(BASE_KEYS.SAVED_PROGRAMS);
    if (data) return data;
    
    // Legacy support: if saved_programs doesn't exist, check training_program
    const legacy = await getFirestoreData(BASE_KEYS.TRAINING_PROGRAM);
    if (legacy && legacy.exercises && legacy.exercises.length > 0) {
      const legacyProgram: UserProgram = {
        id: 'legacy_program',
        name: 'Benim Programım',
        exercises: legacy.exercises,
        updatedAt: legacy.updatedAt || Date.now(),
      };
      await saveSavedPrograms([legacyProgram]);
      return [legacyProgram];
    }
    
    return [];
  } catch (error) {
    console.error('Error loading saved programs:', error);
    return [];
  }
}

export async function saveSavedPrograms(programs: UserProgram[]): Promise<void> {
  try {
    await setFirestoreData(BASE_KEYS.SAVED_PROGRAMS, programs);
  } catch (error) {
    console.error('Error saving programs:', error);
  }
}

export async function createNewProgram(name: string): Promise<UserProgram> {
  const programs = await getSavedPrograms();
  const newProgram: UserProgram = {
    id: `prog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    exercises: [],
    updatedAt: Date.now(),
  };
  programs.push(newProgram);
  await saveSavedPrograms(programs);
  return newProgram;
}

export async function deleteProgram(programId: string): Promise<void> {
  let programs = await getSavedPrograms();
  programs = programs.filter(p => p.id !== programId);
  await saveSavedPrograms(programs);
}

// Compatibility wrapper for files that still use getTrainingProgram
export async function getTrainingProgram(): Promise<TrainingProgram> {
  const programs = await getSavedPrograms();
  if (programs.length > 0) {
    return { exercises: programs[0].exercises, updatedAt: programs[0].updatedAt };
  }
  return { exercises: [], updatedAt: Date.now() };
}

export async function saveTrainingProgram(program: TrainingProgram): Promise<void> {
  // Deprecated in favor of saveSavedPrograms, but keep for compatibility if used elsewhere
}

export async function addExerciseToProgram(programId: string, exerciseId: string, sets: number, reps: number, day?: string): Promise<void> {
  const programs = await getSavedPrograms();
  const program = programs.find(p => p.id === programId);
  if (!program) return;
  
  if (program.exercises.some((e) => e.exerciseId === exerciseId)) return;
  program.exercises.push({
    exerciseId,
    order: program.exercises.length,
    targetSets: sets,
    targetReps: reps,
    addedAt: Date.now(),
    day,
  });
  program.updatedAt = Date.now();
  await saveSavedPrograms(programs);
}

export async function removeExerciseFromProgram(programId: string, exerciseId: string): Promise<void> {
  const programs = await getSavedPrograms();
  const program = programs.find(p => p.id === programId);
  if (!program) return;
  
  program.exercises = program.exercises.filter((e) => e.exerciseId !== exerciseId);
  program.exercises.forEach((e, i) => (e.order = i));
  program.updatedAt = Date.now();
  await saveSavedPrograms(programs);
}

export async function reorderProgramExercises(programId: string, exercises: ProgramExercise[]): Promise<void> {
  const programs = await getSavedPrograms();
  const program = programs.find(p => p.id === programId);
  if (!program) return;
  
  program.exercises = exercises;
  program.updatedAt = Date.now();
  await saveSavedPrograms(programs);
}

export async function seedPushPullProgram(): Promise<UserProgram> {
  const existingPrograms = await getSavedPrograms();
  const existing = existingPrograms.find(p => p.name === 'İtiş & Çekiş Paketi');
  if (existing) return existing;

  const pushExercises = [
    { id: 'bench_press', s: 3, r: 8, w: 75 },
    { id: 'cable_fly', s: 3, r: 15, w: 40 },
    { id: 'incline_dumbbell_press', s: 3, r: 12, w: 17.5 },
    { id: 'overhead_press', s: 3, r: 8, w: 70 },
    { id: 'lateral_raise', s: 3, r: 15, w: 10 },
    { id: 'tricep_pushdown', s: 3, r: 8, w: 60 },
    { id: 'overhead_tricep_extension', s: 3, r: 12, w: 25 },
  ];

  const pullExercises = [
    { id: 'lat_pulldown', s: 3, r: 12, w: 90 },
    { id: 'seated_cable_row', s: 3, r: 8, w: 80 },
    { id: 'chest_supported_row', s: 3, r: 12, w: 12.5 },
    { id: 'face_pull', s: 3, r: 12, w: 30 },
    { id: 'preacher_curl', s: 3, r: 12, w: 12.5 },
    { id: 'bayesian_curl', s: 3, r: 15, w: 15 },
    { id: 'hammer_curl', s: 3, r: 8, w: 12.5 },
    { id: 'wrist_supination', s: 3, r: 15, w: 5 },
    { id: 'wrist_extension', s: 3, r: 15, w: 12.5 },
    { id: 'plate_hold', s: 3, r: 30, w: 10 },
  ];

  const program = await createNewProgram('İtiş & Çekiş Paketi');
  let order = 0;

  for (const ex of pushExercises) {
    program.exercises.push({
      exerciseId: ex.id,
      order: order++,
      targetSets: ex.s,
      targetReps: ex.r,
      addedAt: Date.now(),
      day: 'İtiş Günü (Push)',
    });
  }

  for (const ex of pullExercises) {
    program.exercises.push({
      exerciseId: ex.id,
      order: order++,
      targetSets: ex.s,
      targetReps: ex.r,
      addedAt: Date.now(),
      day: 'Çekiş Günü (Pull)',
    });
  }

  const programs = await getSavedPrograms();
  const index = programs.findIndex(p => p.id === program.id);
  if (index !== -1) {
    programs[index] = program;
    await saveSavedPrograms(programs);
  }
  return program;
}

export async function seedPilatesProgram(): Promise<UserProgram> {
  const existingPrograms = await getSavedPrograms();
  const existing = existingPrograms.find(p => p.name === 'Pilates & Ev Paketi');
  if (existing) return existing;

  const pilatesEx = [
    { id: 'plank', s: 3, r: 60, day: 'Core' }, // Assuming r is seconds for plank
    { id: 'crunches', s: 3, r: 20, day: 'Core' },
    { id: 'squat', s: 3, r: 15, day: 'Alt Vücut' },
    { id: 'lunges', s: 3, r: 12, day: 'Alt Vücut' },
  ];

  const program = await createNewProgram('Pilates & Ev Paketi');
  let order = 0;

  for (const ex of pilatesEx) {
    program.exercises.push({
      exerciseId: ex.id,
      order: order++,
      targetSets: ex.s,
      targetReps: ex.r,
      addedAt: Date.now(),
      day: ex.day,
    });
  }

  const programs = await getSavedPrograms();
  const index = programs.findIndex(p => p.id === program.id);
  if (index !== -1) {
    programs[index] = program;
    await saveSavedPrograms(programs);
  }
  return program;
}

export async function seedFullBodyProgram(): Promise<UserProgram> {
  const existingPrograms = await getSavedPrograms();
  const existing = existingPrograms.find(p => p.name === 'Tüm Vücut (Temel)');
  if (existing) return existing;

  const exercises = [
    { id: 'squat', s: 3, r: 15, day: 'Alt Vücut' },
    { id: 'deadlift', s: 3, r: 10, day: 'Alt Vücut' },
    { id: 'pushup', s: 3, r: 15, day: 'Üst Vücut' },
    { id: 'plank', s: 3, r: 60, day: 'Core' },
  ];

  const program = await createNewProgram('Tüm Vücut (Temel)');
  let order = 0;
  for (const ex of exercises) {
    program.exercises.push({
      exerciseId: ex.id,
      order: order++,
      targetSets: ex.s,
      targetReps: ex.r,
      addedAt: Date.now(),
      day: ex.day,
    });
  }

  const programs = await getSavedPrograms();
  const index = programs.findIndex(p => p.id === program.id);
  if (index !== -1) {
    programs[index] = program;
    await saveSavedPrograms(programs);
  }
  return program;
}

export async function seedCoreProgram(): Promise<UserProgram> {
  const existingPrograms = await getSavedPrograms();
  const existing = existingPrograms.find(p => p.name === 'Sıkı Karın (Core)');
  if (existing) return existing;

  const exercises = [
    { id: 'plank', s: 4, r: 60, day: 'Karın' },
    { id: 'crunches', s: 4, r: 25, day: 'Karın' },
  ];

  const program = await createNewProgram('Sıkı Karın (Core)');
  let order = 0;
  for (const ex of exercises) {
    program.exercises.push({
      exerciseId: ex.id,
      order: order++,
      targetSets: ex.s,
      targetReps: ex.r,
      addedAt: Date.now(),
      day: ex.day,
    });
  }

  const programs = await getSavedPrograms();
  const index = programs.findIndex(p => p.id === program.id);
  if (index !== -1) {
    programs[index] = program;
    await saveSavedPrograms(programs);
  }
  return program;
}

export async function seedUserWorkout(): Promise<void> {
  await seedPushPullProgram();
}


// ============================================================
// WEIGHT HISTORY
// ============================================================

export async function getWeightHistory(exerciseId?: string): Promise<WeightEntry[]> {
  try {
    const data = await getFirestoreData(BASE_KEYS.WEIGHT_HISTORY);
    const all: WeightEntry[] = data || [];
    if (exerciseId) {
      return all.filter((e) => e.exerciseId === exerciseId);
    }
    return all;
  } catch (error) {
    console.error('Error loading weight history:', error);
    return [];
  }
}

export async function getLastWeight(exerciseId: string): Promise<WeightEntry | null> {
  const history = await getWeightHistory(exerciseId);
  return history.length > 0 ? history[history.length - 1] : null;
}

export async function saveWeightEntry(entry: WeightEntry): Promise<void> {
  try {
    const data = await getFirestoreData(BASE_KEYS.WEIGHT_HISTORY);
    const all: WeightEntry[] = data || [];
    all.push(entry);
    // Keep last 500 entries total
    const trimmed = all.slice(-500);
    await setFirestoreData(BASE_KEYS.WEIGHT_HISTORY, trimmed);
  } catch (error) {
    console.error('Error saving weight entry:', error);
  }
}

/**
 * Generate a smart progressive overload suggestion.
 * Checks last 3 sessions: if all had score >= 75, suggest increase.
 */
export async function getProgressSuggestion(
  exerciseId: string
): Promise<{ shouldIncrease: boolean; currentWeight: number; suggestedWeight: number; message: string; messageTr: string } | null> {
  const history = await getWeightHistory(exerciseId);
  if (history.length === 0) return null;

  const last = history[history.length - 1];
  const lastThree = history.slice(-3);

  if (lastThree.length >= 2 && lastThree.every((e) => e.score >= 75)) {
    const increment = last.weight >= 40 ? 2.5 : last.weight >= 20 ? 2 : 1;
    return {
      shouldIncrease: true,
      currentWeight: last.weight,
      suggestedWeight: last.weight + increment,
      message: `Great form! Consider increasing from ${last.weight}kg to ${last.weight + increment}kg.`,
      messageTr: `Harika form! ${last.weight}kg'dan ${last.weight + increment}kg'a çıkmayı dene.`,
    };
  }

  return {
    shouldIncrease: false,
    currentWeight: last.weight,
    suggestedWeight: last.weight,
    message: `Stay at ${last.weight}kg and focus on form.`,
    messageTr: `${last.weight}kg'da kal ve forma odaklan.`,
  };
}
