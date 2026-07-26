const fs = require('fs');

const baseContent = `// Kinezi-AI Exercise Definitions
// Core exercise library with metadata, rules, and descriptions

export type ExerciseCategory = 'lower_body' | 'upper_body' | 'core' | 'full_body';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type MuscleGroup = 'quads' | 'hamstrings' | 'glutes' | 'chest' | 'back' | 'shoulders' | 'core' | 'arms' | 'calves';

export interface Exercise {
  id: string;
  name: string;
  nameTr: string;
  description: string;
  descriptionTr: string;
  category: ExerciseCategory;
  difficulty: Difficulty;
  muscleGroups: MuscleGroup[];
  icon: string;
  defaultSets: number;
  defaultReps: number;
  restSeconds: number;
  cameraPosition: 'side' | 'front';
  tips: string[];
  tipsTr: string[];
}

export const EXERCISES: Exercise[] = [
  {
    id: 'squat',
    name: 'Squat',
    nameTr: 'Squat',
    description: 'A compound lower body exercise targeting quads, glutes, and hamstrings.',
    descriptionTr: 'Quadriceps, kalça ve hamstring kaslarını hedefleyen temel alt vücut egzersizi.',
    category: 'lower_body',
    difficulty: 'beginner',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'core'],
    icon: '🏋️',
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 60,
    cameraPosition: 'side',
    tips: [
      'Keep your chest up and core engaged',
      'Push your knees out over your toes',
      'Go at least to parallel (90° knee bend)',
      'Keep weight on your heels',
    ],
    tipsTr: [
      'Göğsünüzü yukarıda ve core kaslarınızı aktif tutun',
      'Dizlerinizi ayak parmaklarınızın üzerine doğru itin',
      'En az paralele (90° diz bükümü) kadar inin',
      'Ağırlığı topuklarınızda tutun',
    ],
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    nameTr: 'Deadlift',
    description: 'A posterior chain exercise focusing on back, glutes, and hamstrings.',
    descriptionTr: 'Sırt, kalça ve hamstring kaslarına odaklanan arka zincir egzersizi.',
    category: 'lower_body',
    difficulty: 'intermediate',
    muscleGroups: ['back', 'glutes', 'hamstrings', 'core'],
    icon: '💪',
    defaultSets: 3,
    defaultReps: 8,
    restSeconds: 90,
    cameraPosition: 'side',
    tips: [
      'Keep the bar close to your body',
      'Hinge at the hips, not the lower back',
      'Maintain a neutral spine throughout',
      'Drive through your heels',
    ],
    tipsTr: [
      'Barı vücudunuza yakın tutun',
      'Belden değil, kalçalardan bükülün',
      'Omurganızı nötr pozisyonda tutun',
      'Topuklarınızdan itin',
    ],
  },
  {
    id: 'pushup',
    name: 'Push-Up',
    nameTr: 'Şınav',
    description: 'A classic upper body exercise for chest, shoulders, and triceps.',
    descriptionTr: 'Göğüs, omuz ve triceps kasları için klasik üst vücut egzersizi.',
    category: 'upper_body',
    difficulty: 'beginner',
    muscleGroups: ['chest', 'shoulders', 'arms', 'core'],
    icon: '🫸',
    defaultSets: 3,
    defaultReps: 15,
    restSeconds: 45,
    cameraPosition: 'side',
    tips: [
      'Keep your body in a straight line',
      'Lower until elbows reach 90°',
      'Keep your core tight',
      'Don\\'t let your hips sag',
    ],
    tipsTr: [
      'Vücudunuzu düz bir çizgide tutun',
      'Dirsekleriniz 90°ye ulaşana kadar inin',
      'Core kaslarınızı sıkı tutun',
      'Kalçalarınızın düşmesine izin vermeyin',
    ],
  },
  {
    id: 'lunge',
    name: 'Lunge',
    nameTr: 'Lunge',
    description: 'A unilateral lower body exercise for balance and strength.',
    descriptionTr: 'Denge ve güç için tek taraflı alt vücut egzersizi.',
    category: 'lower_body',
    difficulty: 'beginner',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves'],
    icon: '🦵',
    defaultSets: 3,
    defaultReps: 10,
    restSeconds: 60,
    cameraPosition: 'front',
    tips: [
      'Step far enough forward',
      'Keep your front knee over your ankle',
      'Lower your back knee toward the ground',
      'Keep your torso upright',
    ],
    tipsTr: [
      'Yeterince ileri adım atın',
      'Ön dizinizi bileğinizin üzerinde tutun',
      'Arka dizinizi yere doğru indirin',
      'Gövdenizi dik tutun',
    ],
  },
  {
    id: 'plank',
    name: 'Plank',
    nameTr: 'Plank',
    description: 'An isometric core exercise for stability and endurance.',
    descriptionTr: 'Stabilite ve dayanıklılık için izometrik core egzersizi.',
    category: 'core',
    difficulty: 'beginner',
    muscleGroups: ['core', 'shoulders', 'back'],
    icon: '🧘',
    defaultSets: 3,
    defaultReps: 1,
    restSeconds: 45,
    cameraPosition: 'side',
    tips: [
      'Keep your body in a straight line from head to heels',
      'Engage your core and glutes',
      'Don\\'t let your hips drop or pike up',
      'Breathe steadily',
    ],
    tipsTr: [
      'Baştan topuklara düz bir çizgi oluşturun',
      'Core ve kalça kaslarınızı aktif edin',
      'Kalçalarınızın düşmesine veya yükselmesine izin vermeyin',
      'Düzenli nefes alın',
    ],
  },
`;

const newExercises = fs.readFileSync('/Users/onurardaozcimen/Desktop/mobil proje/kinezi-ai/src/constants/new_exercises.ts', 'utf8');
const newArrayInner = newExercises.split('export const NEW_EXERCISES: Exercise[] = [')[1].split('];')[0];

const footer = `
];

export const CATEGORY_LABELS: Record<ExerciseCategory, { en: string; tr: string }> = {
  lower_body: { en: 'Lower Body', tr: 'Alt Vücut' },
  upper_body: { en: 'Upper Body', tr: 'Üst Vücut' },
  core: { en: 'Core', tr: 'Core' },
  full_body: { en: 'Full Body', tr: 'Tüm Vücut' },
};

export const DIFFICULTY_LABELS: Record<Difficulty, { en: string; tr: string; color: string }> = {
  beginner: { en: 'Beginner', tr: 'Başlangıç', color: '#39FF14' },
  intermediate: { en: 'Intermediate', tr: 'Orta', color: '#FFE500' },
  advanced: { en: 'Advanced', tr: 'İleri', color: '#FF3131' },
};
`;

const finalFile = baseContent + newArrayInner + footer;

fs.writeFileSync('/Users/onurardaozcimen/Desktop/mobil proje/kinezi-ai/src/constants/exercises.ts', finalFile);
