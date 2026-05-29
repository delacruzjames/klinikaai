export function getPatientInitials(
  fullname: string,
  firstName?: string,
  lastName?: string
): string {
  if (firstName?.trim() && lastName?.trim()) {
    return `${firstName.trim()[0]}${lastName.trim()[0]}`.toUpperCase();
  }

  const parts = fullname.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
