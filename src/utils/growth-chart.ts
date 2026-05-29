import type { GrowthChartSeriesPoint } from '@/services/growth-chart-api';

export type PatientSex = 'male' | 'female';
export type PercentileKey = 'p3' | 'p15' | 'p50' | 'p85' | 'p97';

export type WHOReferenceSeries = Record<PercentileKey, number[]>;

export type WHOReferenceByMetric = {
  height: WHOReferenceSeries;
  weight: WHOReferenceSeries;
  bmi: WHOReferenceSeries;
};

export type WHOReferenceBySex = Record<PatientSex, WHOReferenceByMetric>;

export const WHO_AGE_MONTHS = [0, 2, 4, 6, 9, 12, 18, 24];

/** BMI (kg/m²) at each WHO checkpoint from paired height/weight percentiles. */
function buildBmiWhoSeries(
  height: WHOReferenceSeries,
  weight: WHOReferenceSeries
): WHOReferenceSeries {
  const keys: PercentileKey[] = ['p3', 'p15', 'p50', 'p85', 'p97'];
  const result = {} as WHOReferenceSeries;

  for (const key of keys) {
    result[key] = height[key].map((heightCm, index) => {
      const weightKg = weight[key][index];
      const meters = heightCm / 100;
      return Math.round((weightKg / (meters * meters)) * 100) / 100;
    });
  }

  return result;
}

const maleHeight: WHOReferenceSeries = {
  p3: [46.3, 54.4, 59.8, 63.3, 67.7, 71.3, 77.7, 82.3],
  p15: [47.5, 55.8, 61.1, 64.8, 69.3, 73.1, 79.4, 84.2],
  p50: [49.9, 58.4, 63.9, 67.6, 72.0, 76.1, 82.3, 87.1],
  p85: [51.8, 60.1, 65.7, 69.5, 74.0, 78.3, 84.6, 89.5],
  p97: [53.4, 61.4, 67.0, 70.9, 75.7, 80.0, 86.3, 91.3],
};

const maleWeight: WHOReferenceSeries = {
  p3: [2.5, 4.5, 5.6, 6.4, 7.3, 7.9, 9.2, 10.5],
  p15: [2.9, 5.0, 6.2, 7.0, 7.9, 8.6, 9.9, 11.3],
  p50: [3.3, 5.6, 7.0, 7.9, 8.9, 9.6, 10.9, 12.2],
  p85: [3.9, 6.4, 7.8, 8.8, 10.0, 10.8, 12.3, 13.8],
  p97: [4.4, 7.0, 8.5, 9.6, 10.8, 11.7, 13.2, 14.9],
};

const femaleHeight: WHOReferenceSeries = {
  p3: [45.6, 53.3, 58.5, 62.0, 66.3, 70.0, 76.2, 81.0],
  p15: [46.8, 54.6, 59.9, 63.4, 67.8, 71.6, 77.8, 82.7],
  p50: [49.1, 57.1, 62.1, 65.7, 70.1, 74.0, 80.7, 85.7],
  p85: [51.0, 58.7, 63.8, 67.6, 72.0, 76.2, 82.8, 87.8],
  p97: [52.5, 60.0, 65.1, 68.9, 73.7, 78.0, 84.5, 89.7],
};

const femaleWeight: WHOReferenceSeries = {
  p3: [2.4, 4.1, 5.1, 5.8, 6.7, 7.3, 8.7, 10.0],
  p15: [2.8, 4.6, 5.7, 6.5, 7.4, 8.0, 9.4, 10.8],
  p50: [3.2, 5.1, 6.4, 7.3, 8.2, 8.9, 10.2, 11.5],
  p85: [3.7, 5.8, 7.2, 8.1, 9.2, 10.0, 11.5, 12.9],
  p97: [4.2, 6.4, 7.8, 8.9, 10.0, 10.9, 12.6, 14.1],
};

export const defaultWhoReference: WHOReferenceBySex = {
  male: {
    height: maleHeight,
    weight: maleWeight,
    bmi: buildBmiWhoSeries(maleHeight, maleWeight),
  },
  female: {
    height: femaleHeight,
    weight: femaleWeight,
    bmi: buildBmiWhoSeries(femaleHeight, femaleWeight),
  },
};

export const percentileMeta: { key: PercentileKey; label: string; color: string }[] = [
  { key: 'p3', label: '3rd', color: '#fca5a5' },
  { key: 'p15', label: '15th', color: '#fdba74' },
  { key: 'p50', label: '50th', color: '#93c5fd' },
  { key: 'p85', label: '85th', color: '#c4b5fd' },
  { key: 'p97', label: '97th', color: '#f9a8d4' },
];

export const PATIENT_SERIES_COLOR = '#00ab55';

export type GrowthChartPoint = {
  x: number;
  y: number;
  recordedAt: string;
  vitalId?: number;
};

export type ChartKind = 'height' | 'weight' | 'bmi';

