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

type ApiUser = User & {
  Id?: number;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  CreatedAt?: string;
};

type ApiCourse = Course & {
  Id?: number;
  CategoryId?: number;
  Title?: string;
  Description?: string | null;
  Level?: string | null;
  Status?: string;
  CreatedAt?: string;
  UpdatedAt?: string | null;
};

type ApiLesson = Lesson & {
  Id?: number;
  CourseId?: number;
  Title?: string;
  Content?: string | null;
  Position?: number;
  CreatedAt?: string;
  UpdatedAt?: string | null;
};

function normalizeUser(user: ApiUser): User {
  return {
    id: user.id ?? user.Id ?? 0,
    firstName: user.firstName ?? user.FirstName ?? "",
    lastName: user.lastName ?? user.LastName ?? "",
    email: user.email ?? user.Email ?? "",
    createdAt: user.createdAt ?? user.CreatedAt ?? ""
  };
}

function normalizeCourse(course: ApiCourse): Course {
  return {
    id: course.id ?? course.Id ?? 0,
    categoryId: course.categoryId ?? course.CategoryId ?? 0,
    title: course.title ?? course.Title ?? "",
    description: course.description ?? course.Description ?? null,
    level: course.level ?? course.Level ?? null,
    status: course.status ?? course.Status ?? "",
    createdAt: course.createdAt ?? course.CreatedAt ?? "",
    updatedAt: course.updatedAt ?? course.UpdatedAt ?? null
  };
}

function normalizeLesson(lesson: ApiLesson): Lesson {
  return {
    id: lesson.id ?? lesson.Id ?? 0,
    courseId: lesson.courseId ?? lesson.CourseId ?? 0,
    title: lesson.title ?? lesson.Title ?? "",
    content: lesson.content ?? lesson.Content ?? null,
    position: lesson.position ?? lesson.Position ?? 1,
    createdAt: lesson.createdAt ?? lesson.CreatedAt ?? "",
    updatedAt: lesson.updatedAt ?? lesson.UpdatedAt ?? null
  };
}

export async function fetchUsers() {
  const data = await fetchJson<ApiUser[]>(`${API_BASE}/users`);
  return data.map(normalizeUser);
}

export async function createUser(payload: Omit<User, "id" | "createdAt">) {
  const data = await fetchJson<ApiUser>(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return normalizeUser(data);
}

export async function updateUser(
  id: number,
  payload: Omit<User, "id" | "createdAt">
) {
  const data = await fetchJson<ApiUser>(`${API_BASE}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return normalizeUser(data);
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
  const data = await fetchJson<ApiCourse[]>(`${API_BASE}/courses`);
  return data.map(normalizeCourse);
}

export async function createCourse(
  payload: Omit<Course, "id" | "createdAt" | "updatedAt">
) {
  const data = await fetchJson<ApiCourse>(`${API_BASE}/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return normalizeCourse(data);
}

export async function updateCourse(
  id: number,
  payload: Omit<Course, "id" | "createdAt" | "updatedAt">
) {
  const data = await fetchJson<ApiCourse>(`${API_BASE}/courses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return normalizeCourse(data);
}

export async function deleteCourse(id: number) {
  await fetchJson(`${API_BASE}/courses/${id}`, {
    method: "DELETE"
  });
}

export async function fetchLessons() {
  const data = await fetchJson<ApiLesson[]>(`${API_BASE}/lessons`);
  return data.map(normalizeLesson);
}

export async function createLesson(
  payload: Omit<Lesson, "id" | "createdAt" | "updatedAt">
) {
  const data = await fetchJson<ApiLesson>(`${API_BASE}/lessons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return normalizeLesson(data);
}

export async function updateLesson(
  id: number,
  payload: Omit<Lesson, "id" | "createdAt" | "updatedAt">
) {
  const data = await fetchJson<ApiLesson>(`${API_BASE}/lessons/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return normalizeLesson(data);
}

export async function deleteLesson(id: number) {
  await fetchJson(`${API_BASE}/lessons/${id}`, {
    method: "DELETE"
  });
}
