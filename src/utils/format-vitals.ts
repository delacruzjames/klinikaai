import type { VitalRowKey } from '@/constants/vitals-rows';
import type { Vital } from '@/services/patients-api';

export function formatVitalDate(recordedAt: string): string {
  const date = new Date(recordedAt);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatVitalDateShort(recordedAt: string): string {
  const date = new Date(recordedAt);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export type VitalDisplay = {
  primary: string;
  unit: string;
};

export function formatVitalDisplay(
  vital: Vital | undefined,
  key: VitalRowKey
): VitalDisplay | null {
  if (!vital) return null;

  switch (key) {
    case 'height_cm':
      return vital.height_cm != null ? { primary: String(vital.height_cm), unit: 'cm' } : null;
    case 'weight_kg':
      return vital.weight_kg != null ? { primary: String(vital.weight_kg), unit: 'kg' } : null;
    case 'heart_rate':
      return vital.heart_rate != null ? { primary: String(vital.heart_rate), unit: 'bpm' } : null;
    case 'spo2':
      return vital.spo2 != null ? { primary: String(vital.spo2), unit: '%' } : null;
    case 'respiratory_rate':
      return vital.respiratory_rate != null
        ? { primary: String(vital.respiratory_rate), unit: 'breaths/min' }
        : null;
    case 'temperature_c':
      return vital.temperature_c != null ? { primary: String(vital.temperature_c), unit: '°C' } : null;
    case 'bmi':
      return vital.bmi != null ? { primary: String(vital.bmi), unit: 'kg/m²' } : null;
    case 'body_surface_area_m2':
      return vital.body_surface_area_m2 != null
        ? { primary: String(vital.body_surface_area_m2), unit: 'm²' }
        : null;
    case 'blood_pressure': {
      if (vital.blood_pressure?.trim()) {
        return { primary: vital.blood_pressure, unit: 'mmHg' };
      }
      if (vital.systolic != null && vital.diastolic != null) {
        return { primary: `${vital.systolic}/${vital.diastolic}`, unit: 'mmHg' };
      }
      return null;
    }
    case 'cbg_mg_dl':
      return vital.cbg_mg_dl != null ? { primary: String(vital.cbg_mg_dl), unit: 'mg/dL' } : null;
    default:
      return null;
  }
}

export function formatVitalValue(vital: Vital | undefined, key: VitalRowKey): string {
  const display = formatVitalDisplay(vital, key);
  if (!display) return '—';
  return display.unit ? `${display.primary} ${display.unit}` : display.primary;
}

export function sortVitalsNewestFirst(vitals: Vital[]): Vital[] {
  return [...vitals].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
}

export function padVitalColumns(vitals: Vital[], max: number): (Vital | undefined)[] {
  const slots: (Vital | undefined)[] = vitals.slice(0, max);
  while (slots.length < max) slots.push(undefined);
  return slots;
}
