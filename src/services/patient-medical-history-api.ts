import { getApiBaseUrl } from '@/config/api';
import type {
  MedicalHistoryGrouped,
  MedicalHistoryItem,
  MedicalHistoryKind,
} from '@/constants/medical-history';
import { emptyMedicalHistoryGrouped } from '@/constants/medical-history';

export type { MedicalHistoryGrouped };

type GroupedResponse = {
  patient_medical_histories: MedicalHistoryGrouped;
};

type ItemResponse = {
  patient_medical_history: MedicalHistoryItem;
};

type ErrorBody = {
  error?: string;
  message?: string;
  errors?: string[];
};

function authHeaders(token: string) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function basePath(patientId: string | number) {
  return `${getApiBaseUrl()}/api/v1/patients/${patientId}/patient_medical_histories`;
}

function normalizeGrouped(raw: unknown): MedicalHistoryGrouped {
  const grouped = emptyMedicalHistoryGrouped();
  if (!raw || typeof raw !== 'object') return grouped;

  const source = raw as Record<string, unknown>;
  for (const kind of Object.keys(grouped) as MedicalHistoryKind[]) {
    const items = source[kind];
    if (!Array.isArray(items)) continue;
    grouped[kind] = items
      .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
      .map(item => ({
        id: Number(item.id),
        kind,
        notes: item.notes != null ? String(item.notes) : null,
        created_at: String(item.created_at ?? ''),
        updated_at: String(item.updated_at ?? ''),
      }))
      .filter(item => Number.isFinite(item.id));
  }

  return grouped;
}

export async function fetchPatientMedicalHistories(
  token: string,
  patientId: string | number
): Promise<MedicalHistoryGrouped> {
  const response = await fetch(basePath(patientId), {
    headers: authHeaders(token),
  });

  let data: GroupedResponse & ErrorBody = {} as GroupedResponse & ErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const msg =
      data.error ||
      data.message ||
      (Array.isArray(data.errors) ? data.errors.join(', ') : undefined) ||
      'Failed to load medical history.';
    throw new Error(msg);
  }

  return normalizeGrouped(data.patient_medical_histories);
}

export async function createPatientMedicalHistory(
  token: string,
  patientId: string | number,
  kind: MedicalHistoryKind,
  notes: string
): Promise<MedicalHistoryItem> {
  const response = await fetch(basePath(patientId), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ patient_medical_history: { kind, notes } }),
  });

  let data: ItemResponse & ErrorBody = {} as ItemResponse & ErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const msg =
      data.error ||
      data.message ||
      (Array.isArray(data.errors) ? data.errors.join(', ') : undefined) ||
      'Failed to create medical history.';
    throw new Error(msg);
  }

  const item = data.patient_medical_history;
  if (!item?.id) throw new Error('Unexpected response from server.');
  return { ...item, kind: item.kind ?? kind };
}

export async function updatePatientMedicalHistory(
  token: string,
  patientId: string | number,
  id: number,
  notes: string
): Promise<MedicalHistoryItem> {
  const response = await fetch(`${basePath(patientId)}/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ patient_medical_history: { notes } }),
  });

  let data: ItemResponse & ErrorBody = {} as ItemResponse & ErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const msg =
      data.error ||
      data.message ||
      (Array.isArray(data.errors) ? data.errors.join(', ') : undefined) ||
      'Failed to update medical history.';
    throw new Error(msg);
  }

  const item = data.patient_medical_history;
  if (!item?.id) throw new Error('Unexpected response from server.');
  return item;
}

export async function deletePatientMedicalHistory(
  token: string,
  patientId: string | number,
  id: number
): Promise<void> {
  const response = await fetch(`${basePath(patientId)}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let data: ErrorBody = {};
    try {
      data = await response.json();
    } catch {
      // Non-JSON response
    }
    throw new Error(data.error || data.message || 'Failed to delete medical history.');
  }
}
