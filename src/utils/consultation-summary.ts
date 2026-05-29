import type {
  ConsultationRecord,
  ConsultationVital,
} from '@/services/consultation-summary-api';

export const EMPTY = '—';

export type VitalChip = { label: string; value: string };

export type DetailedVisit = {
  id: number;
  dateLabel: string;
  branch?: string;
  complaints: string;
  hpi: string;
  subjective: string;
  objective: string;
  clinicalFindings: string;
  assessment: string;
  diagnosis: string;
  planTreatment: string;
  medication: string;
  remarks: string;
  rxItems: string[];
  vitalsChips: VitalChip[];
  followUp: string;
};

export function stripHtml(html?: string | null): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type VitalLike = ConsultationVital | Record<string, unknown> | null | undefined;

export function vitalsToChips(vital: VitalLike): VitalChip[] {
  if (!vital) return [];

  const chips: VitalChip[] = [];
  const bp =
    vital.blood_pressure ||
    (vital.systolic != null && vital.diastolic != null
      ? `${vital.systolic}/${vital.diastolic}`
      : null);

  if (bp) chips.push({ label: 'BP', value: String(bp) });
  if (vital.heart_rate != null) chips.push({ label: 'HR', value: String(vital.heart_rate) });
  if (vital.respiratory_rate != null) {
    chips.push({ label: 'RR', value: String(vital.respiratory_rate) });
  }
  if (vital.temperature_c != null) {
    chips.push({ label: 'Temp', value: `${vital.temperature_c}°C` });
  }
  if (vital.spo2 != null) chips.push({ label: 'SpO₂', value: `${vital.spo2}%` });
  if (vital.cbg_mg_dl != null) chips.push({ label: 'CBG', value: `${vital.cbg_mg_dl} mg/dL` });
  if (vital.weight_kg != null) chips.push({ label: 'Weight', value: `${vital.weight_kg} kg` });
  if (vital.height_cm != null) chips.push({ label: 'Height', value: `${vital.height_cm} cm` });
  if (vital.bmi != null) chips.push({ label: 'BMI', value: String(vital.bmi) });

  return chips;
}

function field(raw?: string | null): string {
  const text = stripHtml(raw);
  return text || EMPTY;
}

function rxItemsFromRecord(record: ConsultationRecord): string[] {
  const items = record.prescription?.prescription_items ?? [];
  return items
    .map(item => {
      const name = item.medicine_name || item.generic_name || 'Medication';
      const strength = item.strength ? ` ${item.strength}` : '';
      const sig = item.sig;
      return sig ? `${name}${strength} — ${sig}` : `${name}${strength}`;
    })
    .filter(Boolean);
}

export function toDetailedVisit(record: ConsultationRecord): DetailedVisit {
  const vitalsChips = vitalsToChips(record.vital);
  const followUp = record.latest_follow_up;
  let followUpLabel = '';
  if (followUp?.date) {
    followUpLabel = `${followUp.date}${followUp.status ? ` (${followUp.status})` : ''}`;
  }

  return {
    id: record.id,
    dateLabel: record.date || record.date_created || '—',
    branch: record.branch_name || undefined,
    complaints: field(record.complaints),
    hpi: field(record.hpi),
    subjective: field(record.subjective),
    objective: field(record.objective),
    clinicalFindings: field(record.clinical_findings),
    assessment: field(record.assessment),
    diagnosis: field(record.diagnosis),
    planTreatment: field(record.plan_treatment),
    medication: field(record.medication),
    remarks: field(record.remarks),
    rxItems: rxItemsFromRecord(record),
    vitalsChips,
    followUp: followUpLabel,
  };
}

export function buildAtAGlanceSummary(
  clinicalSummary: string | null | undefined,
  visits: DetailedVisit[]
): string {
  if (clinicalSummary?.trim()) return stripHtml(clinicalSummary);

  if (visits.length === 0) {
    return 'No prior consultations on file. This appears to be a first visit.';
  }

  const latest = visits[0];
  const presenting =
    latest.complaints !== EMPTY
      ? latest.complaints
      : latest.hpi !== EMPTY
        ? latest.hpi
        : latest.subjective;

  const parts = [
    `Last seen ${latest.dateLabel}: ${presenting}.`,
    latest.diagnosis !== EMPTY ? `Diagnosis: ${latest.diagnosis}.` : null,
    latest.assessment !== EMPTY && latest.diagnosis === EMPTY
      ? `Assessment: ${latest.assessment}.`
      : null,
    latest.planTreatment !== EMPTY ? `Plan: ${latest.planTreatment}.` : null,
    latest.medication !== EMPTY && latest.planTreatment === EMPTY
      ? `Medication: ${latest.medication}.`
      : null,
  ].filter(Boolean) as string[];

  if (visits.length > 1) {
    parts.push(`${visits.length - 1} earlier visit${visits.length > 2 ? 's' : ''} documented below.`);
  }

  return parts.join(' ');
}

export function hasVisitContent(visit: DetailedVisit): boolean {
  return (
    [
      visit.complaints,
      visit.hpi,
      visit.subjective,
      visit.objective,
      visit.clinicalFindings,
      visit.assessment,
      visit.diagnosis,
      visit.planTreatment,
      visit.medication,
      visit.remarks,
    ].some(v => v !== EMPTY) ||
    visit.rxItems.length > 0 ||
    visit.vitalsChips.length > 0
  );
}

export function formatSummaryDisplayDate(value?: string): string {
  if (!value) return '—';
  const parsed = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
