import type { ConsultationAiPrefill } from '@/services/consultation-summary-api';

type CachedPrefill = {
  suggested_prefill: Record<string, string>;
  clinical_summary?: string | null;
};

const cache = new Map<number, CachedPrefill>();

export function saveConsultationPrefillForPatient(patientId: number, ai: ConsultationAiPrefill) {
  if (!ai.suggested_prefill || Object.keys(ai.suggested_prefill).length === 0) return;

  cache.set(patientId, {
    suggested_prefill: ai.suggested_prefill,
    clinical_summary: ai.clinical_summary,
  });
}

export function consumeConsultationPrefillForPatient(patientId: number): CachedPrefill | null {
  const entry = cache.get(patientId);
  if (!entry) return null;
  cache.delete(patientId);
  return entry;
}
