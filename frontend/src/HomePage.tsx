import { useEffect, useState, type FormEvent } from "react";
import {
  checkDatabase,
  createDatabase,
  createCourse,
  createLesson,
  createLearningPlatform,
  createUser,
  deleteCourse,
  deleteLesson,
  deleteUser,
  fetchCourses,
  fetchLessons,
  fetchUsers,
  updateCourse,
  updateLesson,
  updateUser
} from "./api";
import { Course, Lesson, User } from "./types";

const emptyUserForm = {
  firstName: "",
  lastName: "",
  email: ""
};

const emptyCourseForm = {
  categoryId: "",
  title: "",
  description: "",
  level: "",
  status: "draft"
};

const emptyLessonForm = {
  courseId: "",
  title: "",
  content: "",
  position: "1"
};

interface HomePageProps {
  onNavigateSettings?: () => void;
}

export default function HomePage({ onNavigateSettings }: HomePageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [checkingDb, setCheckingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<"unknown" | "exists" | "missing">(
    "unknown"
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    "users" | "courses" | "lessons"
  >("courses");

  const fakeFirstNames = [
    "Ava",
    "Noah",
    "Maya",
    "Leo",
    "Zoe",
    "Nina",
    "Omar",
    "Ezra"
  ];
  const fakeLastNames = [
    "Singh",
    "Chen",
    "Lopez",
    "Patel",
    "Kim",
    "Garcia",
    "Nguyen",
    "Brown"
  ];
  const fakeDomains = ["example.com", "mail.test", "demo.local"];

  function generateFakeUser() {
    const firstName =
      fakeFirstNames[Math.floor(Math.random() * fakeFirstNames.length)];
    const lastName =
      fakeLastNames[Math.floor(Math.random() * fakeLastNames.length)];
    const domain = fakeDomains[Math.floor(Math.random() * fakeDomains.length)];
    const suffix = Math.floor(Math.random() * 900 + 100);
    return {
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@${domain}`
    };
  }

  async function loadUsers() {
    setLoadingUsers(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadCourses() {
    setLoadingCourses(true);
    setError(null);
    try {
      const data = await fetchCourses();
      setCourses(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingCourses(false);
    }
  }

  async function loadLessons() {
    setLoadingLessons(true);
    setError(null);
    try {
      const data = await fetchLessons();
      setLessons(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingLessons(false);
    }
  }

  useEffect(() => {
    loadUsers();
    loadCourses();
    loadLessons();
  }, []);

  async function handleCreateDb() {
    setNotice(null);
    setError(null);
    try {
      await createDatabase();
      setNotice("Database ready.");
      setDbStatus("exists");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCheckDb() {
    setCheckingDb(true);
    setNotice(null);
    setError(null);
    try {
      const data = await checkDatabase();
      if (data.exists) {
        setDbStatus("exists");
        setNotice("Database exists.");
      } else {
        setDbStatus("missing");
        setNotice("Database not found.");
      }
    } catch (err) {
      setDbStatus("unknown");
      setError((err as Error).message);
    } finally {
      setCheckingDb(false);
    }
  }

  async function handleCreateLearningPlatform() {
    setNotice(null);
    setError(null);
    try {
      await createLearningPlatform();
      setNotice("Learning platform schema ready.");
      await loadCourses();
      await loadLessons();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleUserSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    try {
      if (editingUserId) {
        await updateUser(editingUserId, userForm);
        setNotice("User updated.");
      } else {
        await createUser(userForm);
        setNotice("User created.");
      }
      setUserForm(emptyUserForm);
      setEditingUserId(null);
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleEditUser(user: User) {
    setEditingUserId(user.id);
    setUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
  }

  function handleCancelUser() {
    setEditingUserId(null);
    setUserForm(emptyUserForm);
  }

  function handleFillFakeUser() {
    const fakeUser = generateFakeUser();
    setUserForm(fakeUser);
    setEditingUserId(null);
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`Delete ${user.firstName} ${user.lastName}?`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await deleteUser(user.id);
      setNotice("User deleted.");
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCourseSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    const categoryId = Number(courseForm.categoryId);
    const title = courseForm.title.trim();

    if (!Number.isInteger(categoryId) || categoryId <= 0 || !title) {
      setError("Course requires a valid category id and title.");
      return;
    }

    const payload = {
      categoryId,
      title,
      description:
        courseForm.description.length > 0 ? courseForm.description : null,
      level: courseForm.level.length > 0 ? courseForm.level : null,
      status: courseForm.status
    };

    try {
      if (editingCourseId) {
        await updateCourse(editingCourseId, payload);
        setNotice("Course updated.");
      } else {
        await createCourse(payload);
        setNotice("Course created.");
      }
      setCourseForm(emptyCourseForm);
      setEditingCourseId(null);
      await loadCourses();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleEditCourse(course: Course) {
    setEditingCourseId(course.id);
    setCourseForm({
      categoryId: String(course.categoryId),
      title: course.title,
      description: course.description ?? "",
      level: course.level ?? "",
      status: course.status
    });
  }

  function handleCancelCourse() {
    setEditingCourseId(null);
    setCourseForm(emptyCourseForm);
  }

  async function handleDeleteCourse(course: Course) {
    if (!confirm(`Delete course "${course.title}"?`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await deleteCourse(course.id);
      setNotice("Course deleted.");
      await loadCourses();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleLessonSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    const courseId = Number(lessonForm.courseId);
    const title = lessonForm.title.trim();
    const content = lessonForm.content.trim();
    const position = Number(lessonForm.position);

    if (!Number.isInteger(courseId) || courseId <= 0 || !title) {
      setError("Lesson requires a valid course id and title.");
      return;
    }

    const payload = {
      courseId,
      title,
      content: content.length ? content : null,
      position: Number.isInteger(position) && position > 0 ? position : 1
    };

    try {
      if (editingLessonId) {
        await updateLesson(editingLessonId, payload);
        setNotice("Lesson updated.");
      } else {
        await createLesson(payload);
        setNotice("Lesson created.");
      }
      setLessonForm(emptyLessonForm);
      setEditingLessonId(null);
      await loadLessons();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleEditLesson(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setLessonForm({
      courseId: String(lesson.courseId),
      title: lesson.title,
      content: lesson.content ?? "",
      position: String(lesson.position)
    });
  }

  function handleCancelLesson() {
    setEditingLessonId(null);
    setLessonForm(emptyLessonForm);
  }

  async function handleDeleteLesson(lesson: Lesson) {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await deleteLesson(lesson.id);
      setNotice("Lesson deleted.");
      await loadLessons();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const statusLabel =
    dbStatus === "exists"
      ? "Database exists"
      : dbStatus === "missing"
        ? "Database missing"
        : "Unknown status";
  const statusClass =
    dbStatus === "exists" ? "success" : dbStatus === "missing" ? "danger" : "neutral";

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Node + MSSQL</p>
          <h1>Learning Platform</h1>
          <p className="subtitle">
            Manage users, courses, and lessons in one place.
          </p>
        </div>
        <div className="hero-actions">
          {onNavigateSettings && (
            <button
              className="button icon-button"
              onClick={onNavigateSettings}
              title="Go to Settings"
              aria-label="Settings"
            >
              ⚙️
            </button>
          )}
          <button className="button" onClick={handleCreateDb}>
            Create Database
          </button>
          <button className="button ghost" onClick={handleCreateLearningPlatform}>
            Create Learning Platform
          </button>
        </div>
      </header>

      <section className="status-strip">
        <div className="status-block">
          <span className="status-chip">DB</span>
          <div>
            <p className="status-title">Database status</p>
            <p className="status-meta">Uses DB_DATABASE from backend config</p>
          </div>
          <span className={`pill ${statusClass}`}>{statusLabel}</span>
        </div>
        <div className="status-actions">
          <button
            className="button ghost"
            onClick={handleCheckDb}
            disabled={checkingDb}
          >
            {checkingDb ? "Checking..." : "Check Database"}
          </button>
        </div>
      </section>

      {(error || notice) && (
        <div className="alerts">
          {error && <div className="alert error">{error}</div>}
          {notice && <div className="alert success">{notice}</div>}
        </div>
      )}

      <nav className="tabs" role="tablist" aria-label="Manage entities">
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
          type="button"
          role="tab"
          aria-selected={activeTab === "users"}
        >
          Users
        </button>
        <button
          className={`tab ${activeTab === "courses" ? "active" : ""}`}
          onClick={() => setActiveTab("courses")}
          type="button"
          role="tab"
          aria-selected={activeTab === "courses"}
        >
          Courses
        </button>
        <button
          className={`tab ${activeTab === "lessons" ? "active" : ""}`}
          onClick={() => setActiveTab("lessons")}
          type="button"
          role="tab"
          aria-selected={activeTab === "lessons"}
        >
          Lessons
        </button>
      </nav>

      {activeTab === "users" && (
        <section className="split-panel" role="tabpanel">
          <div className="panel form-panel">
            <h2>{editingUserId ? "Edit user" : "Add a user"}</h2>
            <form className="form form-compact" onSubmit={handleUserSubmit}>
              <label>
                First name
                <input
                  value={userForm.firstName}
                  onChange={(event) =>
                    setUserForm({ ...userForm, firstName: event.target.value })
                  }
                  placeholder="Ada"
                  required
                />
              </label>
              <label>
                Last name
                <input
                  value={userForm.lastName}
                  onChange={(event) =>
                    setUserForm({ ...userForm, lastName: event.target.value })
                  }
                  placeholder="Lovelace"
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm({ ...userForm, email: event.target.value })
                  }
                  placeholder="ada@example.com"
                  required
                />
              </label>
              <div className="form-actions">
                <button className="button" type="submit">
                  {editingUserId ? "Save changes" : "Create user"}
                </button>
                {!editingUserId && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleFillFakeUser}
                  >
                    Fake data
                  </button>
                )}
                {editingUserId && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleCancelUser}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel table-panel">
            <div className="table-header">
              <h2>Users</h2>
              <span className="count">{users.length} total</span>
            </div>

            {loadingUsers ? (
              <p className="muted">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="muted">No users yet. Create one on the left.</p>
            ) : (
              <div className="table">
                <div className="table-row table-head">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Created</span>
                  <span></span>
                </div>
                {users.map((user) => (
                  <div className="table-row" key={user.id}>
                    <div>
                      <strong>
                        {user.firstName} {user.lastName}
                      </strong>
                    </div>
                    <div>{user.email}</div>
                    <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                    <div className="row-actions">
                      <button className="link" onClick={() => handleEditUser(user)}>
                        Edit
                      </button>
                      <button
                        className="link danger"
                        onClick={() => handleDeleteUser(user)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "courses" && (
        <section className="split-panel" role="tabpanel">
          <div className="panel form-panel">
            <h2>{editingCourseId ? "Edit course" : "Add a course"}</h2>
            <form className="form form-compact" onSubmit={handleCourseSubmit}>
              <label>
                Category id
                <input
                  type="number"
                  min="1"
                  value={courseForm.categoryId}
                  onChange={(event) =>
                    setCourseForm({ ...courseForm, categoryId: event.target.value })
                  }
                  placeholder="1"
                  required
                />
              </label>
              <label>
                Title
                <input
                  value={courseForm.title}
                  onChange={(event) =>
                    setCourseForm({ ...courseForm, title: event.target.value })
                  }
                  placeholder="Intro to SQL"
                  required
                />
              </label>
              <label>
                Level
                <input
                  value={courseForm.level}
                  onChange={(event) =>
                    setCourseForm({ ...courseForm, level: event.target.value })
                  }
                  placeholder="Beginner"
                />
              </label>
              <label className="field-span-3">
                Description
                <textarea
                  value={courseForm.description}
                  onChange={(event) =>
                    setCourseForm({ ...courseForm, description: event.target.value })
                  }
                  placeholder="Short summary of the course focus."
                  rows={3}
                />
              </label>
              <label>
                Status
                <select
                  value={courseForm.status}
                  onChange={(event) =>
                    setCourseForm({ ...courseForm, status: event.target.value })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <div className="form-actions">
                <button className="button" type="submit">
                  {editingCourseId ? "Save course" : "Create course"}
                </button>
                {editingCourseId && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleCancelCourse}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel table-panel">
            <div className="table-header">
              <h2>Courses</h2>
              <span className="count">{courses.length} total</span>
            </div>

            {loadingCourses ? (
              <p className="muted">Loading courses...</p>
            ) : courses.length === 0 ? (
              <p className="muted">No courses yet. Create one on the left.</p>
            ) : (
              <div className="table">
                <div className="table-row table-head courses-row">
                  <span>Title</span>
                  <span>Category</span>
                  <span>Status</span>
                  <span>Level</span>
                  <span>Created</span>
                  <span></span>
                </div>
                {courses.map((course) => (
                  <div className="table-row courses-row" key={course.id}>
                    <div>
                      <strong>{course.title}</strong>
                    </div>
                    <div>{course.categoryId}</div>
                    <div>{course.status}</div>
                    <div>{course.level ?? "—"}</div>
                    <div>{new Date(course.createdAt).toLocaleDateString()}</div>
                    <div className="row-actions">
                      <button className="link" onClick={() => handleEditCourse(course)}>
                        Edit
                      </button>
                      <button
                        className="link danger"
                        onClick={() => handleDeleteCourse(course)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "lessons" && (
        <section className="split-panel" role="tabpanel">
          <div className="panel form-panel">
            <h2>{editingLessonId ? "Edit lesson" : "Add a lesson"}</h2>
            <form className="form form-compact" onSubmit={handleLessonSubmit}>
              <label>
                Course id
                <input
                  type="number"
                  min="1"
                  value={lessonForm.courseId}
                  onChange={(event) =>
                    setLessonForm({ ...lessonForm, courseId: event.target.value })
                  }
                  placeholder="1"
                  required
                />
              </label>
              <label>
                Title
                <input
                  value={lessonForm.title}
                  onChange={(event) =>
                    setLessonForm({ ...lessonForm, title: event.target.value })
                  }
                  placeholder="Lesson title"
                  required
                />
              </label>
              <label>
                Position
                <input
                  type="number"
                  min="1"
                  value={lessonForm.position}
                  onChange={(event) =>
                    setLessonForm({ ...lessonForm, position: event.target.value })
                  }
                  placeholder="1"
                />
              </label>
              <label className="field-span-3">
                Content
                <textarea
                  value={lessonForm.content}
                  onChange={(event) =>
                    setLessonForm({ ...lessonForm, content: event.target.value })
                  }
                  placeholder="Lesson content or outline."
                  rows={3}
                />
              </label>
              <div className="form-actions">
                <button className="button" type="submit">
                  {editingLessonId ? "Save lesson" : "Create lesson"}
                </button>
                {editingLessonId && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleCancelLesson}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel table-panel">
            <div className="table-header">
              <h2>Lessons</h2>
              <span className="count">{lessons.length} total</span>
            </div>

            {loadingLessons ? (
              <p className="muted">Loading lessons...</p>
            ) : lessons.length === 0 ? (
              <p className="muted">No lessons yet. Create one on the left.</p>
            ) : (
              <div className="table">
                <div className="table-row table-head lessons-row">
                  <span>Title</span>
                  <span>Course</span>
                  <span>Position</span>
                  <span>Created</span>
                  <span></span>
                </div>
                {lessons.map((lesson) => (
                  <div className="table-row lessons-row" key={lesson.id}>
                    <div>
                      <strong>{lesson.title}</strong>
                    </div>
                    <div>{lesson.courseId}</div>
                    <div>{lesson.position}</div>
                    <div>{new Date(lesson.createdAt).toLocaleDateString()}</div>
                    <div className="row-actions">
                      <button className="link" onClick={() => handleEditLesson(lesson)}>
                        Edit
                      </button>
                      <button
                        className="link danger"
                        onClick={() => handleDeleteLesson(lesson)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
