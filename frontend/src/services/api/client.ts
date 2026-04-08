const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export const ACCESS_TOKEN_KEY = 'stick_access_token';
export const USER_KEY = 'stick_user';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  /** Internal: skip 401-recovery to avoid infinite loop */
  _noRetry?: boolean;
}

export interface ApiErrorShape {
  code?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, payload?: ApiErrorShape) {
    super(payload?.message || `Request failed with status ${status}`);
    this.status = status;
    this.code = payload?.code;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/** True when a non-guest user is signed-in. */
export function isRealUserLoggedIn(): boolean {
  const json = localStorage.getItem(USER_KEY);
  if (!json) return false;
  try {
    const u = JSON.parse(json);
    return u && u.isGuest === false;
  } catch { return false; }
}

export function persistAuth(accessToken: string, user: unknown) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token = getStoredToken(), _noRetry = false } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: typeof body === 'undefined' ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  // 401 recovery: distinguish between guest and real users.
  // – If a real (non-guest) user gets 401, their session expired → redirect to login instead of silently replacing with a guest.
  // – If no user was stored or user was a guest, create a fresh guest session and retry once.
  if (response.status === 401 && !_noRetry && path !== '/auth/firebase/login' && path !== '/auth/register' && path !== '/auth/login') {
    const storedUserJson = localStorage.getItem(USER_KEY);
    let wasRealUser = false;
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson);
        wasRealUser = storedUser && storedUser.isGuest === false;
      } catch { /* ignore parse error */ }
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    if (wasRealUser) {
      // Real user session expired — redirect to login, don't silently degrade to guest
      window.location.hash = '#login';
      throw new ApiError(response.status, { code: 'SESSION_EXPIRED', message: 'Your session has expired. Please sign in again.' });
    }

    try {
      // Lazily import to avoid circular deps at module level
      const { createGuestSession } = await import('./auth');
      const { accessToken } = await createGuestSession();
      return apiRequest<T>(path, { ...options, token: accessToken, _noRetry: true });
    } catch {
      throw new ApiError(response.status, payload as ApiErrorShape);
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, payload as ApiErrorShape);
  }

  return payload as T;
}

