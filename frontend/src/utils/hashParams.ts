/** Strip query string from hash, e.g. '#feedback-result?id=1' → '#feedback-result' */
export function getHashPath(): string {
  return window.location.hash.split('?')[0];
}

/** Read all query params from the hash query string */
export function getHashParams(): URLSearchParams {
  return new URLSearchParams(window.location.hash.split('?')[1] || '');
}

/** Read a single param from the hash query string */
export function getHashParam(key: string): string | null {
  return getHashParams().get(key);
}

/** Navigate to a hash path with optional params */
export function navigateTo(path: string, params?: Record<string, string>): void {
  if (!params || Object.keys(params).length === 0) {
    window.location.hash = path;
    return;
  }
  const search = new URLSearchParams(params).toString();
  window.location.hash = `${path}?${search}`;
}
