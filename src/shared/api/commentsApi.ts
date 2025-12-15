import { api, API_BASE_URL } from './client';

function assertId(value: unknown, fnName: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${fnName}: id is required`);
  }
}

export async function getPostComments<T = unknown>(id: number, page = 1,limit = 20,): Promise<T> {
  assertId(id, 'getPostComments');
  return api<T>(`/api/posts/${id}/comments?page=${page}&limit=${limit}`, { method: 'GET' });
}

function assertText(value: unknown, fnName: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fnName}: text is required`);
  }
}

interface CreateCommentPayload {
  postID: number;
  text: string;
}

export async function createPostComment<T = unknown>(
  postID: number,
  text: string,
): Promise<T> {
  assertId(postID, 'createPostComment');
  assertText(text, 'createPostComment');

  return api<T>('/api/comments', {
    method: 'POST',
    body: {
      postID,
      text,
    },
  });
}

