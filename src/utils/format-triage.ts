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

export function formatTriageAge(age: string | null | undefined): string {
  if (!age?.trim()) return 'N/A';
  return age.trim();
}
