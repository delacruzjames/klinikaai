import * as SecureStore from 'expo-secure-store';

const KEYS = {
  token: 'auth_token',
  email: 'auth_email',
  establishmentId: 'auth_establishment_id',
  subDomain: 'auth_sub_domain',
} as const;

export type StoredSession = {
  token: string;
  email: string;
  establishmentId: string;
  subDomain: string;
};

export async function saveSession(session: StoredSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.token, session.token),
    SecureStore.setItemAsync(KEYS.email, session.email),
    SecureStore.setItemAsync(KEYS.establishmentId, session.establishmentId),
    SecureStore.setItemAsync(KEYS.subDomain, session.subDomain),
  ]);
}

export async function loadSession(): Promise<StoredSession | null> {
  const [token, email, establishmentId, subDomain] = await Promise.all([
    SecureStore.getItemAsync(KEYS.token),
    SecureStore.getItemAsync(KEYS.email),
    SecureStore.getItemAsync(KEYS.establishmentId),
    SecureStore.getItemAsync(KEYS.subDomain),
  ]);

  if (!token || !email || !establishmentId || !subDomain) {
    return null;
  }

  return { token, email, establishmentId, subDomain };
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.token),
    SecureStore.deleteItemAsync(KEYS.email),
    SecureStore.deleteItemAsync(KEYS.establishmentId),
    SecureStore.deleteItemAsync(KEYS.subDomain),
  ]);
}
