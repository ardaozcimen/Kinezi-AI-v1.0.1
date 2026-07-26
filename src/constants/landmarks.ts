// MediaPipe Pose Landmark Constants
// 33 keypoints from the MediaPipe BlazePose model

export enum PoseLandmarkIndex {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

// Skeleton connection pairs for drawing lines between landmarks
export const SKELETON_CONNECTIONS: [PoseLandmarkIndex, PoseLandmarkIndex][] = [
  // Face
  [PoseLandmarkIndex.LEFT_EAR, PoseLandmarkIndex.LEFT_EYE],
  [PoseLandmarkIndex.RIGHT_EAR, PoseLandmarkIndex.RIGHT_EYE],
  [PoseLandmarkIndex.LEFT_EYE, PoseLandmarkIndex.NOSE],
  [PoseLandmarkIndex.RIGHT_EYE, PoseLandmarkIndex.NOSE],
  [PoseLandmarkIndex.MOUTH_LEFT, PoseLandmarkIndex.MOUTH_RIGHT],

  // Torso
  [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER],
  [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_HIP],
  [PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_HIP],
  [PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP],

  // Left Arm
  [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_ELBOW],
  [PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.LEFT_WRIST],
  [PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.LEFT_PINKY],
  [PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.LEFT_INDEX],
  [PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.LEFT_THUMB],
  [PoseLandmarkIndex.LEFT_INDEX, PoseLandmarkIndex.LEFT_PINKY],

  // Right Arm
  [PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_ELBOW],
  [PoseLandmarkIndex.RIGHT_ELBOW, PoseLandmarkIndex.RIGHT_WRIST],
  [PoseLandmarkIndex.RIGHT_WRIST, PoseLandmarkIndex.RIGHT_PINKY],
  [PoseLandmarkIndex.RIGHT_WRIST, PoseLandmarkIndex.RIGHT_INDEX],
  [PoseLandmarkIndex.RIGHT_WRIST, PoseLandmarkIndex.RIGHT_THUMB],
  [PoseLandmarkIndex.RIGHT_INDEX, PoseLandmarkIndex.RIGHT_PINKY],

  // Left Leg
  [PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.LEFT_KNEE],
  [PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.LEFT_ANKLE],
  [PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.LEFT_HEEL],
  [PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.LEFT_FOOT_INDEX],
  [PoseLandmarkIndex.LEFT_HEEL, PoseLandmarkIndex.LEFT_FOOT_INDEX],

  // Right Leg
  [PoseLandmarkIndex.RIGHT_HIP, PoseLandmarkIndex.RIGHT_KNEE],
  [PoseLandmarkIndex.RIGHT_KNEE, PoseLandmarkIndex.RIGHT_ANKLE],
  [PoseLandmarkIndex.RIGHT_ANKLE, PoseLandmarkIndex.RIGHT_HEEL],
  [PoseLandmarkIndex.RIGHT_ANKLE, PoseLandmarkIndex.RIGHT_FOOT_INDEX],
  [PoseLandmarkIndex.RIGHT_HEEL, PoseLandmarkIndex.RIGHT_FOOT_INDEX],
];

// Body part groups for targeted highlighting
export const BODY_PART_LANDMARKS = {
  head: [
    PoseLandmarkIndex.NOSE,
    PoseLandmarkIndex.LEFT_EYE,
    PoseLandmarkIndex.RIGHT_EYE,
    PoseLandmarkIndex.LEFT_EAR,
    PoseLandmarkIndex.RIGHT_EAR,
    PoseLandmarkIndex.MOUTH_LEFT,
    PoseLandmarkIndex.MOUTH_RIGHT,
  ],
  torso: [
    PoseLandmarkIndex.LEFT_SHOULDER,
    PoseLandmarkIndex.RIGHT_SHOULDER,
    PoseLandmarkIndex.LEFT_HIP,
    PoseLandmarkIndex.RIGHT_HIP,
  ],
  leftArm: [
    PoseLandmarkIndex.LEFT_SHOULDER,
    PoseLandmarkIndex.LEFT_ELBOW,
    PoseLandmarkIndex.LEFT_WRIST,
  ],
  rightArm: [
    PoseLandmarkIndex.RIGHT_SHOULDER,
    PoseLandmarkIndex.RIGHT_ELBOW,
    PoseLandmarkIndex.RIGHT_WRIST,
  ],
  leftLeg: [
    PoseLandmarkIndex.LEFT_HIP,
    PoseLandmarkIndex.LEFT_KNEE,
    PoseLandmarkIndex.LEFT_ANKLE,
  ],
  rightLeg: [
    PoseLandmarkIndex.RIGHT_HIP,
    PoseLandmarkIndex.RIGHT_KNEE,
    PoseLandmarkIndex.RIGHT_ANKLE,
  ],
};
