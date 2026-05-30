export type GeneralVitalsFieldKey =
  | 'height_cm'
  | 'weight_kg'
  | 'heart_rate'
  | 'spo2'
  | 'respiratory_rate'
  | 'temperature_c'
  | 'blood_pressure'
  | 'cbg_mg_dl';

export type GeneralVitalsField = {
  key: GeneralVitalsFieldKey;
  label: string;
  placeholder?: string;
  keyboardType: 'decimal-pad' | 'default';
};

export const GENERAL_VITAL_FIELD_BY_KEY: Record<GeneralVitalsFieldKey, GeneralVitalsField> = {
  height_cm: { key: 'height_cm', label: 'Height (cm)', keyboardType: 'decimal-pad' },
  weight_kg: { key: 'weight_kg', label: 'Weight (kg)', keyboardType: 'decimal-pad' },
  blood_pressure: {
    key: 'blood_pressure',
    label: 'Blood pressure',
    placeholder: '120/80',
    keyboardType: 'default',
  },
  heart_rate: { key: 'heart_rate', label: 'Heart rate (bpm)', keyboardType: 'decimal-pad' },
  respiratory_rate: {
    key: 'respiratory_rate',
    label: 'Resp. rate (breaths/min)',
    keyboardType: 'decimal-pad',
  },
  temperature_c: {
    key: 'temperature_c',
    label: 'Temperature (°C)',
    keyboardType: 'decimal-pad',
  },
  spo2: { key: 'spo2', label: 'SpO₂ (%)', keyboardType: 'decimal-pad' },
  cbg_mg_dl: {
    key: 'cbg_mg_dl',
    label: 'Blood glucose (mg/dL)',
    keyboardType: 'decimal-pad',
  },
};

/** Tablet rows: 3 + 3 + 2 — aligned 3-column grid. */
export const GENERAL_VITALS_ROWS: GeneralVitalsFieldKey[][] = [
  ['height_cm', 'weight_kg', 'blood_pressure'],
  ['heart_rate', 'respiratory_rate', 'temperature_c'],
  ['spo2', 'cbg_mg_dl'],
];

export const GENERAL_VITALS_FIELDS: GeneralVitalsField[] = GENERAL_VITALS_ROWS.flat().map(
  key => GENERAL_VITAL_FIELD_BY_KEY[key]
);

export type GeneralVitalsFormValues = Record<
  GeneralVitalsFieldKey | 'chief_complaint',
  string
>;

export function emptyGeneralVitalsForm(): GeneralVitalsFormValues {
  return {
    height_cm: '',
    weight_kg: '',
    heart_rate: '',
    spo2: '',
    respiratory_rate: '',
    temperature_c: '',
    blood_pressure: '',
    cbg_mg_dl: '',
    chief_complaint: '',
  };
}
