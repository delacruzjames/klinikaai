import { getApiBaseUrl } from '@/config/api';

export type LoginResponse = {
  email: string;
  establishment_id: number | string;
  sub_domain: string;
  token: string;
};

type LoginErrorBody = {
  error?: string;
  errors?: string | string[];
  message?: string;
};

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  let data: LoginResponse & LoginErrorBody = {} as LoginResponse & LoginErrorBody;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const errors = data.errors;
    const message =
      data.error ||
      data.message ||
      (Array.isArray(errors) ? errors.join(', ') : errors) ||
      'Invalid email or password.';
    throw new Error(message);
  }

  if (!data.token || data.establishment_id == null || !data.sub_domain) {
    throw new Error('Authentication failed. Incomplete response from server.');
  }

  return data;
}
