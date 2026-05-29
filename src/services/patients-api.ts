import { getApiBaseUrl } from '@/config/api';

export type Patient = {
  id: number;
  fullname: string;
  age: string;
  address: string;
  tel_or_mobile: string;
  date_created: string;
  email?: string;
  mobile_number?: string;
  gender?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  avatar_url?: string | null;
  date_of_birth_in_words?: string;
  doctor_name?: string;
  blood_type?: string;
  occupation?: string;
  civil_status?: string;
  nationality?: string;
  race?: string;
  religion?: string;
  nickname?: string;
  phil_health_number?: string;
  other_mobile_number?: string;
  tel_no?: string;
  created_by?: string;
};

export type PatientDetail = Patient;

export type PatientsListResponse = {
  patients: Patient[];
  total_records: number;
  current_page: number;
  per_page: number;
};

type PatientsErrorBody = {
  error?: string;
  message?: string;
};

export async function fetchPatients(
  token: string,
  options: { page?: number; perPage?: number; search?: string } = {}
): Promise<PatientsListResponse> {
  const { page = 1, perPage = 20, search = '' } = options;

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (search.trim()) {
    params.set('search', search.trim());
  }

  const response = await fetch(`${getApiBaseUrl()}/api/patients?${params}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  let data: PatientsListResponse & PatientsErrorBody = {} as PatientsListResponse & PatientsErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to load patients.');
  }

  if (!Array.isArray(data.patients)) {
    throw new Error('Unexpected response from server.');
  }

  return data;
}

export async function fetchPatientById(token: string, id: string | number): Promise<PatientDetail> {
  const response = await fetch(`${getApiBaseUrl()}/api/patients/${id}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  let data: PatientDetail & PatientsErrorBody = {} as PatientDetail & PatientsErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to load patient.');
  }

  if (!data.id) {
    throw new Error('Unexpected response from server.');
  }

  return data;
}
