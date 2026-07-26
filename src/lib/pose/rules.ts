// Kinezi-AI Exercise Rules Engine
// Exercise-specific form rules with real-time feedback

import { PoseLandmarks, FormFeedback, ExercisePhase } from './types';
import {
  getKneeAngle,
  getHipAngle,
  getElbowAngle,
  getSpineAngle,
  getTorsoLean,
  getKneeValgus,
  getCenterOfMass,
  areRequiredLandmarksVisible,
} from './angles';
import { PoseLandmarkIndex } from '@/constants/landmarks';

// ============================================================
// SQUAT RULES
// ============================================================
const SQUAT_REQUIRED_LANDMARKS = [
  PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP,
  PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.RIGHT_KNEE,
  PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.RIGHT_ANKLE,
  PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER,
];

export function analyzeSquat(landmarks: PoseLandmarks): FormFeedback[] {
  const feedbacks: FormFeedback[] = [];
  const now = Date.now();

  if (!areRequiredLandmarksVisible(landmarks, SQUAT_REQUIRED_LANDMARKS)) return feedbacks;

  const leftKneeAngle = getKneeAngle(landmarks, 'left');
  const rightKneeAngle = getKneeAngle(landmarks, 'right');
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
  const spineAngle = getSpineAngle(landmarks);
  const torsoLean = getTorsoLean(landmarks);
  const leftValgus = getKneeValgus(landmarks, 'left');
  const rightValgus = getKneeValgus(landmarks, 'right');

  // Rule 1: Knee depth check (should go below 90°)
  if (avgKneeAngle > 90 && avgKneeAngle < 160) {
    // In the squat but not deep enough
    if (avgKneeAngle > 120) {
      feedbacks.push({
        id: 'squat_depth',
        type: 'warning',
        message: 'Go deeper! Aim for 90° knee bend.',
        messageTr: 'Daha derine in! 90° diz bükümünü hedefle.',
        bodyPart: 'knees',
        priority: 3,
        timestamp: now,
      });
    }
  }

  // Rule 2: Knee valgus (caving inward)
  if (leftValgus < -0.03 || rightValgus < -0.03) {
    feedbacks.push({
      id: 'squat_knee_valgus',
      type: 'error',
      message: 'Push your knees out! They are caving inward.',
      messageTr: 'Dizlerini dışa it! İçe çöküyorlar.',
      bodyPart: 'knees',
      priority: 1,
      timestamp: now,
    });
  }

  // Rule 3: Excessive forward lean
  if (Math.abs(torsoLean) > 45) {
    feedbacks.push({
      id: 'squat_forward_lean',
      type: 'error',
      message: 'Keep your chest up! Too much forward lean.',
      messageTr: 'Göğsünü yukarı tut! Çok fazla öne eğiliyorsun.',
      bodyPart: 'torso',
      priority: 2,
      timestamp: now,
    });
  }

  // Rule 4: Spine deviation
  if (spineAngle > 20) {
    feedbacks.push({
      id: 'squat_spine',
      type: 'warning',
      message: 'Straighten your back.',
      messageTr: 'Sırtını düzelt.',
      bodyPart: 'spine',
      priority: 2,
      timestamp: now,
    });
  }

  // Rule 5: Good form feedback
  if (feedbacks.length === 0 && avgKneeAngle < 100) {
    feedbacks.push({
      id: 'squat_good',
      type: 'success',
      message: 'Great form! Keep it up!',
      messageTr: 'Harika form! Devam et!',
      bodyPart: 'overall',
      priority: 5,
      timestamp: now,
    });
  }

  return feedbacks;
}

/**
 * Detect squat phase from knee angle
 */
export function getSquatPhase(landmarks: PoseLandmarks, prevPhase: ExercisePhase): ExercisePhase {
  const kneeAngle = getKneeAngle(landmarks, 'left');
  if (kneeAngle > 160) return ExercisePhase.TOP;
  if (kneeAngle < 100) return ExercisePhase.BOTTOM;
  if (prevPhase === ExercisePhase.TOP || prevPhase === ExercisePhase.ECCENTRIC) {
    return ExercisePhase.ECCENTRIC;
  }
  return ExercisePhase.CONCENTRIC;
}

