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
  vitals?: Vital[];
};

export type Vital = {
  id: number;
  recorded_at: string;
  height_cm?: number | null;
  weight_kg?: number | null;
  bmi?: number | null;
  body_surface_area_m2?: number | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  temperature_c?: number | null;
  spo2?: number | null;
  cbg_mg_dl?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  blood_pressure?: string | null;
  notes?: string | null;
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

  return {
    ...data,
    vitals: normalizeVitals(data.vitals),
  };
}

/** General vitals list — from GET /api/patients/:id (PatientSerializer with_vitals). */
export async function fetchPatientVitals(
  token: string,
  patientId: string | number
): Promise<Vital[]> {
  const patient = await fetchPatientById(token, patientId);
  return patient.vitals ?? [];
}

function normalizeVitals(raw: unknown): Vital[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map(item => ({
      id: Number(item.id),
      recorded_at: String(item.recorded_at ?? ''),
      height_cm: toNullableNumber(item.height_cm),
      weight_kg: toNullableNumber(item.weight_kg),
      bmi: toNullableNumber(item.bmi),
      body_surface_area_m2: toNullableNumber(item.body_surface_area_m2),
      heart_rate: toNullableNumber(item.heart_rate),
      respiratory_rate: toNullableNumber(item.respiratory_rate),
      temperature_c: toNullableNumber(item.temperature_c),
      spo2: toNullableNumber(item.spo2),
      cbg_mg_dl: toNullableNumber(item.cbg_mg_dl),
      systolic: toNullableNumber(item.systolic),
      diastolic: toNullableNumber(item.diastolic),
      blood_pressure: item.blood_pressure != null ? String(item.blood_pressure) : null,
      notes: item.notes != null ? String(item.notes) : null,
    }))
    .filter(v => Number.isFinite(v.id) && v.recorded_at.length > 0);
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
