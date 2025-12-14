import { authService } from '../../services/AuthService';

export const API_BASE_URL = process.env.API_BASE_URL as string;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

export interface ApiError<T = unknown> {
  status: number;
  data: T;
}


function buildUrl(path: string): string {
  if (!path) throw new Error('client: path is required');
  if (path.startsWith('http')) return path;
  if (path.startsWith('/api')) return `${API_BASE_URL}${path}`;
  return path;
}

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

function needsCsrf(method: HttpMethod): boolean {
  return method !== 'GET';
}

async function request(
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  const url = buildUrl(path);
  const method: HttpMethod = options.method ?? 'GET';
  const body = options.body;
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = { ...(options.headers ?? {}) };

  headers.Accept ??= 'application/json';

  if (
    !isFormData &&
    body != null &&
    !headers['Content-Type'] &&
    method !== 'GET'
  ) {
    headers['Content-Type'] = 'application/json';
  }

  if (needsCsrf(method)) {
    const csrf = authService.getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

    const bodyInit: BodyInit | null | undefined =
    isFormData
        ? (body as FormData)
        : body != null
        ? JSON.stringify(body)
        : undefined;

    const init: RequestInit = {
    method,
    credentials: options.credentials ?? 'include',
    headers,
    ...(bodyInit !== undefined ? { body: bodyInit } : {}),
    };

    return fetch(url, init);
}

export async function api<T>(
  path: string,
  options?: RequestOptions,
): Promise<T> {
  const res = await request(path, options);
  const data = await parseJsonSafe<T>(res);

  if (!res.ok) {
    throw { status: res.status, data } as ApiError<T>;
  }

  return data as T;
}

export async function apiRaw(
  path: string,
  options?: RequestOptions,
): Promise<Response> {
  return request(path, options);
}
