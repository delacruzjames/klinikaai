import { getApiBaseUrl } from '@/config/api';

export type ConsultationVital = {
  systolic?: number;
  diastolic?: number;
  blood_pressure?: string;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature_c?: number;
  spo2?: number;
  cbg_mg_dl?: number;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
};

export type ConsultationFollowUp = {
  date?: string;
  status?: string;
};

export type PrescriptionItemSummary = {
  medicine_name?: string;
  generic_name?: string;
  strength?: string;
  sig?: string;
};

export type ConsultationPrescription = {
  prescription_items?: PrescriptionItemSummary[];
};

export type ConsultationRecord = {
  id: number;
  date?: string;
  complaints?: string;
  clinical_findings?: string;
  medication?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan_treatment?: string;
  hpi?: string;
  remarks?: string;
  diagnosis?: string;
  branch_name?: string;
  date_created?: string;
  vital?: ConsultationVital | null;
  latest_follow_up?: ConsultationFollowUp | null;
  prescription?: ConsultationPrescription | null;
};

export type ConsultationTimelineEntry = {
  date?: string;
  summary?: string;
  key_findings?: string;
  consultation_id?: number;
};

export type ConsultationAiPrefill = {
  clinical_summary?: string | null;
  consultation_timeline?: ConsultationTimelineEntry[];
  suggested_prefill?: Record<string, string>;
};

export type ConsultationPrefillResponse = {
  success: boolean;
  error?: string | null;
  consultation_records: ConsultationRecord[];
  total_consultations: number;
  current_vital?: Record<string, unknown> | null;
  ai: ConsultationAiPrefill;
};

type ConsultationSummaryCacheResponse = ConsultationPrefillResponse & {
  cache_status?: 'ready' | 'pending' | 'failed' | 'idle';
  message?: string;
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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function normalizePrefillResponse(data: Record<string, unknown>): ConsultationPrefillResponse {
  return {
    success: Boolean(data.success ?? true),
    error: (data.error as string) ?? null,
    consultation_records: (data.consultation_records as ConsultationRecord[]) ?? [],
    total_consultations: Number(data.total_consultations ?? 0),
    current_vital: (data.current_vital as Record<string, unknown>) ?? null,
    ai: (data.ai as ConsultationAiPrefill) ?? {},
  };
}

/** GET /api/visits/:visitId/consultation_summary (200 ready, 202 pending). */
export async function fetchVisitConsultationSummary(
  token: string,
  visitId: number
): Promise<ConsultationSummaryCacheResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/visits/${visitId}/consultation_summary`, {
    headers: authHeaders(token),
  });

  let data: ConsultationSummaryCacheResponse & ErrorBody = {} as ConsultationSummaryCacheResponse &
    ErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON
  }

  if (response.status !== 200 && response.status !== 202) {
    throw new Error(data.error || data.message || 'Failed to load consultation summary.');
  }

  return data;
}

/** Polls until cache_status is ready or attempts exhausted. */
export async function loadVisitConsultationSummaryWithPoll(
  token: string,
  visitId: number,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<ConsultationPrefillResponse> {
  const maxAttempts = options?.maxAttempts ?? 30;
  const intervalMs = options?.intervalMs ?? 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await fetchVisitConsultationSummary(token, visitId);

    if (result.cache_status === 'ready') {
      return normalizePrefillResponse(result as unknown as Record<string, unknown>);
    }

    if (result.cache_status === 'failed' && attempt >= maxAttempts - 1) {
      throw new Error(result.error || result.message || 'Consultation summary generation failed.');
    }

    await sleep(intervalMs);
  }

  throw new Error('Consultation summary is still generating. Please try again shortly.');
}