export function getDeadliftPhase(landmarks: PoseLandmarks, prevPhase: ExercisePhase): ExercisePhase {
  const hipAngle = getHipAngle(landmarks, 'left');
  if (hipAngle > 160) return ExercisePhase.TOP;
  if (hipAngle < 100) return ExercisePhase.BOTTOM;
  if (prevPhase === ExercisePhase.TOP || prevPhase === ExercisePhase.ECCENTRIC) {
    return ExercisePhase.ECCENTRIC;
  }
  return ExercisePhase.CONCENTRIC;
}

export function getUpperBodyPushPhase(landmarks: PoseLandmarks, prevPhase: ExercisePhase): ExercisePhase {
  const elbowAngle = getElbowAngle(landmarks, 'left');
  // Full extension is typically top
  if (elbowAngle > 150) return ExercisePhase.TOP;
  if (elbowAngle < 90) return ExercisePhase.BOTTOM;
  if (prevPhase === ExercisePhase.TOP || prevPhase === ExercisePhase.ECCENTRIC) {
    return ExercisePhase.ECCENTRIC;
  }
  return ExercisePhase.CONCENTRIC;
}

export function getBicepCurlPhase(landmarks: PoseLandmarks, prevPhase: ExercisePhase): ExercisePhase {
  const elbowAngle = getElbowAngle(landmarks, 'left');
  // For curl, arm straight (180) is BOTTOM, curled (45) is TOP
  if (elbowAngle < 60) return ExercisePhase.TOP;
  if (elbowAngle > 150) return ExercisePhase.BOTTOM;
  if (prevPhase === ExercisePhase.BOTTOM || prevPhase === ExercisePhase.CONCENTRIC) {
    return ExercisePhase.CONCENTRIC;
  }
  return ExercisePhase.ECCENTRIC;
}

export function getWalkingPhase(landmarks: PoseLandmarks, prevPhase: ExercisePhase): ExercisePhase {
  // Simple step detection: toggle phases when legs cross or reach max extension
  const leftKnee = getKneeAngle(landmarks, 'left');
  const rightKnee = getKneeAngle(landmarks, 'right');
  
  if (leftKnee > 160 && rightKnee < 140) return ExercisePhase.TOP; // Left step
  if (rightKnee > 160 && leftKnee < 140) return ExercisePhase.BOTTOM; // Right step
  
  if (prevPhase === ExercisePhase.TOP || prevPhase === ExercisePhase.ECCENTRIC) {
    return ExercisePhase.ECCENTRIC; // Moving towards right step
  }
  return ExercisePhase.CONCENTRIC; // Moving towards left step
}

// ============================================================
// DEADLIFT RULES
// ============================================================
const DEADLIFT_REQUIRED_LANDMARKS = [
  PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP,
  PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.RIGHT_KNEE,
  PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER,
  PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.RIGHT_ANKLE,
];

export function analyzeDeadlift(landmarks: PoseLandmarks): FormFeedback[] {
  const feedbacks: FormFeedback[] = [];
  const now = Date.now();

  if (!areRequiredLandmarksVisible(landmarks, DEADLIFT_REQUIRED_LANDMARKS)) return feedbacks;

  const hipAngle = (getHipAngle(landmarks, 'left') + getHipAngle(landmarks, 'right')) / 2;
  const spineAngle = getSpineAngle(landmarks);
  const leftKneeAngle = getKneeAngle(landmarks, 'left');
  const rightKneeAngle = getKneeAngle(landmarks, 'right');

  // Rule 1: Back rounding
  if (spineAngle > 25) {
    feedbacks.push({
      id: 'deadlift_back_round',
      type: 'error',
      message: 'Keep your back straight! Stop rounding.',
      messageTr: 'Sırtını düz tut! Kamburlaşma.',
      bodyPart: 'spine',
      priority: 1,
      timestamp: now,
    });
  }

  // Rule 2: Too much knee bend (should hip hinge, not squat)
  if (leftKneeAngle < 100 || rightKneeAngle < 100) {
    feedbacks.push({
      id: 'deadlift_knee_bend',
      type: 'warning',
      message: 'Less knee bend. Hinge at your hips.',
      messageTr: 'Dizlerini daha az bük. Kalçalarından kır.',
      bodyPart: 'knees',
      priority: 3,
      timestamp: now,
    });
  }

  // Rule 3: Good form
  if (feedbacks.length === 0 && hipAngle < 120) {
    feedbacks.push({
      id: 'deadlift_good',
      type: 'success',
      message: 'Perfect hip hinge! Great form.',
      messageTr: 'Mükemmel kalça menteşesi! Harika form.',
      bodyPart: 'overall',
      priority: 5,
      timestamp: now,
    });
  }

  return feedbacks;
}

