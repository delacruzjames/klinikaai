import { getApiBaseUrl } from '@/config/api';

export type Establishment = {
  id: number;
  name: string;
  address: string;
  establishment_type: string;
  email: string;
  telephone: string;
  mobile: string;
  owner: string;
  operating_hours: string;
  website: string;
  logo: string;
  created_at: string;
  updated_at: string;
};

type EstablishmentErrorBody = {
  error?: string;
  message?: string;
};

export async function fetchCurrentEstablishment(token: string): Promise<Establishment> {
  const response = await fetch(`${getApiBaseUrl()}/api/current_establishment`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  let data: Establishment & EstablishmentErrorBody = {} as Establishment & EstablishmentErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to load establishment.');
  }

  if (!data.name) {
    throw new Error('Unexpected response from server.');
  }

  return data;
}
