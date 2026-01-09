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
import "./styles.css";

const emptyForm = {
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

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
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
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
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
      await loadUsers();
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    try {
      if (editingId) {
        await updateUser(editingId, form);
        setNotice("User updated.");
      } else {
        await createUser(form);
        setNotice("User created.");
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleEdit(user: User) {
    setEditingId(user.id);
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleCourseSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    const categoryId = Number(courseForm.categoryId);
    const title = courseForm.title.trim();
    const description = courseForm.description.trim();
    const level = courseForm.level.trim();
    const status = courseForm.status.trim() || "draft";

    if (!Number.isInteger(categoryId) || categoryId <= 0 || !title) {
      setError("Course requires a valid category id and title.");
      return;
    }

    const payload = {
      categoryId,
      title,
      description: description.length ? description : null,
      level: level.length ? level : null,
      status
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

  async function handleDelete(user: User) {
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
          <h1>User Directory</h1>
          <p className="subtitle">
            Basic CRUD with a white, airy interface. Create the database on demand, then
            manage users in real time.
          </p>
        </div>
        <div className="hero-actions">
          <button className="button ghost" onClick={loadUsers} disabled={loading}>
            Refresh
          </button>
          <button className="button" onClick={handleCreateDb}>
            Create Database
          </button>
          <button className="button ghost" onClick={handleCreateLearningPlatform}>
            Create Learning Platform
          </button>
        </div>
      </header>

      {(error || notice) && (
        <div className="alerts">
          {error && <div className="alert error">{error}</div>}
          {notice && <div className="alert success">{notice}</div>}
        </div>
      )}

      <section className="panel">
        <h2>{editingId ? "Edit user" : "Add a new user"}</h2>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            First name
            <input
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              placeholder="Ada"
              required
            />
          </label>
          <label>
            Last name
            <input
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              placeholder="Lovelace"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="ada@example.com"
              required
            />
          </label>
          <div className="form-actions">
            <button className="button" type="submit">
              {editingId ? "Save changes" : "Create user"}
            </button>
            {editingId && (
              <button className="button ghost" type="button" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel panel-stack">
        <div className="table-header">
          <div>
            <p className="eyebrow">Learning</p>
            <h2>{editingCourseId ? "Edit course" : "Add a course"}</h2>
          </div>
          <span className="count">{courses.length} total</span>
        </div>

        <form className="form" onSubmit={handleCourseSubmit}>
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
              <button className="button ghost" type="button" onClick={handleCancelCourse}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {loadingCourses ? (
          <p className="muted">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="muted">No courses yet. Create one above.</p>
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
                  <button className="link danger" onClick={() => handleDeleteCourse(course)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel panel-stack">
        <div className="table-header">
          <div>
            <p className="eyebrow">Learning</p>
            <h2>{editingLessonId ? "Edit lesson" : "Add a lesson"}</h2>
          </div>
          <span className="count">{lessons.length} total</span>
        </div>

        <form className="form" onSubmit={handleLessonSubmit}>
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
              <button className="button ghost" type="button" onClick={handleCancelLesson}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {loadingLessons ? (
          <p className="muted">Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <p className="muted">No lessons yet. Create one above.</p>
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
                  <button className="link danger" onClick={() => handleDeleteLesson(lesson)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel table-panel">
        <div className="table-header">
          <h2>Users</h2>
          <span className="count">{users.length} total</span>
        </div>

        {loading ? (
          <p className="muted">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="muted">No users yet. Create one above.</p>
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
                <div>{new Date(user.createdAt).toLocaleString()}</div>
                <div className="row-actions">
                  <button className="link" onClick={() => handleEdit(user)}>
                    Edit
                  </button>
                  <button className="link danger" onClick={() => handleDelete(user)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="status-bar">
        <div className="status-bar-inner">
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
        </div>
      </footer>
    </div>
  );
}
