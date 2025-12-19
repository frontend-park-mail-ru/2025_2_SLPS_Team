import { apiRaw } from './client';
import type { ApiError } from './client';

type JsonValue = unknown;

async function readJsonSafe<T = JsonValue>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function throwApiError<T>(status: number, data: T): never {
  throw { status, data } as ApiError<T>;
}

/** GET /api/posts */
export async function getPosts<T = JsonValue>(): Promise<T[]> {
  const res = await apiRaw('/api/posts', { method: 'GET' });
  const data = await readJsonSafe<T[] | T>(res);

  return Array.isArray(data) ? data : [];
}

/** GET /api/posts/{id} */
export async function getPostById<T = JsonValue>(postId: number | string): Promise<T> {
  const res = await apiRaw(`/api/posts/${postId}`, { method: 'GET' });
  const data = await readJsonSafe<T>(res);

  if (!res.ok) {
    console.error('getPostById error', res.status, data);
    throwApiError(res.status, data);
  }

  return data as T;
}

/** GET /api/posts/communities/{communityId}?page=&limit= */
export async function getCommunityPosts<T = JsonValue>(
  communityId: number | string,
  page: number = 1,
  limit: number = 20,
): Promise<T[]> {
  const res = await apiRaw(
    `/api/posts/communities/${communityId}?page=${page}&limit=${limit}`,
    { method: 'GET' },
  );

  const data = await readJsonSafe<T[] | T>(res);

  if (!res.ok) {
    console.error('getCommunityPosts error', res.status, data);
    throwApiError(res.status, data);
  }

  return Array.isArray(data) ? data : [];
}

/** POST /api/posts (multipart/form-data) */
export async function createPost<T = JsonValue>(formData: FormData): Promise<T> {
  const res = await apiRaw('/api/posts', {
    method: 'POST',
    body: formData,
  });

  const data = await readJsonSafe<T>(res);

  if (!res.ok) {
    console.error('createPost error', res.status, data);
    throwApiError(res.status, data);
  }

  return data as T;
}

/** PUT /api/posts/{id} (multipart/form-data) */
export async function updatePost<T = JsonValue>(
  postId: number | string,
  formData: FormData,
): Promise<T> {
  const res = await apiRaw(`/api/posts/${postId}`, {
    method: 'PUT',
    body: formData,
  });

  const data = await readJsonSafe<T>(res);

  if (!res.ok) {
    throwApiError(res.status, data);
  }

  return data as T;
}

/** DELETE /api/posts/{id} */
export async function deletePost<T = JsonValue>(postId: number | string): Promise<T> {
  const res = await apiRaw(`/api/posts/${postId}`, { method: 'DELETE' });
  const data = await readJsonSafe<T>(res);

  if (!res.ok) {
    console.error('deletePost error', res.status, data);
    throwApiError(res.status, data);
  }

  return data as T;
}

/** PUT /api/posts/{id}/like */
export async function togglePostLike<T = JsonValue>(postId: number | string): Promise<T> {
  const res = await apiRaw(`/api/posts/${postId}/like`, { method: 'PUT' });
  const data = await readJsonSafe<T>(res);

  if (!res.ok) {
    console.error('togglePostLike error', res.status, data);
    throwApiError(res.status, data);
  }

  return data as T;
}

/** GET /api/posts?page=&limit= */
export async function getPostsPaged<T = JsonValue>(
  page: number = 1,
  limit: number = 20,
): Promise<T[]> {
  const res = await apiRaw(`/api/posts?page=${page}&limit=${limit}`, { method: 'GET' });
  const data = await readJsonSafe<T[] | T>(res);

  if (!res.ok) {
    console.error('getPostsPaged error', res.status, data);
    throwApiError(res.status, data);
  }

  return Array.isArray(data) ? data : [];
}