// ============================================================
// PUSH-UP RULES
// ============================================================
const PUSHUP_REQUIRED_LANDMARKS = [
  PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER,
  PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.RIGHT_ELBOW,
  PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.RIGHT_WRIST,
  PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP,
  PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.RIGHT_ANKLE,
];

export function analyzePushup(landmarks: PoseLandmarks): FormFeedback[] {
  const feedbacks: FormFeedback[] = [];
  const now = Date.now();

  if (!areRequiredLandmarksVisible(landmarks, PUSHUP_REQUIRED_LANDMARKS)) return feedbacks;

  const leftElbow = getElbowAngle(landmarks, 'left');
  const rightElbow = getElbowAngle(landmarks, 'right');
  const avgElbow = (leftElbow + rightElbow) / 2;

  // Check body alignment (shoulder-hip-ankle should be roughly straight)
  const shoulderY = (landmarks[PoseLandmarkIndex.LEFT_SHOULDER].y + landmarks[PoseLandmarkIndex.RIGHT_SHOULDER].y) / 2;
  const hipY = (landmarks[PoseLandmarkIndex.LEFT_HIP].y + landmarks[PoseLandmarkIndex.RIGHT_HIP].y) / 2;
  const ankleY = (landmarks[PoseLandmarkIndex.LEFT_ANKLE].y + landmarks[PoseLandmarkIndex.RIGHT_ANKLE].y) / 2;

  // Hip sag check
  const expectedHipY = (shoulderY + ankleY) / 2;
  const hipSag = hipY - expectedHipY;

  if (hipSag > 0.05) {
    feedbacks.push({
      id: 'pushup_hip_sag',
      type: 'error',
      message: 'Raise your hips! Body should be straight.',
      messageTr: 'Kalçanı kaldır! Vücudun düz olmalı.',
      bodyPart: 'hips',
      priority: 1,
      timestamp: now,
    });
  }

  if (hipSag < -0.06) {
    feedbacks.push({
      id: 'pushup_hip_pike',
      type: 'warning',
      message: 'Lower your hips slightly.',
      messageTr: 'Kalçanı biraz indir.',
      bodyPart: 'hips',
      priority: 2,
      timestamp: now,
    });
  }

  // Depth check
  if (avgElbow > 120 && avgElbow < 170) {
    feedbacks.push({
      id: 'pushup_depth',
      type: 'warning',
      message: 'Go lower! Aim for 90° elbow bend.',
      messageTr: 'Daha aşağı in! 90° dirsek bükümünü hedefle.',
      bodyPart: 'arms',
      priority: 3,
      timestamp: now,
    });
  }

  if (feedbacks.length === 0) {
    feedbacks.push({
      id: 'pushup_good',
      type: 'success',
      message: 'Perfect push-up form!',
      messageTr: 'Mükemmel şınav formu!',
      bodyPart: 'overall',
      priority: 5,
      timestamp: now,
    });
  }

  return feedbacks;
}

