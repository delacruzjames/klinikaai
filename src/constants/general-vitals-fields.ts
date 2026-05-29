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

/** Matches web general vitals form (excludes auto-calculated BMI/BSA). */
export const GENERAL_VITALS_FIELDS: GeneralVitalsField[] = [
  { key: 'height_cm', label: 'Height (cm)', keyboardType: 'decimal-pad' },
  { key: 'weight_kg', label: 'Weight (kg)', keyboardType: 'decimal-pad' },
  { key: 'heart_rate', label: 'Heart Rate (bpm)', keyboardType: 'decimal-pad' },
  { key: 'spo2', label: 'Oxygen Saturation (%)', keyboardType: 'decimal-pad' },
  {
    key: 'respiratory_rate',
    label: 'Respiratory Rate (breaths/min)',
    keyboardType: 'decimal-pad',
  },
  { key: 'temperature_c', label: 'Body Temperature (°C)', keyboardType: 'decimal-pad' },
  {
    key: 'blood_pressure',
    label: 'Blood Pressure (e.g. 120/80)',
    placeholder: '120/80',
    keyboardType: 'default',
  },
  {
    key: 'cbg_mg_dl',
    label: 'Capillary Blood Glucose (mg/dL)',
    keyboardType: 'decimal-pad',
  },
];

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
