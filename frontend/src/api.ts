import {
  Category,
  Course,
  CourseCompletion,
  CourseProgress,
  Enrollment,
  Lesson,
  User
} from "./types";

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

type ApiCategory = Category & {
  Id?: number;
  Name?: string;
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

type ApiEnrollment = Enrollment & {
  Id?: number;
  UserId?: number;
  CourseId?: number;
  UserFirstName?: string;
  UserLastName?: string;
  UserEmail?: string;
  CourseTitle?: string;
  Status?: string;
  EnrolledAt?: string;
};

type ApiCourseProgress = CourseProgress & {
  Id?: number;
  UserId?: number;
  CourseId?: number;
  UserFirstName?: string;
  UserLastName?: string;
  UserEmail?: string;
  CourseTitle?: string;
  PercentComplete?: number;
  UpdatedAt?: string;
};

type ApiCourseCompletion = CourseCompletion & {
  Id?: number;
  UserId?: number;
  CourseId?: number;
  UserFirstName?: string;
  UserLastName?: string;
  UserEmail?: string;
  CourseTitle?: string;
  CompletedAt?: string;
};

type TableCount = {
  name: string;
  status: "ok" | "missing";
  count?: number;
};

type TableCountsResponse = {
  database: string;
  tables: TableCount[];
};

type ViewCountResponse = {
  database: string;
  count: number;
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

function normalizeCategory(category: ApiCategory): Category {
  return {
    id: category.id ?? category.Id ?? 0,
    name: category.name ?? category.Name ?? "",
    createdAt: category.createdAt ?? category.CreatedAt ?? ""
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

function normalizeEnrollment(enrollment: ApiEnrollment): Enrollment {
  const firstName = enrollment.UserFirstName ?? "";
  const lastName = enrollment.UserLastName ?? "";
  const userName = enrollment.userName ?? `${firstName} ${lastName}`.trim();

  return {
    id: enrollment.id ?? enrollment.Id ?? 0,
    userId: enrollment.userId ?? enrollment.UserId ?? 0,
    courseId: enrollment.courseId ?? enrollment.CourseId ?? 0,
    userName,
    userEmail: enrollment.userEmail ?? enrollment.UserEmail ?? "",
    courseTitle: enrollment.courseTitle ?? enrollment.CourseTitle ?? "",
    status: enrollment.status ?? enrollment.Status ?? "active",
    enrolledAt: enrollment.enrolledAt ?? enrollment.EnrolledAt ?? ""
  };
}

function normalizeCourseProgress(progress: ApiCourseProgress): CourseProgress {
  const firstName = progress.UserFirstName ?? "";
  const lastName = progress.UserLastName ?? "";
  const userName = progress.userName ?? `${firstName} ${lastName}`.trim();

  return {
    id: progress.id ?? progress.Id ?? 0,
    userId: progress.userId ?? progress.UserId ?? 0,
    courseId: progress.courseId ?? progress.CourseId ?? 0,
    userName,
    userEmail: progress.userEmail ?? progress.UserEmail ?? "",
    courseTitle: progress.courseTitle ?? progress.CourseTitle ?? "",
    percentComplete: progress.percentComplete ?? progress.PercentComplete ?? 0,
    updatedAt: progress.updatedAt ?? progress.UpdatedAt ?? ""
  };
}

function normalizeCourseCompletion(
  completion: ApiCourseCompletion
): CourseCompletion {
  const firstName = completion.UserFirstName ?? "";
  const lastName = completion.UserLastName ?? "";
  const userName = completion.userName ?? `${firstName} ${lastName}`.trim();

  return {
    id: completion.id ?? completion.Id ?? 0,
    userId: completion.userId ?? completion.UserId ?? 0,
    courseId: completion.courseId ?? completion.CourseId ?? 0,
    userName,
    userEmail: completion.userEmail ?? completion.UserEmail ?? "",
    courseTitle: completion.courseTitle ?? completion.CourseTitle ?? "",
    completedAt: completion.completedAt ?? completion.CompletedAt ?? ""
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

export async function fetchCategories() {
  const data = await fetchJson<ApiCategory[]>(`${API_BASE}/categories`);
  return data.map(normalizeCategory);
}

export async function createCategory(payload: Omit<Category, "id" | "createdAt">) {
  const data = await fetchJson<ApiCategory>(`${API_BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return normalizeCategory(data);
}

export async function updateCategory(
  id: number,
  payload: Omit<Category, "id" | "createdAt">
) {
  const data = await fetchJson<ApiCategory>(`${API_BASE}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return normalizeCategory(data);
}

export async function deleteCategory(id: number) {
  await fetchJson(`${API_BASE}/categories/${id}`, {
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

export async function fetchTableCounts() {
  return fetchJson<TableCountsResponse>(`${API_BASE}/admin/table-counts`);
}

export async function fetchViewCount() {
  return fetchJson<ViewCountResponse>(`${API_BASE}/admin/view-count`);
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

export async function fetchEnrollments(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await fetchJson<ApiEnrollment[]>(
    `${API_BASE}/enrollments${query}`
  );
  return data.map(normalizeEnrollment);
}

export async function createEnrollment(
  payload: Pick<Enrollment, "userId" | "courseId" | "status">
) {
  const data = await fetchJson<ApiEnrollment>(`${API_BASE}/enrollments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return normalizeEnrollment(data);
}

export async function updateEnrollment(
  id: number,
  payload: Pick<Enrollment, "userId" | "courseId" | "status">
) {
  const data = await fetchJson<ApiEnrollment>(`${API_BASE}/enrollments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return normalizeEnrollment(data);
}

export async function deleteEnrollment(id: number) {
  await fetchJson(`${API_BASE}/enrollments/${id}`, {
    method: "DELETE"
  });
}

export async function fetchCourseProgress() {
  const data = await fetchJson<ApiCourseProgress[]>(
    `${API_BASE}/course-progress`
  );
  return data.map(normalizeCourseProgress);
}

export async function createCourseProgress(
  payload: Pick<CourseProgress, "userId" | "courseId" | "percentComplete">
) {
  const data = await fetchJson<ApiCourseProgress>(`${API_BASE}/course-progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return normalizeCourseProgress(data);
}

export async function updateCourseProgress(
  id: number,
  payload: Pick<CourseProgress, "userId" | "courseId" | "percentComplete">
) {
  const data = await fetchJson<ApiCourseProgress>(
    `${API_BASE}/course-progress/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );
  return normalizeCourseProgress(data);
}

export async function deleteCourseProgress(id: number) {
  await fetchJson(`${API_BASE}/course-progress/${id}`, {
    method: "DELETE"
  });
}

export async function fetchCourseCompletions() {
  const data = await fetchJson<ApiCourseCompletion[]>(
    `${API_BASE}/course-completions`
  );
  return data.map(normalizeCourseCompletion);
}
