import { api, apiRaw } from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
}
export interface IsLoggedInResponse {
  userID: number;
}

export function loginUser(payload: LoginPayload): Promise<unknown> {
  return api('/api/auth/login', { method: 'POST', body: payload });
}

export function registerUser(payload: RegisterPayload): Promise<unknown> {
  return api('/api/auth/register', { method: 'POST', body: payload });
}

export function isLoggedIn(): Promise<IsLoggedInResponse> {
  return api<IsLoggedInResponse>('/api/auth/isloggedin', { method: 'GET' });
}

export function logoutUser(): Promise<Response> {
  return apiRaw('/api/auth/logout', { method: 'POST' });
}
