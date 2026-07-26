// Kinezi-AI Angle Calculation Engine
// Biomechanical joint angle calculations using pose landmarks

import { PoseLandmarks, Point2D } from './types';
import { PoseLandmarkIndex } from '@/constants/landmarks';

/**
 * Calculate the angle between three points (in degrees).
 * The angle is measured at point B (the vertex).
 *
 *    A
 *     \
 *      \ angle
 *       B -------- C
 */
export function calculateAngle(
  a: Point2D,
  b: Point2D,
  c: Point2D
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) {
    angle = 360 - angle;
  }
  return angle;
}

/**
 * Calculate the knee angle (hip-knee-ankle)
 */
export function getKneeAngle(
  landmarks: PoseLandmarks,
  side: 'left' | 'right'
): number {
  const hipIdx = side === 'left' ? PoseLandmarkIndex.LEFT_HIP : PoseLandmarkIndex.RIGHT_HIP;
  const kneeIdx = side === 'left' ? PoseLandmarkIndex.LEFT_KNEE : PoseLandmarkIndex.RIGHT_KNEE;
  const ankleIdx = side === 'left' ? PoseLandmarkIndex.LEFT_ANKLE : PoseLandmarkIndex.RIGHT_ANKLE;

  return calculateAngle(
    landmarks[hipIdx],
    landmarks[kneeIdx],
    landmarks[ankleIdx]
  );
}

/**
 * Calculate the hip angle (shoulder-hip-knee)
 */
export function getHipAngle(
  landmarks: PoseLandmarks,
  side: 'left' | 'right'
): number {
  const shoulderIdx = side === 'left' ? PoseLandmarkIndex.LEFT_SHOULDER : PoseLandmarkIndex.RIGHT_SHOULDER;
  const hipIdx = side === 'left' ? PoseLandmarkIndex.LEFT_HIP : PoseLandmarkIndex.RIGHT_HIP;
  const kneeIdx = side === 'left' ? PoseLandmarkIndex.LEFT_KNEE : PoseLandmarkIndex.RIGHT_KNEE;

  return calculateAngle(
    landmarks[shoulderIdx],
    landmarks[hipIdx],
    landmarks[kneeIdx]
  );
}

/**
 * Calculate the elbow angle (shoulder-elbow-wrist)
 */
export function getElbowAngle(
  landmarks: PoseLandmarks,
  side: 'left' | 'right'
): number {
  const shoulderIdx = side === 'left' ? PoseLandmarkIndex.LEFT_SHOULDER : PoseLandmarkIndex.RIGHT_SHOULDER;
  const elbowIdx = side === 'left' ? PoseLandmarkIndex.LEFT_ELBOW : PoseLandmarkIndex.RIGHT_ELBOW;
  const wristIdx = side === 'left' ? PoseLandmarkIndex.LEFT_WRIST : PoseLandmarkIndex.RIGHT_WRIST;

  return calculateAngle(
    landmarks[shoulderIdx],
    landmarks[elbowIdx],
    landmarks[wristIdx]
  );
}

/**
 * Calculate spine angle relative to vertical.
 * Uses the midpoint of shoulders and midpoint of hips.
 * Returns deviation from vertical in degrees (0 = perfectly upright).
 */
export function getSpineAngle(landmarks: PoseLandmarks): number {
  const midShoulder = getMidpoint(
    landmarks[PoseLandmarkIndex.LEFT_SHOULDER],
    landmarks[PoseLandmarkIndex.RIGHT_SHOULDER]
  );
  const midHip = getMidpoint(
    landmarks[PoseLandmarkIndex.LEFT_HIP],
    landmarks[PoseLandmarkIndex.RIGHT_HIP]
  );

  // Angle from vertical (y-axis)
  const dx = midShoulder.x - midHip.x;
  const dy = midShoulder.y - midHip.y;
  const angle = Math.atan2(dx, -dy) * (180 / Math.PI); // negative dy because y is inverted

  return Math.abs(angle);
}

/**
 * Calculate forward lean of the torso.
 * Positive = leaning forward, Negative = leaning backward.
 */
export function getTorsoLean(landmarks: PoseLandmarks): number {
  const midShoulder = getMidpoint(
    landmarks[PoseLandmarkIndex.LEFT_SHOULDER],
    landmarks[PoseLandmarkIndex.RIGHT_SHOULDER]
  );
  const midHip = getMidpoint(
    landmarks[PoseLandmarkIndex.LEFT_HIP],
    landmarks[PoseLandmarkIndex.RIGHT_HIP]
  );

  const dx = midShoulder.x - midHip.x;
  const dy = midShoulder.y - midHip.y;
  return Math.atan2(dx, -dy) * (180 / Math.PI);
}

