// Kinezi-AI Speech Engine
// Text-to-speech wrapper for real-time voice feedback during exercises

import * as Speech from 'expo-speech';
import { FormFeedback } from './pose/types';

const VOICE_DEBOUNCE_MS = 4000; // Min time between voice feedbacks
let lastVoiceTime = 0;
let isSpeaking = false;

/**
 * Speak a message using device TTS.
 * Uses Turkish by default.
 */
export async function speak(
  text: string,
  options?: {
    language?: string;
    rate?: number;
    pitch?: number;
  }
): Promise<void> {
  if (isSpeaking) return;

  const now = Date.now();
  if (now - lastVoiceTime < VOICE_DEBOUNCE_MS) return;

  isSpeaking = true;
  lastVoiceTime = now;

  return new Promise((resolve) => {
    Speech.speak(text, {
      language: options?.language || 'tr-TR',
      rate: options?.rate || 1.0,
      pitch: options?.pitch || 1.0,
      onDone: () => {
        isSpeaking = false;
        resolve();
      },
      onError: () => {
        isSpeaking = false;
        resolve();
      },
    });
  });
}

/**
 * Speak form feedback in Turkish.
 */
export function speakFeedback(feedback: FormFeedback): void {
  if (feedback.type === 'success') {
    // Lower volume/priority for success messages
    speak(feedback.messageTr, { rate: 0.95 });
  } else {
    // Urgent tone for errors
    speak(feedback.messageTr, { rate: 1.1, pitch: 1.1 });
  }
}

/**
 * Speak rep count.
 */
export function speakRepCount(count: number): void {
  const turkishNumbers: Record<number, string> = {
    1: 'Bir!',
    2: 'İki!',
    3: 'Üç!',
    4: 'Dört!',
    5: 'Beş!',
    6: 'Altı!',
    7: 'Yedi!',
    8: 'Sekiz!',
    9: 'Dokuz!',
    10: 'On!',
    11: 'On bir!',
    12: 'On iki!',
    13: 'On üç!',
    14: 'On dört!',
    15: 'On beş!',
  };

  const text = turkishNumbers[count] || `${count}!`;
  speak(text, { rate: 1.2, pitch: 1.0 });
}

/**
 * Speak countdown.
 */
export async function speakCountdown(): Promise<void> {
  await speak('Üç', { rate: 0.9 });
  await new Promise((r) => setTimeout(r, 1000));
  await speak('İki', { rate: 0.9 });
  await new Promise((r) => setTimeout(r, 1000));
  await speak('Bir', { rate: 0.9 });
  await new Promise((r) => setTimeout(r, 1000));
  await speak('Başla!', { rate: 1.1, pitch: 1.2 });
}

/**
 * Speak set completion.
 */
export function speakSetComplete(setNumber: number, totalSets: number): void {
  if (setNumber >= totalSets) {
    speak('Antrenman tamamlandı! Harika iş!', { rate: 1.0, pitch: 1.1 });
  } else {
    speak(`Set ${setNumber} tamamlandı. Dinlen.`, { rate: 1.0 });
  }
}

/**
 * Speak workout summary.
 */
export function speakSummary(score: number, reps: number): void {
  let scoreText = '';
  if (score >= 90) scoreText = 'Mükemmel performans!';
  else if (score >= 75) scoreText = 'İyi iş çıkardın!';
  else if (score >= 60) scoreText = 'Fena değil, gelişmeye devam.';
  else scoreText = 'Formuna dikkat etmelisin.';

  speak(`${reps} tekrar tamamlandı. Skor: ${score}. ${scoreText}`, { rate: 0.95 });
}

/**
 * Stop any ongoing speech.
 */
export function stopSpeaking(): void {
  Speech.stop();
  isSpeaking = false;
}

/**
 * Check if TTS is currently speaking.
 */
export function getIsSpeaking(): boolean {
  return isSpeaking;
}
