import { getApiBaseUrl } from '@/config/api';

export type QueuePatient = {
  id: number;
  fullname: string;
  age: string | null;
};

export type QueueVisit = {
  id: number;
  walked_in_at: string;
  status: string;
  chief_complaint: string | null;
  consultation_id: number | null;
  patient: QueuePatient;
};

export type QueuesListResponse = {
  queues: QueueVisit[];
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

function normalizePatient(raw: unknown): QueuePatient | null {
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
  };
}

function normalizeQueueVisit(raw: unknown): QueueVisit | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const id = Number(v.id);
  if (!Number.isFinite(id)) return null;

  const patient = normalizePatient(v.patient);
  if (!patient) return null;

  const consultationId = v.consultation_id != null ? Number(v.consultation_id) : null;

  return {
    id,
    walked_in_at: v.walked_in_at != null ? String(v.walked_in_at) : '',
    status: v.status != null ? String(v.status) : '',
    chief_complaint: v.chief_complaint != null ? String(v.chief_complaint) : null,
    consultation_id: Number.isFinite(consultationId) ? consultationId : null,
    patient,
  };
}

function normalizeList(raw: unknown): QueueVisit[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeQueueVisit)
    .filter((item): item is QueueVisit => item != null);
}

/** GET /api/queues — waiting room (status waiting). */
export async function fetchQueues(
  token: string,
  options: { page?: number; perPage?: number } = {}
): Promise<QueuesListResponse> {
  const { page = 1, perPage = 10 } = options;
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  const response = await fetch(`${getApiBaseUrl()}/api/queues?${params}`, {
    headers: authHeaders(token),
  });

  let data: QueuesListResponse & ErrorBody = {} as QueuesListResponse & ErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to load queue.');
  }

  return {
    queues: normalizeList(data.queues),
    total_records: Number(data.total_records) || 0,
    current_page: Number(data.current_page) || page,
    per_page: Number(data.per_page) || perPage,
  };
}

export function hasValidQueueConsultation(visit: QueueVisit): boolean {
  return Boolean(
    visit.consultation_id &&
      visit.chief_complaint &&
      visit.chief_complaint.trim() !== ''
  );
}
