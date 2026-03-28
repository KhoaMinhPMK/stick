import { apiRequest } from './client';
import { ensureSession } from './auth';

interface OnboardingStatePatch {
  step?: number;
  level?: string | null;
  schedule?: string | null;
  goal?: string[] | string | null;
  completed?: boolean;
}

export async function saveOnboardingState(patch: OnboardingStatePatch) {
  await ensureSession();
  return apiRequest<{ state: unknown }>('/onboarding/state', {
    method: 'PUT',
    body: patch,
  });
}

