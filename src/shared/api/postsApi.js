import { api, API_BASE_URL } from "./client.js";

export async function getPosts() {
  const data = await api("/api/posts", {
    method: "GET",
  });

  return Array.isArray(data) ? data : data?.posts || [];
}

export async function createPost(formData) {
  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data;
}

export async function updatePost(postId, formData) {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: "PUT",
    body: formData,
    credentials: "include",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data;
}
