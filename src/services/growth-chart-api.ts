import { getApiBaseUrl } from '@/config/api';

export type GrowthChartSeriesPoint = {
  x: number;
  y: string | number;
  recorded_at: string;
  vital_id: number;
};

export type GrowthChartDataPoint = {
  id: number;
  recorded_at: string;
  medical_history_id: number | null;
  age_days: number;
  age_months: number;
  age_years: number;
  height_cm: string | number | null;
  weight_kg: string | number | null;
  bmi: string | number | null;
  body_surface_area_m2: string | number | null;
  head_circumference_cm: string | number | null;
  height_velocity_cm_per_month: number | null;
  weight_velocity_kg_per_month: number | null;
  bmi_change_per_month: number | null;
};

export type PatientGrowthChartResponse = {
  patient: {
    id: number;
    fullname: string;
    gender: string;
    date_of_birth: string;
    current_age_days: number;
    current_age_months: number;
    current_age_years: number;
  };
  summary: {
    total_measurements: number;
    first_recorded_at: string | null;
    last_recorded_at: string | null;
    latest_height_cm: string | number | null;
    latest_weight_kg: string | number | null;
    latest_bmi: string | number | null;
    latest_age_months: number | null;
  };
  data_points: GrowthChartDataPoint[];
  series: {
    height_for_age: GrowthChartSeriesPoint[];
    weight_for_age: GrowthChartSeriesPoint[];
    bmi_for_age: GrowthChartSeriesPoint[];
  };
};

type ErrorBody = {
  error?: string;
  message?: string;
};

/** GET /api/patients/:id/vitals — growth chart payload (not general vitals list). */
export async function fetchPatientGrowthChart(
  token: string,
  patientId: string | number
): Promise<PatientGrowthChartResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/patients/${patientId}/vitals`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  let data: PatientGrowthChartResponse & ErrorBody = {} as PatientGrowthChartResponse & ErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to load growth chart.');
  }

  if (!data.patient?.id) {
    throw new Error('Unexpected response from server.');
  }

  return data;
}