/**
 * Check if knees are caving inward (valgus).
 * Compares the x-position of the knee relative to the hip and ankle.
 * Returns a value: negative = valgus (bad), positive = neutral/varus.
 */
export function getKneeValgus(
  landmarks: PoseLandmarks,
  side: 'left' | 'right'
): number {
  const hipIdx = side === 'left' ? PoseLandmarkIndex.LEFT_HIP : PoseLandmarkIndex.RIGHT_HIP;
  const kneeIdx = side === 'left' ? PoseLandmarkIndex.LEFT_KNEE : PoseLandmarkIndex.RIGHT_KNEE;
  const ankleIdx = side === 'left' ? PoseLandmarkIndex.LEFT_ANKLE : PoseLandmarkIndex.RIGHT_ANKLE;

  const hipX = landmarks[hipIdx].x;
  const kneeX = landmarks[kneeIdx].x;
  const ankleX = landmarks[ankleIdx].x;

  // Expected knee x should be between hip and ankle
  const expectedX = (hipX + ankleX) / 2;
  const deviation = side === 'left'
    ? kneeX - expectedX // Left knee caving right = negative
    : expectedX - kneeX; // Right knee caving left = negative

  return deviation;
}

/**
 * Calculate the shoulder alignment (are shoulders level?)
 * Returns the angle of deviation from horizontal.
 */
export function getShoulderAlignment(landmarks: PoseLandmarks): number {
  const leftShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const rightShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];

  const dy = rightShoulder.y - leftShoulder.y;
  const dx = rightShoulder.x - leftShoulder.x;

  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Calculate the center of mass approximation.
 * Uses weighted average of key body landmarks.
 */
export function getCenterOfMass(landmarks: PoseLandmarks): Point2D {
  // Weighted body segment percentages (approximate)
  const segments = [
    { idx: PoseLandmarkIndex.NOSE, weight: 0.08 },          // Head
    { idx: PoseLandmarkIndex.LEFT_SHOULDER, weight: 0.12 },  // Upper torso
    { idx: PoseLandmarkIndex.RIGHT_SHOULDER, weight: 0.12 },
    { idx: PoseLandmarkIndex.LEFT_HIP, weight: 0.15 },      // Lower torso
    { idx: PoseLandmarkIndex.RIGHT_HIP, weight: 0.15 },
    { idx: PoseLandmarkIndex.LEFT_KNEE, weight: 0.07 },     // Thighs
    { idx: PoseLandmarkIndex.RIGHT_KNEE, weight: 0.07 },
    { idx: PoseLandmarkIndex.LEFT_ANKLE, weight: 0.04 },    // Shins
    { idx: PoseLandmarkIndex.RIGHT_ANKLE, weight: 0.04 },
    { idx: PoseLandmarkIndex.LEFT_ELBOW, weight: 0.04 },    // Upper arms
    { idx: PoseLandmarkIndex.RIGHT_ELBOW, weight: 0.04 },
    { idx: PoseLandmarkIndex.LEFT_WRIST, weight: 0.04 },    // Forearms
    { idx: PoseLandmarkIndex.RIGHT_WRIST, weight: 0.04 },
  ];

  let totalX = 0;
  let totalY = 0;
  let totalWeight = 0;

  for (const seg of segments) {
    const lm = landmarks[seg.idx];
    if (lm.visibility > 0.5) {
      totalX += lm.x * seg.weight;
      totalY += lm.y * seg.weight;
      totalWeight += seg.weight;
    }
  }

  return {
    x: totalWeight > 0 ? totalX / totalWeight : 0.5,
    y: totalWeight > 0 ? totalY / totalWeight : 0.5,
  };
}

/**
 * Calculate distance between two landmarks.
 */
export function getDistance(a: Point2D, b: Point2D): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Get the midpoint between two points.
 */
export function getMidpoint(a: Point2D, b: Point2D): Point2D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

/**
 * Check if a landmark is visible enough to use.
 */
export function isLandmarkVisible(
  landmarks: PoseLandmarks,
  index: PoseLandmarkIndex,
  threshold: number = 0.5
): boolean {
  return landmarks[index]?.visibility >= threshold;
}

/**
 * Check if all required landmarks for an exercise are visible.
 */
export function areRequiredLandmarksVisible(
  landmarks: PoseLandmarks,
  requiredIndices: PoseLandmarkIndex[],
  threshold: number = 0.5
): boolean {
  return requiredIndices.every((idx) => isLandmarkVisible(landmarks, idx, threshold));
}
