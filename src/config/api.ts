const DEFAULT_API_URL = 'http://localhost:3000';

export function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
  return url.replace(/\/$/, '');
}
