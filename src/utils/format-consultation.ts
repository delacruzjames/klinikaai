export function stripHtml(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  return value.replace(/<[^>]+>/g, '').trim();
}

export function formatConsultationDate(date: string | null | undefined): string {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatConsultationField(value: string | null | undefined): string {
  const plain = stripHtml(value);
  return plain || '—';
}

export type FollowUpStatus =
  | 'scheduled'
  | 'upcoming'
  | 'missed'
  | 'completed'
  | 'cancelled'
  | string;

export function followUpStatusColor(status: FollowUpStatus | undefined): string {
  switch (status) {
    case 'scheduled':
      return '#5DADEC';
    case 'upcoming':
      return '#FACC15';
    case 'missed':
      return '#EF4444';
    case 'completed':
      return '#22C55E';
    default:
      return '#C9CED6';
  }
}

export function formatFollowUpStatus(status: string | undefined): string {
  if (!status) return 'NONE';
  return status.replace(/_/g, ' ').toUpperCase();
}
