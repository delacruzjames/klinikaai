import { getApiBaseUrl } from '@/config/api';

export type UserProfile = {
  fullname: string;
  email: string;
  type: string;
  position: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string | null;
};

type ProfileErrorBody = {
  error?: string;
  message?: string;
};

export async function fetchUserProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${getApiBaseUrl()}/api/me`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  let data: UserProfile & ProfileErrorBody = {} as UserProfile & ProfileErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to load profile.');
  }

  if (!data.fullname && !data.email) {
    throw new Error('Unexpected profile response from server.');
  }

  return {
    fullname: data.fullname?.trim() || data.email,
    email: data.email,
    type: data.type?.trim() || '',
    position: data.position?.trim() || data.type?.trim() || '',
    first_name: data.first_name,
    last_name: data.last_name,
    profile_picture_url: data.profile_picture_url ?? null,
  };
}