// ============================================================
// LUNGE RULES
// ============================================================
export function analyzeLunge(landmarks: PoseLandmarks): FormFeedback[] {
  const feedbacks: FormFeedback[] = [];
  const now = Date.now();

  const requiredLandmarks = [
    PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP,
    PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.RIGHT_KNEE,
    PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.RIGHT_ANKLE,
    PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER,
  ];

  if (!areRequiredLandmarksVisible(landmarks, requiredLandmarks)) return feedbacks;

  const leftKnee = getKneeAngle(landmarks, 'left');
  const rightKnee = getKneeAngle(landmarks, 'right');
  const spineAngle = getSpineAngle(landmarks);

  // Front knee should be ~90°
  const frontKnee = Math.min(leftKnee, rightKnee);
  if (frontKnee > 110 && frontKnee < 160) {
    feedbacks.push({
      id: 'lunge_depth',
      type: 'warning',
      message: 'Bend your front knee more.',
      messageTr: 'Ön dizini daha fazla bük.',
      bodyPart: 'knees',
      priority: 3,
      timestamp: now,
    });
  }

  // Torso upright check
  if (spineAngle > 15) {
    feedbacks.push({
      id: 'lunge_torso',
      type: 'warning',
      message: 'Keep your torso upright.',
      messageTr: 'Gövdeni dik tut.',
      bodyPart: 'torso',
      priority: 2,
      timestamp: now,
    });
  }

  if (feedbacks.length === 0) {
    feedbacks.push({
      id: 'lunge_good',
      type: 'success',
      message: 'Great lunge form!',
      messageTr: 'Harika lunge formu!',
      bodyPart: 'overall',
      priority: 5,
      timestamp: now,
    });
  }

  return feedbacks;
}

// ============================================================
// PLANK RULES
// ============================================================
export function analyzePlank(landmarks: PoseLandmarks): FormFeedback[] {
  const feedbacks: FormFeedback[] = [];
  const now = Date.now();

  const requiredLandmarks = [
    PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER,
    PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP,
    PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.RIGHT_ANKLE,
  ];

  if (!areRequiredLandmarksVisible(landmarks, requiredLandmarks)) return feedbacks;

  const shoulderY = (landmarks[PoseLandmarkIndex.LEFT_SHOULDER].y + landmarks[PoseLandmarkIndex.RIGHT_SHOULDER].y) / 2;
  const hipY = (landmarks[PoseLandmarkIndex.LEFT_HIP].y + landmarks[PoseLandmarkIndex.RIGHT_HIP].y) / 2;
  const ankleY = (landmarks[PoseLandmarkIndex.LEFT_ANKLE].y + landmarks[PoseLandmarkIndex.RIGHT_ANKLE].y) / 2;

  const expectedHipY = (shoulderY + ankleY) / 2;
  const deviation = hipY - expectedHipY;

  if (deviation > 0.04) {
    feedbacks.push({
      id: 'plank_hip_drop',
      type: 'error',
      message: 'Raise your hips! They are dropping.',
      messageTr: 'Kalçanı kaldır! Aşağı düşüyor.',
      bodyPart: 'hips',
      priority: 1,
      timestamp: now,
    });
  }

  if (deviation < -0.05) {
    feedbacks.push({
      id: 'plank_hip_pike',
      type: 'warning',
      message: 'Lower your hips. Don\'t pike up.',
      messageTr: 'Kalçanı indir. Yukarı kaldırma.',
      bodyPart: 'hips',
      priority: 2,
      timestamp: now,
    });
  }

  if (feedbacks.length === 0) {
    feedbacks.push({
      id: 'plank_good',
      type: 'success',
      message: 'Perfect plank! Hold it!',
      messageTr: 'Mükemmel plank! Tut!',
      bodyPart: 'overall',
      priority: 5,
      timestamp: now,
    });
  }

  return feedbacks;
}

// Generic Upper Body Push Analyzer (Chest/Shoulders/Triceps)
export function analyzeUpperBodyPush(landmarks: PoseLandmarks): FormFeedback[] {
  const feedbacks: FormFeedback[] = [];
  const now = Date.now();
  const leftElbow = getElbowAngle(landmarks, 'left');
  const rightElbow = getElbowAngle(landmarks, 'right');
  
  if (leftElbow > 170 || rightElbow > 170) {
    feedbacks.push({
      id: 'push_lockout',
      type: 'warning',
      message: 'Don\'t lock your elbows completely.',
      messageTr: 'Dirseklerini tamamen kilitleme.',
      bodyPart: 'arms',
      priority: 2,
      timestamp: now,
    });
  }
  return feedbacks;
}

// Generic Biceps/Pull Analyzer
export function analyzeBicepCurl(landmarks: PoseLandmarks): FormFeedback[] {
  const feedbacks: FormFeedback[] = [];
  const now = Date.now();
  const spineAngle = getSpineAngle(landmarks);
  
  if (spineAngle > 15) {
    feedbacks.push({
      id: 'curl_swing',
      type: 'error',
      message: 'Don\'t swing your back! Keep posture straight.',
      messageTr: 'Sırtından güç alma! Dik dur.',
      bodyPart: 'spine',
      priority: 1,
      timestamp: now,
    });
  }
  return feedbacks;
}

