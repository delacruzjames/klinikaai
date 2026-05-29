import type { Ionicons } from '@expo/vector-icons';

export type MedicalHistoryKind =
  | 'past_medical_history'
  | 'family_history'
  | 'allergies'
  | 'operational_procedure';

export const MEDICAL_HISTORY_KINDS: MedicalHistoryKind[] = [
  'past_medical_history',
  'family_history',
  'allergies',
  'operational_procedure',
];

export const MEDICAL_HISTORY_LABELS: Record<MedicalHistoryKind, string> = {
  past_medical_history: 'Past Medical History',
  family_history: 'Family History',
  allergies: 'Allergies',
  operational_procedure: 'OR Procedures',
};

export const MEDICAL_HISTORY_SHORT_LABELS: Record<MedicalHistoryKind, string> = {
  past_medical_history: 'Past medical',
  family_history: 'Family',
  allergies: 'Allergies',
  operational_procedure: 'Procedures',
};

export const MEDICAL_HISTORY_META: Record<
  MedicalHistoryKind,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  past_medical_history: { icon: 'medical-outline', color: '#3b82f6' },
  family_history: { icon: 'people-outline', color: '#8b5cf6' },
  allergies: { icon: 'warning-outline', color: '#f59e0b' },
  operational_procedure: { icon: 'cut-outline', color: '#64748b' },
};

export function emptyMedicalHistoryGrouped(): Record<MedicalHistoryKind, MedicalHistoryItem[]> {
  return {
    past_medical_history: [],
    family_history: [],
    allergies: [],
    operational_procedure: [],
  };
}

export type MedicalHistoryItem = {
  id: number;
  kind: MedicalHistoryKind;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MedicalHistoryGrouped = Record<MedicalHistoryKind, MedicalHistoryItem[]>;
