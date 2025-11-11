import { api } from "./client.js";

export async function loginUser(payload) {
  return api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerUser(payload) {
  return api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}