export type ExerciseAnalyzer = (landmarks: PoseLandmarks) => FormFeedback[];
export type PhaseDetector = (landmarks: PoseLandmarks, prevPhase: ExercisePhase) => ExercisePhase;

export const EXERCISE_PHASE_DETECTORS: Record<string, PhaseDetector> = {
  // Lower Body
  squat: getSquatPhase,
  lunge: getSquatPhase,
  walking: getWalkingPhase,

  // Hinge / Deadlift
  deadlift: getDeadliftPhase,
  romanian_deadlift: getDeadliftPhase,

  // Push (Chest, Shoulders, Triceps)
  pushup: getUpperBodyPushPhase,
  bench_press: getUpperBodyPushPhase,
  incline_bench_press: getUpperBodyPushPhase,
  close_grip_bench: getUpperBodyPushPhase,
  chest_dip: getUpperBodyPushPhase,
  overhead_press: getUpperBodyPushPhase,
  tricep_extension: getUpperBodyPushPhase,
  skullcrusher: getUpperBodyPushPhase,
  tricep_pushdown: getUpperBodyPushPhase,
  overhead_tricep_extension: getUpperBodyPushPhase,

  // Curl / Pull (Biceps, Back)
  barbell_curl: getBicepCurlPhase,
  dumbbell_curl: getBicepCurlPhase,
  hammer_curl: getBicepCurlPhase,
  preacher_curl: getBicepCurlPhase,
  concentration_curl: getBicepCurlPhase,
  pull_up: getBicepCurlPhase,
  lat_pulldown: getBicepCurlPhase,
  barbell_row: getBicepCurlPhase,
  seated_cable_row: getBicepCurlPhase,
  t_bar_row: getBicepCurlPhase,

  // Lateral raises (use upper body push - arm extension)
  lateral_raise: getUpperBodyPushPhase,
  front_raise: getUpperBodyPushPhase,
  upright_row: getUpperBodyPushPhase,
  reverse_pec_deck: getUpperBodyPushPhase,
  dumbbell_fly: getUpperBodyPushPhase,
  cable_crossover: getUpperBodyPushPhase,

  // Pilates
  pilates_hundred: (angles: any) => ExercisePhase.CONCENTRIC,
  pilates_roll_up: (angles: any) => angles.hip > 140 ? ExercisePhase.ECCENTRIC : ExercisePhase.CONCENTRIC,
  pilates_bridge: (angles: any) => angles.hip < 160 ? ExercisePhase.ECCENTRIC : ExercisePhase.CONCENTRIC,
  pilates_scissors: (angles: any) => angles.hip > 140 ? ExercisePhase.ECCENTRIC : ExercisePhase.CONCENTRIC,

  // Lower Body New
  leg_press: getSquatPhase,
  bulgarian_split_squat: getSquatPhase,
  rdl: getDeadliftPhase,
  leg_extension: getSquatPhase,
  lying_leg_curl: getDeadliftPhase,
  seated_leg_curl: getDeadliftPhase,
  standing_calf_raise: getSquatPhase,
  seated_calf_raise: getSquatPhase,
  hip_thrust: getDeadliftPhase,
  goblet_squat: getSquatPhase,
  hack_squat: getSquatPhase,
  sumo_deadlift: getDeadliftPhase,
  front_squat: getSquatPhase,

  // Back New
  chin_up: getBicepCurlPhase,
  dumbbell_row: getBicepCurlPhase,
  pendlay_row: getBicepCurlPhase,
  straight_arm_pulldown: getBicepCurlPhase,
  shrugs: getBicepCurlPhase,
  good_morning: getDeadliftPhase,
  
  // Chest New
  decline_bench_press: getUpperBodyPushPhase,
  pec_deck: getUpperBodyPushPhase,
  dumbbell_pullover: getUpperBodyPushPhase,
  incline_dumbbell_fly: getUpperBodyPushPhase,
  machine_chest_press: getUpperBodyPushPhase,
  
  // Shoulders New
  arnold_press: getUpperBodyPushPhase,
  seated_dumbbell_press: getUpperBodyPushPhase,
  cable_lateral_raise: getUpperBodyPushPhase,
  front_dumbbell_raise: getUpperBodyPushPhase,
  military_press: getUpperBodyPushPhase,
  rear_delt_fly: getUpperBodyPushPhase,

  // Arms New
  spider_curl: getBicepCurlPhase,
  ez_bar_curl: getBicepCurlPhase,
  cable_curl: getBicepCurlPhase,
  reverse_curl: getBicepCurlPhase,
  rope_pushdown: getUpperBodyPushPhase,
  overhead_dumbbell_extension: getUpperBodyPushPhase,
  tricep_kickback: getUpperBodyPushPhase,
  bench_dips: getUpperBodyPushPhase,

  // Core New
  hyperextension: (l, p) => ExercisePhase.HOLD,
  russian_twist: (l, p) => ExercisePhase.HOLD,
  leg_raises: (l, p) => ExercisePhase.HOLD,
  bicycle_crunches: (l, p) => ExercisePhase.HOLD,
  mountain_climbers: (l, p) => ExercisePhase.HOLD,
  ab_roller: (l, p) => ExercisePhase.HOLD,
  hanging_leg_raise: (l, p) => ExercisePhase.HOLD,
  v_ups: (l, p) => ExercisePhase.HOLD,
  flutter_kicks: (l, p) => ExercisePhase.HOLD,

  // Full Body New
  burpees: getSquatPhase,
  kettlebell_swing: getDeadliftPhase,

  // Grip
  plate_hold: (l, p) => ExercisePhase.HOLD,
};

