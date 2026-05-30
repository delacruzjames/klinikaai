import { getApiBaseUrl } from '@/config/api';

export type TriagePatient = {
  id: number;
  fullname: string;
  age: string | null;
  doctor_name?: string | null;
  date_created?: string | null;
};

export type TriageVisit = {
  id: number;
  walked_in_at: string;
  status: string;
  chief_complaint: string | null;
  patient: TriagePatient;
};

export type TriagesListResponse = {
  visits: TriageVisit[];
  total_records: number;
  current_page: number;
  per_page: number;
};

type ErrorBody = {
  error?: string;
  message?: string;
};

function authHeaders(token: string) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function normalizePatient(raw: unknown): TriagePatient | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const id = Number(p.id);
  if (!Number.isFinite(id)) return null;

  const fullname =
    p.fullname != null
      ? String(p.fullname)
      : [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || '—';

  return {
    id,
    fullname,
    age: p.age != null ? String(p.age) : null,
    doctor_name: p.doctor_name != null ? String(p.doctor_name) : null,
    date_created: p.date_created != null ? String(p.date_created) : null,
  };
}

function normalizeVisit(raw: unknown): TriageVisit | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const id = Number(v.id);
  if (!Number.isFinite(id)) return null;

  const patient = normalizePatient(v.patient);
  if (!patient) return null;

  return {
    id,
    walked_in_at: v.walked_in_at != null ? String(v.walked_in_at) : '',
    status: v.status != null ? String(v.status) : '',
    chief_complaint: v.chief_complaint != null ? String(v.chief_complaint) : null,
    patient,
  };
}

function normalizeList(raw: unknown): TriageVisit[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeVisit)
    .filter((item): item is TriageVisit => item != null);
}

/** GET /api/visits — triage queue (status triage). */
export async function fetchTriages(
  token: string,
  options: { page?: number; perPage?: number; search?: string } = {}
): Promise<TriagesListResponse> {
  const { page = 1, perPage = 10, search = '' } = options;
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (search.trim()) params.set('q', search.trim());

  const response = await fetch(`${getApiBaseUrl()}/api/visits?${params}`, {
    headers: authHeaders(token),
  });

  let data: TriagesListResponse & ErrorBody = {} as TriagesListResponse & ErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to load triage queue.');
  }

  return {
    visits: normalizeList(data.visits),
    total_records: Number(data.total_records) || 0,
    current_page: Number(data.current_page) || page,
    per_page: Number(data.per_page) || perPage,
  };
}

function toNumberOrNull(value: unknown): number | null {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildVisitVitalsPayload(formData: Record<string, string>) {
  const blood_pressure = formData.blood_pressure;
  let systolic: number | null = null;
  let diastolic: number | null = null;

  if (blood_pressure?.trim()) {
    const parts = blood_pressure.split('/');
    if (parts[0]) systolic = toNumberOrNull(parts[0].trim());
    if (parts[1]) diastolic = toNumberOrNull(parts[1].trim());
  }

  const complaint = formData.chief_complaint?.trim();

  return {
    ...(complaint ? { chief_complaint: complaint } : {}),
    vital: {
      recorded_at: new Date().toISOString(),
      height_cm: toNumberOrNull(formData.height_cm),
      weight_kg: toNumberOrNull(formData.weight_kg),
      heart_rate: toNumberOrNull(formData.heart_rate),
      respiratory_rate: toNumberOrNull(formData.respiratory_rate),
      temperature_c: toNumberOrNull(formData.temperature_c),
      spo2: toNumberOrNull(formData.spo2),
      cbg_mg_dl: toNumberOrNull(formData.cbg_mg_dl),
      systolic,
      diastolic,
      notes: null,
      medical_history_id: null,
    },
  };
}

/** POST /api/visits/:visitId/vitals — start triage / record vitals. */
export async function submitVisitVitals(
  token: string,
  visitId: number,
  formData: Record<string, string>
): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/visits/${visitId}/vitals`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(buildVisitVitalsPayload(formData)),
  });

  let data: ErrorBody = {};
  try {
    data = await response.json();
  } catch {
    // Non-JSON
  }

  if (!response.ok) {
    const errors = (data as { errors?: string[] }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
    throw new Error(data.error || data.message || 'Failed to save vitals.');
  }
}
