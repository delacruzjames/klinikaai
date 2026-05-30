export function formatTriageDate(walkedInAt: string | null | undefined): string {
  if (!walkedInAt) return '—';
  const date = new Date(walkedInAt);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTriageTime(walkedInAt: string | null | undefined): string {
  if (!walkedInAt) return '—';
  const date = new Date(walkedInAt);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTriageAge(age: string | null | undefined): string {
  if (!age?.trim()) return 'N/A';
  return age.trim();
}

export function formatPatientRef(patientId: number): string {
  return `P-${String(patientId).padStart(6, '0')}`;
}

export function formatQueueIndex(index: number): string {
  return String(index).padStart(3, '0');
}

export function getWaitMinutes(walkedInAt: string | null | undefined): number | null {
  if (!walkedInAt) return null;
  const arrived = new Date(walkedInAt);
  if (Number.isNaN(arrived.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - arrived.getTime()) / 60000));
}

export function formatWaitDuration(walkedInAt: string | null | undefined): string {
  const mins = getWaitMinutes(walkedInAt);
  if (mins == null) return '—';
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

export function computeAverageWaitMinutes(
  visits: { walked_in_at: string }[]
): number | null {
  const minutes = visits
    .map(v => getWaitMinutes(v.walked_in_at))
    .filter((value): value is number => value != null);
  if (minutes.length === 0) return null;
  return Math.round(minutes.reduce((sum, value) => sum + value, 0) / minutes.length);
}

export function formatAverageWait(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function isNewPatient(dateCreated: string | null | undefined): boolean {
  if (!dateCreated) return false;
  const created = new Date(dateCreated);
  if (Number.isNaN(created.getTime())) return false;
  const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  return days <= 30;
}

export function isToday(dateValue: string | null | undefined): boolean {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