export function analyzeWalking(landmarks: PoseLandmarks): FormFeedback[] {
  const feedbacks: FormFeedback[] = [];
  const now = Date.now();

  const spineAngle = getSpineAngle(landmarks);
  
  // Rule: Maintain upright posture while walking
  // getSpineAngle returns deviation from vertical (0 = perfectly upright)
  if (spineAngle > 15) {
    feedbacks.push({
      id: 'walking_posture',
      type: 'warning',
      message: 'Keep your head up and spine straight while walking.',
      messageTr: 'Yürürken başınızı dik ve omurganızı düz tutun.',
      bodyPart: 'spine',
      priority: 2,
      timestamp: now,
    });
  } else {
    feedbacks.push({
      id: 'walking_posture',
      type: 'success',
      message: 'Good upright posture.',
      messageTr: 'Dik duruş çok iyi.',
      bodyPart: 'spine',
      priority: 5,
      timestamp: now,
    });
  }
  
  return feedbacks;
}

export const EXERCISE_ANALYZERS: Record<string, ExerciseAnalyzer> = {
  // Lower Body
  squat: analyzeSquat,
  deadlift: analyzeDeadlift,
  romanian_deadlift: analyzeDeadlift,
  lunge: analyzeLunge,
  walking: analyzeWalking,

  // Core
  pushup: analyzePushup,
  plank: analyzePlank,

  // Chest
  bench_press: analyzeUpperBodyPush,
  incline_bench_press: analyzeUpperBodyPush,
  dumbbell_fly: analyzeUpperBodyPush,
  chest_dip: analyzeUpperBodyPush,
  cable_crossover: analyzeUpperBodyPush,
  close_grip_bench: analyzeUpperBodyPush,

  // Shoulders
  overhead_press: analyzeUpperBodyPush,
  lateral_raise: analyzeUpperBodyPush,
  front_raise: analyzeUpperBodyPush,
  upright_row: analyzeUpperBodyPush,
  reverse_pec_deck: analyzeUpperBodyPush,

  // Triceps
  tricep_extension: analyzeUpperBodyPush,
  skullcrusher: analyzeUpperBodyPush,
  tricep_pushdown: analyzeUpperBodyPush,
  overhead_tricep_extension: analyzeUpperBodyPush,

  // Biceps
  barbell_curl: analyzeBicepCurl,
  dumbbell_curl: analyzeBicepCurl,
  hammer_curl: analyzeBicepCurl,
  preacher_curl: analyzeBicepCurl,
  concentration_curl: analyzeBicepCurl,

  // Back
  pull_up: analyzeBicepCurl,
  lat_pulldown: analyzeBicepCurl,
  barbell_row: analyzeBicepCurl,
  seated_cable_row: analyzeBicepCurl,
  t_bar_row: analyzeBicepCurl,

  // Pilates
  pilates_hundred: analyzePlank,
  pilates_roll_up: analyzePlank,
  pilates_bridge: analyzeSquat,
  pilates_scissors: analyzePlank,

  // Lower Body New
  leg_press: analyzeSquat,
  bulgarian_split_squat: analyzeLunge,
  rdl: analyzeDeadlift,
  leg_extension: analyzeSquat,
  lying_leg_curl: analyzeDeadlift,
  seated_leg_curl: analyzeDeadlift,
  standing_calf_raise: analyzeSquat,
  seated_calf_raise: analyzeSquat,
  hip_thrust: analyzeDeadlift,
  goblet_squat: analyzeSquat,
  hack_squat: analyzeSquat,
  sumo_deadlift: analyzeDeadlift,
  front_squat: analyzeSquat,

  // Back New
  chin_up: analyzeBicepCurl,
  dumbbell_row: analyzeBicepCurl,
  pendlay_row: analyzeBicepCurl,
  straight_arm_pulldown: analyzeBicepCurl,
  shrugs: analyzeBicepCurl,
  good_morning: analyzeDeadlift,
  
  // Chest New
  decline_bench_press: analyzeUpperBodyPush,
  pec_deck: analyzeUpperBodyPush,
  dumbbell_pullover: analyzeUpperBodyPush,
  incline_dumbbell_fly: analyzeUpperBodyPush,
  machine_chest_press: analyzeUpperBodyPush,
  
  // Shoulders New
  arnold_press: analyzeUpperBodyPush,
  seated_dumbbell_press: analyzeUpperBodyPush,
  cable_lateral_raise: analyzeUpperBodyPush,
  front_dumbbell_raise: analyzeUpperBodyPush,
  military_press: analyzeUpperBodyPush,
  rear_delt_fly: analyzeUpperBodyPush,

  // Arms New
  spider_curl: analyzeBicepCurl,
  ez_bar_curl: analyzeBicepCurl,
  cable_curl: analyzeBicepCurl,
  reverse_curl: analyzeBicepCurl,
  rope_pushdown: analyzeUpperBodyPush,
  overhead_dumbbell_extension: analyzeUpperBodyPush,
  tricep_kickback: analyzeUpperBodyPush,
  bench_dips: analyzeUpperBodyPush,

  // Core New
  hyperextension: analyzePlank,
  russian_twist: analyzePlank,
  leg_raises: analyzePlank,
  bicycle_crunches: analyzePlank,
  mountain_climbers: analyzePlank,
  ab_roller: analyzePlank,
  hanging_leg_raise: analyzePlank,
  v_ups: analyzePlank,
  flutter_kicks: analyzePlank,

  // Full Body New
  burpees: analyzeSquat,
  kettlebell_swing: analyzeDeadlift,

  // Grip
  plate_hold: analyzePlank,
};

/**
 * Calculate overall form score from feedbacks (0-100).
 */
export function calculateFormScore(feedbacks: FormFeedback[]): number {
  if (feedbacks.length === 0) return 100;

  let deductions = 0;
  for (const fb of feedbacks) {
    if (fb.type === 'error') deductions += 30;
    else if (fb.type === 'warning') deductions += 15;
    // success doesn't deduct
  }

  return Math.max(0, Math.min(100, 100 - deductions));
}

/**
 * Get score color based on score value.
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#39FF14'; // Excellent
  if (score >= 75) return '#00F5FF'; // Good
  if (score >= 60) return '#FFE500'; // Fair
  if (score >= 40) return '#FF6B35'; // Poor
  return '#FF3131'; // Bad
}

/**
 * Get score label based on score value.
 */
export function getScoreLabel(score: number): { en: string; tr: string } {
  if (score >= 90) return { en: 'Excellent', tr: 'Mükemmel' };
  if (score >= 75) return { en: 'Good', tr: 'İyi' };
  if (score >= 60) return { en: 'Fair', tr: 'Orta' };
  if (score >= 40) return { en: 'Poor', tr: 'Zayıf' };
  return { en: 'Needs Work', tr: 'Çalışmalısın' };
}
