import { apiRequest, getStoredToken, persistAuth } from './client';

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    isGuest: boolean;
  };
}

export async function registerWithEmail(input: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });
  persistAuth(response.accessToken, response.user);
  return response;
}

export async function loginWithEmail(input: { email: string; password: string }) {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
  persistAuth(response.accessToken, response.user);
  return response;
}

export async function createGuestSession() {
  const response = await apiRequest<AuthResponse>('/auth/guest', {
    method: 'POST',
  });
  persistAuth(response.accessToken, response.user);
  return response;
}

export async function ensureSession() {
  const token = getStoredToken();
  if (token) return token;

  const response = await createGuestSession();
  return response.accessToken;
}
