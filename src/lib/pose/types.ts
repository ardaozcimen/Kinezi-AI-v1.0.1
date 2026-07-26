// Kinezi-AI Pose Types
// Type definitions for pose detection, analysis, and feedback

export interface PoseLandmark {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  z: number; // depth
  visibility: number; // 0-1 confidence
}

export type PoseLandmarks = PoseLandmark[];

export interface JointAngle {
  name: string;
  angle: number;
  isCorrect: boolean;
  targetMin: number;
  targetMax: number;
}

export interface FormFeedback {
  id: string;
  type: 'error' | 'warning' | 'success';
  message: string;
  messageTr: string;
  bodyPart: string;
  priority: number; // 1 = highest (safety), 5 = lowest (tip)
  timestamp: number;
}

export interface FormScore {
  overall: number;       // 0-100
  kneeAlignment: number; // 0-100
  spineNeutral: number;  // 0-100
  depth: number;         // 0-100
  balance: number;       // 0-100
}

export enum ExercisePhase {
  IDLE = 'idle',
  SETUP = 'setup',
  ECCENTRIC = 'eccentric',  // Going down
  BOTTOM = 'bottom',         // Lowest point
  CONCENTRIC = 'concentric', // Going up
  TOP = 'top',               // Standing
  HOLD = 'hold',             // For plank
}

export interface RepData {
  repNumber: number;
  phase: ExercisePhase;
  formScore: number;
  minKneeAngle: number;
  maxSpineDeviation: number;
  duration: number;
  feedbacks: FormFeedback[];
  landmarks: PoseLandmarks[]; // Frame-by-frame landmarks for replay
}

export interface WorkoutSession {
  id: string;
  exerciseId: string;
  startTime: number;
  endTime?: number;
  reps: RepData[];
  overallScore: number;
  totalSets: number;
  currentSet: number;
  currentRep: number;
}

export interface ExerciseRule {
  id: string;
  name: string;
  check: (landmarks: PoseLandmarks) => FormFeedback | null;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

// Skeleton drawing types
export interface SkeletonStyle {
  lineColor: string;
  lineWidth: number;
  jointColor: string;
  jointRadius: number;
  glowColor: string;
  glowRadius: number;
}

export interface AngleIndicator {
  position: Point2D;
  angle: number;
  isCorrect: boolean;
  label: string;
}

// Storage types
export interface WorkoutHistory {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  score: number;
  reps: number;
  sets: number;
  duration: number;
}

export interface UserStats {
  totalWorkouts: number;
  currentStreak: number;
  bestStreak: number;
  averageScore: number;
  totalReps: number;
  exerciseHistory: Record<string, number[]>; // exerciseId -> scores[]
}
