import type { Ionicons } from '@expo/vector-icons';

export type VitalRowKey =
  | 'height_cm'
  | 'weight_kg'
  | 'heart_rate'
  | 'spo2'
  | 'respiratory_rate'
  | 'temperature_c'
  | 'bmi'
  | 'body_surface_area_m2'
  | 'blood_pressure'
  | 'cbg_mg_dl';

export type VitalRowDef = {
  key: VitalRowKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

export const VITAL_ROWS: VitalRowDef[] = [
  { key: 'height_cm', label: 'Height (cm)', icon: 'resize-outline', color: '#3b82f6' },
  { key: 'weight_kg', label: 'Weight (kg)', icon: 'scale-outline', color: '#64748b' },
  { key: 'heart_rate', label: 'Heart Rate (bpm)', icon: 'heart', color: '#ef4444' },
  { key: 'spo2', label: 'Oxygen Saturation (%)', icon: 'water-outline', color: '#0ea5e9' },
  {
    key: 'respiratory_rate',
    label: 'Respiratory Rate (breaths/min)',
    icon: 'pulse-outline',
    color: '#64748b',
  },
  { key: 'temperature_c', label: 'Body Temperature (°C)', icon: 'thermometer-outline', color: '#ef4444' },
  { key: 'bmi', label: 'Body Mass Index', icon: 'stats-chart-outline', color: '#8b5cf6' },
  {
    key: 'body_surface_area_m2',
    label: 'Body Surface Area',
    icon: 'body-outline',
    color: '#3b82f6',
  },
  { key: 'blood_pressure', label: 'Blood Pressure', icon: 'speedometer-outline', color: '#64748b' },
  { key: 'cbg_mg_dl', label: 'Capillary Blood Glucose (mg/dL)', icon: 'medical-outline', color: '#22c55e' },
];

export const MAX_VITAL_COLUMNS = 5;
