import { getApiBaseUrl } from '@/config/api';
import type { Vital } from '@/services/patients-api';

export type ConsultationFollowUp = {
  date: string;
  status: string;
} | null;

export type ConsultationAttachment = {
  id: number;
  url: string | null;
  custom_filename: string | null;
};

export type Consultation = {
  id: number;
  date: string | null;
  complaints: string | null;
  clinical_findings: string | null;
  medication: string | null;
  diagnosis: string | null;
  patient_fullname: string | null;
  branch_name: string | null;
  patient_id: number;
  date_created: string | null;
  latest_follow_up: ConsultationFollowUp;
};

export type ConsultationDetail = Consultation & {
  hpi: string | null;
  remarks: string | null;
  plan_treatment: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  vital: Vital | null;
  attachments: ConsultationAttachment[];
};

export type ConsultationsListResponse = {
  medical_histories: Consultation[];
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

function normalizeConsultation(raw: Record<string, unknown>): Consultation | null {
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;

  const followUp = raw.latest_follow_up;
  let latest_follow_up: ConsultationFollowUp = null;
  if (followUp && typeof followUp === 'object') {
    const fu = followUp as Record<string, unknown>;
    latest_follow_up = {
      date: String(fu.date ?? ''),
      status: String(fu.status ?? ''),
    };
  }

  return {
    id,
    date: raw.date != null ? String(raw.date) : null,
    complaints: raw.complaints != null ? String(raw.complaints) : null,
    clinical_findings: raw.clinical_findings != null ? String(raw.clinical_findings) : null,
    medication: raw.medication != null ? String(raw.medication) : null,
    diagnosis: raw.diagnosis != null ? String(raw.diagnosis) : null,
    patient_fullname: raw.patient_fullname != null ? String(raw.patient_fullname) : null,
    branch_name: raw.branch_name != null ? String(raw.branch_name) : null,
    patient_id: Number(raw.patient_id),
    date_created: raw.date_created != null ? String(raw.date_created) : null,
    latest_follow_up,
  };
}

function normalizeVital(raw: unknown): Vital | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const id = Number(v.id);
  if (!Number.isFinite(id)) return null;

  const systolic = v.systolic != null ? Number(v.systolic) : null;
  const diastolic = v.diastolic != null ? Number(v.diastolic) : null;
  let blood_pressure: string | null =
    v.blood_pressure != null ? String(v.blood_pressure) : null;
  if (!blood_pressure && systolic != null && diastolic != null) {
    blood_pressure = `${systolic}/${diastolic}`;
  }

  return {
    id,
    recorded_at: v.recorded_at != null ? String(v.recorded_at) : '',
    height_cm: v.height_cm != null ? Number(v.height_cm) : null,
    weight_kg: v.weight_kg != null ? Number(v.weight_kg) : null,
    bmi: v.bmi != null ? Number(v.bmi) : null,
    body_surface_area_m2:
      v.body_surface_area_m2 != null ? Number(v.body_surface_area_m2) : null,
    heart_rate: v.heart_rate != null ? Number(v.heart_rate) : null,
    respiratory_rate: v.respiratory_rate != null ? Number(v.respiratory_rate) : null,
    temperature_c: v.temperature_c != null ? Number(v.temperature_c) : null,
    spo2: v.spo2 != null ? Number(v.spo2) : null,
    cbg_mg_dl: v.cbg_mg_dl != null ? Number(v.cbg_mg_dl) : null,
    systolic: Number.isFinite(systolic) ? systolic : null,
    diastolic: Number.isFinite(diastolic) ? diastolic : null,
    blood_pressure,
    notes: v.notes != null ? String(v.notes) : null,
  };
}

function normalizeAttachments(raw: unknown): ConsultationAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map(item => {
      const id = Number(item.id);
      if (!Number.isFinite(id)) return null;
      return {
        id,
        url: item.url != null ? String(item.url) : null,
        custom_filename:
          item.custom_filename != null ? String(item.custom_filename) : null,
      };
    })
    .filter((item): item is ConsultationAttachment => item != null);
}

function normalizeConsultationDetail(raw: Record<string, unknown>): ConsultationDetail | null {
  const base = normalizeConsultation(raw);
  if (!base) return null;

  return {
    ...base,
    hpi: raw.hpi != null ? String(raw.hpi) : null,
    remarks: raw.remarks != null ? String(raw.remarks) : null,
    plan_treatment: raw.plan_treatment != null ? String(raw.plan_treatment) : null,
    subjective: raw.subjective != null ? String(raw.subjective) : null,
    objective: raw.objective != null ? String(raw.objective) : null,
    assessment: raw.assessment != null ? String(raw.assessment) : null,
    vital: normalizeVital(raw.vital),
    attachments: normalizeAttachments(raw.attachments),
  };
}

function normalizeList(raw: unknown): Consultation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map(normalizeConsultation)
    .filter((item): item is Consultation => item != null);
}

/** GET /api/consultations — establishment-wide list (paginated). */
export async function fetchConsultations(
  token: string,
  options: { page?: number; perPage?: number; search?: string } = {}
): Promise<ConsultationsListResponse> {
  const { page = 1, perPage = 10, search = '' } = options;
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (search.trim()) params.set('search', search.trim());

  const response = await fetch(`${getApiBaseUrl()}/api/consultations?${params}`, {
    headers: authHeaders(token),
  });

  let data: ConsultationsListResponse & ErrorBody = {} as ConsultationsListResponse & ErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to load consultations.');
  }

  return {
    medical_histories: normalizeList(data.medical_histories),
    total_records: Number(data.total_records) || 0,
    current_page: Number(data.current_page) || page,
    per_page: Number(data.per_page) || perPage,
  };
}

/** GET /api/patients/:id/medical_histories — patient consultations. */
export async function fetchPatientConsultations(
  token: string,
  patientId: string | number
): Promise<Consultation[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/patients/${patientId}/medical_histories`, {
    headers: authHeaders(token),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const err = data as ErrorBody;
    throw new Error(err?.error || err?.message || 'Failed to load consultations.');
  }

  return normalizeList(data);
}

/** POST /api/patients/:id/medical_histories/search */
export async function searchPatientConsultations(
  token: string,
  patientId: string | number,
  search: string
): Promise<Consultation[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/patients/${patientId}/medical_histories/search`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ search: search.trim() }),
    }
  );

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const err = data as ErrorBody;
    throw new Error(err?.error || err?.message || 'Failed to search consultations.');
  }

  return normalizeList(data);
}

/** GET /api/patients/:patientId/medical_histories/:id — single consultation. */
export async function fetchConsultationById(
  token: string,
  patientId: string | number,
  consultationId: string | number
): Promise<ConsultationDetail> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/patients/${patientId}/medical_histories/${consultationId}`,
    { headers: authHeaders(token) }
  );

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const err = data as ErrorBody;
    throw new Error(err?.error || err?.message || 'Failed to load consultation.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Unexpected response from server.');
  }

  const consultation = normalizeConsultationDetail(data as Record<string, unknown>);
  if (!consultation) {
    throw new Error('Unexpected response from server.');
  }

  return consultation;
}
