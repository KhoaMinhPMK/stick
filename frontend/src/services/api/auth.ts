import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { apiRequest, persistAuth, getStoredToken } from './client';

interface AuthResponse {
  accessToken: string;
  guestMerged?: boolean;
  user: {
    id: string;
    name: string;
    email: string | null;
    isGuest: boolean;
  };
}

const GUEST_MERGED_KEY = 'stick_guest_merged';

/** Returns true (and clears the flag) if a guest data merge just happened. */
export function consumeGuestMergedFlag(): boolean {
  const val = sessionStorage.getItem(GUEST_MERGED_KEY);
  if (val) {
    sessionStorage.removeItem(GUEST_MERGED_KEY);
    return true;
  }
  return false;
}

/**
 * Exchange a Firebase ID token for the backend's own access token.
 */
async function exchangeFirebaseToken(idToken: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/firebase/login', {
    method: 'POST',
    body: { idToken },
    token: getStoredToken(),
  });
  persistAuth(response.accessToken, response.user);
  if (response.guestMerged) {
    sessionStorage.setItem(GUEST_MERGED_KEY, '1');
  }
  return response;
}

/**
 * Register with email/password via Firebase, then exchange.
 */
export async function registerWithEmail(input: {
  name: string;
  email: string;
  password: string;
}) {
  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
  // Set display name in Firebase
  await updateProfile(credential.user, { displayName: input.name });
  const idToken = await credential.user.getIdToken();
  return exchangeFirebaseToken(idToken);
}

/**
 * Login with email/password via Firebase, then exchange.
 */
export async function loginWithEmail(input: { email: string; password: string }) {
  const credential = await signInWithEmailAndPassword(auth, input.email, input.password);
  const idToken = await credential.user.getIdToken();
  return exchangeFirebaseToken(idToken);
}

/**
 * Login with Google via Firebase popup, then exchange.
 */
export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  const idToken = await credential.user.getIdToken();
  return exchangeFirebaseToken(idToken);
}

/**
 * Create an anonymous guest session via Firebase, then exchange.
 */
export async function createGuestSession() {
  const credential = await signInAnonymously(auth);
  const idToken = await credential.user.getIdToken();
  return exchangeFirebaseToken(idToken);
}

/**
 * Ensure there is a valid session (creates guest if needed).
 */
export async function ensureSession() {
  const token = getStoredToken();
  if (token) return token;

  const response = await createGuestSession();
  return response.accessToken;
}

/**
 * Logout: clear local storage and sign out from Firebase.
 */
export async function logout() {
  try {
    const token = getStoredToken();
    if (token) {
      await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    }
  } finally {
    localStorage.removeItem('stick_access_token');
    localStorage.removeItem('stick_user');
    await auth.signOut();
  }
}