export const CHART_CONFIG: Record<ChartKind, { title: string; unit: string; yDecimals: number }> = {
  height: { title: 'Height-for-age', unit: 'cm', yDecimals: 0 },
  weight: { title: 'Weight-for-age', unit: 'kg', yDecimals: 1 },
  bmi: { title: 'BMI-for-age', unit: 'kg/m²', yDecimals: 2 },
};

export function chartDisplayTitle(kind: ChartKind): string {
  return CHART_CONFIG[kind].title.toUpperCase();
}

export function normalizePatientSex(gender?: string | null): PatientSex {
  const value = (gender || '').toLowerCase();
  if (value.startsWith('f')) return 'female';
  return 'male';
}

export function formatAgeLabel(months: number): string {
  if (months < 24) return `${months % 1 === 0 ? months : months.toFixed(1)}m`;
  const years = Math.floor(months / 12);
  const rem = Math.round(months % 12);
  return rem ? `${years}y ${rem}m` : `${years}y`;
}

export function toGrowthNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function apiSeriesToChartPoints(series: GrowthChartSeriesPoint[]): GrowthChartPoint[] {
  const points = series.reduce<GrowthChartPoint[]>((acc, point) => {
    const y = toGrowthNumber(point.y);
    if (y == null) return acc;
    acc.push({
      x: point.x,
      y,
      recordedAt: point.recorded_at ?? '',
      vitalId: point.vital_id,
    });
    return acc;
  }, []);

  return points.sort((a, b) => {
    const timeDiff = new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.x - b.x;
  });
}

export function getMaxAgeMonths(points: GrowthChartPoint[], fallback = 24): number {
  if (!points.length) return fallback;
  return Math.max(fallback, ...points.map(p => p.x));
}

export function whoSeriesToPoints(series: number[]): { x: number; y: number }[] {
  return WHO_AGE_MONTHS.map((age, index) => ({
    x: age,
    y: series[index] ?? series[series.length - 1],
  }));
}

function interpolateAtAge(age: number, ages: number[], values: number[]): number {
  if (age <= ages[0]) return values[0];
  if (age >= ages[ages.length - 1]) return values[values.length - 1];

  for (let i = 0; i < ages.length - 1; i += 1) {
    const a0 = ages[i];
    const a1 = ages[i + 1];
    if (age >= a0 && age <= a1) {
      const t = (age - a0) / (a1 - a0);
      return values[i] + t * (values[i + 1] - values[i]);
    }
  }

  return values[values.length - 1];
}

/** Smooth WHO reference curve (linear interpolation between checkpoints). */
export function interpolateWhoSeries(
  values: number[],
  maxMonth: number,
  step = 0.25
): { x: number; y: number }[] {
  const cap = Math.min(Math.max(maxMonth, WHO_AGE_MONTHS[0]), WHO_AGE_MONTHS[WHO_AGE_MONTHS.length - 1]);
  const points: { x: number; y: number }[] = [];

  for (let month = 0; month <= cap + 0.001; month += step) {
    const rounded = Math.round(month * 100) / 100;
    points.push({
      x: rounded,
      y: interpolateAtAge(rounded, WHO_AGE_MONTHS, values),
    });
  }

  return points;
}

/** Evenly spaced age ticks for the x-axis (matches web Apex tickAmount). */
export function buildAgeAxisTicks(xMax: number, tickCount = 9): number[] {
  const max = Math.max(1, Math.ceil(xMax));
  if (max <= tickCount) {
    return Array.from({ length: max + 1 }, (_, i) => i);
  }

  const step = max / (tickCount - 1);
  const ticks: number[] = [];
  for (let i = 0; i < tickCount; i += 1) {
    ticks.push(Math.round(step * i * 10) / 10);
  }
  if (ticks[ticks.length - 1] !== max) {
    ticks[ticks.length - 1] = max;
  }
  return ticks;
}

export function formatAxisAgeLabel(months: number): string {
  if (months < 24) {
    const label = months % 1 === 0 ? String(months) : months.toFixed(1);
    return `${label}M`;
  }
  const years = Math.floor(months / 12);
  const rem = Math.round(months % 12);
  return rem ? `${years}Y ${rem}M` : `${years}Y`;
}

export const Y_AXIS_UNIT: Record<ChartKind, string> = {
  height: 'CM',
  weight: 'KG',
  bmi: 'KG/M²',
};

export function getNearestPercentile(
  value: number,
  reference: WHOReferenceSeries,
  ageMonths: number
): string {
  const index = WHO_AGE_MONTHS.reduce(
    (best, age, i) => {
      const diff = Math.abs(age - ageMonths);
      return diff < best.diff ? { diff, index: i } : best;
    },
    { diff: Infinity, index: 0 }
  ).index;

  return (
    percentileMeta
      .map(item => ({
        label: item.label,
        diff: Math.abs((reference[item.key][index] ?? 0) - value),
      }))
      .sort((a, b) => a.diff - b.diff)[0]?.label ?? '—'
  );
}

export function formatGrowthDateTime(recordedAt: string): string {
  const date = new Date(recordedAt);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatGrowthDate(recordedAt: string): string {
  const date = new Date(recordedAt);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function formatGrowthDob(dateOfBirth: string): string {
  const date = new Date(dateOfBirth);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
