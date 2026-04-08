import { getStoredUser } from '../services/api/client';

export function usePremium(): boolean {
  const user = getStoredUser();
  return Boolean(user?.isPremium);
}
