import { User } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

async function fetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = data?.error ?? "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export async function fetchUsers() {
  return fetchJson<User[]>(`${API_BASE}/users`);
}

export async function createUser(payload: Omit<User, "id" | "createdAt">) {
  return fetchJson<User>(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updateUser(
  id: number,
  payload: Omit<User, "id" | "createdAt">
) {
  return fetchJson<User>(`${API_BASE}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function deleteUser(id: number) {
  await fetchJson(`${API_BASE}/users/${id}`, {
    method: "DELETE"
  });
}

export async function createDatabase() {
  return fetchJson<{ ok: boolean }>(`${API_BASE}/admin/create-db`, {
    method: "POST"
  });
}
