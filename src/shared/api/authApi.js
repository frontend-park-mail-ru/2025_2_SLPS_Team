import { api } from './client.js';

export function loginUser(payload) {
  return api('/api/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export function registerUser(payload) {
  return api('/api/auth/register', {
    method: 'POST',
    body: payload,
  });
}