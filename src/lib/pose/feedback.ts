// Kinezi-AI Feedback Engine
// Manages debounced real-time feedback with priority queuing

import { FormFeedback } from './types';

const DEBOUNCE_MS = 3000; // Don't repeat same feedback within 3 seconds
const MAX_CONCURRENT_FEEDBACKS = 2; // Max feedbacks shown at once

interface FeedbackState {
  lastFeedbacks: Map<string, number>; // feedbackId -> timestamp
  activeFeedbacks: FormFeedback[];
}

let state: FeedbackState = {
  lastFeedbacks: new Map(),
  activeFeedbacks: [],
};

/**
 * Process raw feedbacks from exercise analyzer.
 * Applies debouncing and priority filtering.
 */
export function processFeedbacks(rawFeedbacks: FormFeedback[]): FormFeedback[] {
  const now = Date.now();

  // Filter out recently shown feedbacks (debounce)
  const freshFeedbacks = rawFeedbacks.filter((fb) => {
    const lastShown = state.lastFeedbacks.get(fb.id);
    if (lastShown && now - lastShown < DEBOUNCE_MS) {
      return false;
    }
    return true;
  });

  // Sort by priority (1 = highest)
  freshFeedbacks.sort((a, b) => a.priority - b.priority);

  // Take top N feedbacks
  const selectedFeedbacks = freshFeedbacks.slice(0, MAX_CONCURRENT_FEEDBACKS);

  // Update debounce state
  for (const fb of selectedFeedbacks) {
    state.lastFeedbacks.set(fb.id, now);
  }

  // Clean old entries (older than 10 seconds)
  for (const [key, timestamp] of state.lastFeedbacks) {
    if (now - timestamp > 10000) {
      state.lastFeedbacks.delete(key);
    }
  }

  state.activeFeedbacks = selectedFeedbacks;
  return selectedFeedbacks;
}

/**
 * Get the highest priority feedback for voice output.
 * Only returns error or warning type feedbacks.
 */
export function getVoiceFeedback(feedbacks: FormFeedback[]): FormFeedback | null {
  const voiceFeedbacks = feedbacks.filter(
    (fb) => fb.type === 'error' || fb.type === 'warning'
  );
  return voiceFeedbacks[0] || null;
}

/**
 * Get current active feedbacks.
 */
export function getActiveFeedbacks(): FormFeedback[] {
  return state.activeFeedbacks;
}

/**
 * Reset feedback engine state.
 */
export function resetFeedbackState(): void {
  state = {
    lastFeedbacks: new Map(),
    activeFeedbacks: [],
  };
}

/**
 * Determine the overlay color based on feedbacks.
 * Returns the skeleton color to use.
 */
export function getSkeletonColor(feedbacks: FormFeedback[]): string {
  const hasError = feedbacks.some((fb) => fb.type === 'error');
  const hasWarning = feedbacks.some((fb) => fb.type === 'warning');

  if (hasError) return '#FF3131';   // Red
  if (hasWarning) return '#FFE500'; // Yellow
  return '#00F5FF';                 // Cyan (all good)
}
