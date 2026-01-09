import { Course, Lesson, User } from "./types";

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

export async function checkDatabase() {
  return fetchJson<{ exists: boolean }>(`${API_BASE}/admin/db-exists`);
}

export async function createLearningPlatform() {
  return fetchJson<{ ok: boolean }>(`${API_BASE}/admin/create-learning-platform`, {
    method: "POST"
  });
}

export async function fetchCourses() {
  return fetchJson<Course[]>(`${API_BASE}/courses`);
}

export async function createCourse(
  payload: Omit<Course, "id" | "createdAt" | "updatedAt">
) {
  return fetchJson<Course>(`${API_BASE}/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updateCourse(
  id: number,
  payload: Omit<Course, "id" | "createdAt" | "updatedAt">
) {
  return fetchJson<Course>(`${API_BASE}/courses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function deleteCourse(id: number) {
  await fetchJson(`${API_BASE}/courses/${id}`, {
    method: "DELETE"
  });
}

export async function fetchLessons() {
  return fetchJson<Lesson[]>(`${API_BASE}/lessons`);
}

export async function createLesson(
  payload: Omit<Lesson, "id" | "createdAt" | "updatedAt">
) {
  return fetchJson<Lesson>(`${API_BASE}/lessons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updateLesson(
  id: number,
  payload: Omit<Lesson, "id" | "createdAt" | "updatedAt">
) {
  return fetchJson<Lesson>(`${API_BASE}/lessons/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function deleteLesson(id: number) {
  await fetchJson(`${API_BASE}/lessons/${id}`, {
    method: "DELETE"
  });
}
