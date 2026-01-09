import { useEffect, useState, type FormEvent } from "react";
import {
  createCategory,
  createCourse,
  createCourseProgress,
  createEnrollment,
  createLesson,
  createUser,
  deleteCategory,
  deleteCourse,
  deleteCourseProgress,
  deleteEnrollment,
  deleteLesson,
  deleteUser,
  fetchCategories,
  fetchCourseCompletions,
  fetchCourseProgress,
  fetchCourses,
  fetchEnrollments,
  fetchLessons,
  fetchUsers,
  updateCategory,
  updateCourse,
  updateCourseProgress,
  updateEnrollment,
  updateLesson,
  updateUser
} from "./api";
import {
  Category,
  Course,
  CourseCompletion,
  CourseProgress,
  Enrollment,
  Lesson,
  User
} from "./types";

const emptyUserForm = {
  firstName: "",
  lastName: "",
  email: ""
};

const emptyCategoryForm = {
  name: ""
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

const emptyEnrollmentForm = {
  userId: "",
  courseId: "",
  status: "active"
};

const emptyCourseProgressForm = {
  userId: "",
  courseId: "",
  percentComplete: "0"
};

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [courseCompletions, setCourseCompletions] = useState<
    CourseCompletion[]
  >([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [loadingCourseProgress, setLoadingCourseProgress] = useState(false);
  const [loadingCourseCompletions, setLoadingCourseCompletions] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  );
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [enrollmentForm, setEnrollmentForm] = useState(emptyEnrollmentForm);
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<number | null>(
    null
  );
  const [courseProgressForm, setCourseProgressForm] = useState(
    emptyCourseProgressForm
  );
  const [editingCourseProgressId, setEditingCourseProgressId] = useState<
    number | null
  >(null);
  const [showActiveEnrollments, setShowActiveEnrollments] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "users"
    | "categories"
    | "courses"
    | "lessons"
    | "enrollments"
    | "progress"
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
  const fakeCourseTitles = [
    "Intro to SQL",
    "Data Modeling Basics",
    "Query Optimization",
    "Analytics with PostgreSQL",
    "SQL for Product Teams",
    "Advanced Joins",
    "Reporting Essentials",
    "Warehouse Foundations"
  ];
  const fakeCourseLevels = ["Beginner", "Intermediate", "Advanced"];
  const fakeCourseStatuses: Array<Course["status"]> = [
    "draft",
    "published",
    "archived"
  ];
  const fakeCourseDescriptions = [
    "Build a solid foundation for writing and reading SQL queries.",
    "Learn how to design schemas that scale as your data grows.",
    "Improve query performance with practical, hands-on techniques.",
    "Turn raw data into insights using real-world reporting flows.",
    "Ship reliable dashboards and metrics with confidence."
  ];
  const fakeCategoryPrefixes = [
    "Core",
    "Advanced",
    "Modern",
    "Applied",
    "Practical",
    "Foundations"
  ];
  const fakeCategorySubjects = [
    "Analytics",
    "Reporting",
    "Databases",
    "Performance",
    "Data Modeling",
    "SQL",
    "Warehousing"
  ];
  const enrollmentStatuses = ["active", "paused", "completed", "cancelled"];

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

  function generateFakeCourse() {
    const title =
      fakeCourseTitles[Math.floor(Math.random() * fakeCourseTitles.length)];
    const level =
      fakeCourseLevels[Math.floor(Math.random() * fakeCourseLevels.length)];
    const status =
      fakeCourseStatuses[Math.floor(Math.random() * fakeCourseStatuses.length)];
    const description =
      fakeCourseDescriptions[
        Math.floor(Math.random() * fakeCourseDescriptions.length)
      ];
    const categoryId = Math.floor(Math.random() * 5) + 1;
    return {
      categoryId: String(categoryId),
      title,
      description,
      level,
      status
    };
  }

  function generateFakeCategory() {
    const prefix =
      fakeCategoryPrefixes[Math.floor(Math.random() * fakeCategoryPrefixes.length)];
    const subject =
      fakeCategorySubjects[Math.floor(Math.random() * fakeCategorySubjects.length)];
    return {
      name: `${prefix} ${subject}`
    };
  }

  function generateFakeEnrollment() {
    if (users.length === 0 || courses.length === 0) {
      return null;
    }
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomCourse = courses[Math.floor(Math.random() * courses.length)];
    const status =
      enrollmentStatuses[Math.floor(Math.random() * enrollmentStatuses.length)];
    return {
      userId: String(randomUser.id),
      courseId: String(randomCourse.id),
      status
    };
  }

  function generateFakeCourseProgress() {
    if (users.length === 0 || courses.length === 0) {
      return null;
    }
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomCourse = courses[Math.floor(Math.random() * courses.length)];
    const percentComplete = Math.floor(Math.random() * 101);
    return {
      userId: String(randomUser.id),
      courseId: String(randomCourse.id),
      percentComplete: String(percentComplete)
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

  async function loadCategories() {
    setLoadingCategories(true);
    setError(null);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingCategories(false);
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

  async function loadEnrollments(status?: string) {
    setLoadingEnrollments(true);
    setError(null);
    try {
      const data = await fetchEnrollments(status);
      setEnrollments(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingEnrollments(false);
    }
  }

  async function loadCourseProgress() {
    setLoadingCourseProgress(true);
    setError(null);
    try {
      const data = await fetchCourseProgress();
      setCourseProgress(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingCourseProgress(false);
    }
  }

  async function loadCourseCompletions() {
    setLoadingCourseCompletions(true);
    setError(null);
    try {
      const data = await fetchCourseCompletions();
      setCourseCompletions(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingCourseCompletions(false);
    }
  }

  useEffect(() => {
    loadUsers();
    loadCategories();
    loadCourses();
    loadLessons();
    loadEnrollments();
    loadCourseProgress();
    loadCourseCompletions();
  }, []);


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

  function handleFillFakeCourse() {
    const fakeCourse = generateFakeCourse();
    if (categories.length > 0) {
      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];
      fakeCourse.categoryId = String(randomCategory.id);
    }
    setCourseForm(fakeCourse);
    setEditingCourseId(null);
  }

  async function handleCategorySubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    const name = categoryForm.name.trim();

    if (!name) {
      setError("Category requires a name.");
      return;
    }

    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, { name });
        setNotice("Category updated.");
      } else {
        await createCategory({ name });
        setNotice("Category created.");
      }
      setCategoryForm(emptyCategoryForm);
      setEditingCategoryId(null);
      await loadCategories();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleEditCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name });
  }

  function handleCancelCategory() {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
  }

  function handleFillFakeCategory() {
    const fakeCategory = generateFakeCategory();
    setCategoryForm(fakeCategory);
    setEditingCategoryId(null);
  }

  async function handleDeleteCategory(category: Category) {
    if (!confirm(`Delete category "${category.name}"?`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await deleteCategory(category.id);
      setNotice("Category deleted.");
      await loadCategories();
    } catch (err) {
      setError((err as Error).message);
    }
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

  async function handleEnrollmentSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    const userId = Number(enrollmentForm.userId);
    const courseId = Number(enrollmentForm.courseId);
    const status = enrollmentForm.status;

    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Enrollment requires a valid user.");
      return;
    }
    if (!Number.isInteger(courseId) || courseId <= 0) {
      setError("Enrollment requires a valid course.");
      return;
    }

    const payload = { userId, courseId, status };

    try {
      if (editingEnrollmentId) {
        await updateEnrollment(editingEnrollmentId, payload);
        setNotice("Enrollment updated.");
      } else {
        await createEnrollment(payload);
        setNotice("Enrollment created.");
      }
      setEnrollmentForm(emptyEnrollmentForm);
      setEditingEnrollmentId(null);
      await loadEnrollments(showActiveEnrollments ? "active" : undefined);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleEditEnrollment(enrollment: Enrollment) {
    setEditingEnrollmentId(enrollment.id);
    setEnrollmentForm({
      userId: String(enrollment.userId),
      courseId: String(enrollment.courseId),
      status: enrollment.status
    });
  }

  function handleCancelEnrollment() {
    setEditingEnrollmentId(null);
    setEnrollmentForm(emptyEnrollmentForm);
  }

  function handleFillFakeEnrollment() {
    const fakeEnrollment = generateFakeEnrollment();
    if (!fakeEnrollment) {
      setError("Create at least one user and course before fake enrollments.");
      return;
    }
    setEnrollmentForm(fakeEnrollment);
    setEditingEnrollmentId(null);
  }

  async function handleDeleteEnrollment(enrollment: Enrollment) {
    if (!confirm(`Delete enrollment for ${enrollment.userName}?`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await deleteEnrollment(enrollment.id);
      setNotice("Enrollment deleted.");
      await loadEnrollments(showActiveEnrollments ? "active" : undefined);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleToggleActiveEnrollments() {
    const nextValue = !showActiveEnrollments;
    setShowActiveEnrollments(nextValue);
    await loadEnrollments(nextValue ? "active" : undefined);
  }

  async function handleCourseProgressSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    const userId = Number(courseProgressForm.userId);
    const courseId = Number(courseProgressForm.courseId);
    const percentComplete = Number(courseProgressForm.percentComplete);

    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Course progress requires a valid user.");
      return;
    }
    if (!Number.isInteger(courseId) || courseId <= 0) {
      setError("Course progress requires a valid course.");
      return;
    }
    if (
      !Number.isInteger(percentComplete) ||
      percentComplete < 0 ||
      percentComplete > 100
    ) {
      setError("Percent complete must be an integer between 0 and 100.");
      return;
    }

    const payload = { userId, courseId, percentComplete };

    try {
      if (editingCourseProgressId) {
        await updateCourseProgress(editingCourseProgressId, payload);
        setNotice("Course progress updated.");
      } else {
        await createCourseProgress(payload);
        setNotice("Course progress created.");
      }
      setCourseProgressForm(emptyCourseProgressForm);
      setEditingCourseProgressId(null);
      await loadCourseProgress();
      await loadCourseCompletions();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleEditCourseProgress(progress: CourseProgress) {
    setEditingCourseProgressId(progress.id);
    setCourseProgressForm({
      userId: String(progress.userId),
      courseId: String(progress.courseId),
      percentComplete: String(progress.percentComplete)
    });
  }

  function handleCancelCourseProgress() {
    setEditingCourseProgressId(null);
    setCourseProgressForm(emptyCourseProgressForm);
  }

  function handleFillFakeCourseProgress() {
    const fakeProgress = generateFakeCourseProgress();
    if (!fakeProgress) {
      setError("Create at least one user and course before fake progress.");
      return;
    }
    setCourseProgressForm(fakeProgress);
    setEditingCourseProgressId(null);
  }

  async function handleDeleteCourseProgress(progress: CourseProgress) {
    if (!confirm(`Delete progress for ${progress.userName}?`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await deleteCourseProgress(progress.id);
      setNotice("Course progress deleted.");
      await loadCourseProgress();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="page layout">
      <aside className="sidebar" role="tablist" aria-label="Manage entities">
        <div className="sidebar-title">Admin</div>
        <button
          className={`sidebar-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
          type="button"
          role="tab"
          aria-selected={activeTab === "users"}
        >
          Users
        </button>
        <button
          className={`sidebar-tab ${activeTab === "courses" ? "active" : ""}`}
          onClick={() => setActiveTab("courses")}
          type="button"
          role="tab"
          aria-selected={activeTab === "courses"}
        >
          Courses
        </button>
        <button
          className={`sidebar-tab ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
          type="button"
          role="tab"
          aria-selected={activeTab === "categories"}
        >
          Categories
        </button>
        <button
          className={`sidebar-tab ${activeTab === "lessons" ? "active" : ""}`}
          onClick={() => setActiveTab("lessons")}
          type="button"
          role="tab"
          aria-selected={activeTab === "lessons"}
        >
          Lessons
        </button>
        <button
          className={`sidebar-tab ${
            activeTab === "enrollments" ? "active" : ""
          }`}
          onClick={() => setActiveTab("enrollments")}
          type="button"
          role="tab"
          aria-selected={activeTab === "enrollments"}
        >
          Enrollments
        </button>
        <button
          className={`sidebar-tab ${activeTab === "progress" ? "active" : ""}`}
          onClick={() => setActiveTab("progress")}
          type="button"
          role="tab"
          aria-selected={activeTab === "progress"}
        >
          Progress
        </button>
      </aside>

      <div className="content">
        {(error || notice) && (
          <div className="alerts">
            {error && <div className="alert error">{error}</div>}
            {notice && <div className="alert success">{notice}</div>}
          </div>
        )}

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
                        <button
                          className="link"
                          onClick={() => handleEditUser(user)}
                        >
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
                  Category
                  <select
                    value={courseForm.categoryId}
                    onChange={(event) =>
                      setCourseForm({
                        ...courseForm,
                        categoryId: event.target.value
                      })
                    }
                    required
                    disabled={categories.length === 0}
                  >
                    <option value="">
                      {categories.length === 0
                        ? "No categories yet"
                        : "Select a category"}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
                      setCourseForm({
                        ...courseForm,
                        description: event.target.value
                      })
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
                  {!editingCourseId && (
                    <button
                      className="button ghost"
                      type="button"
                      onClick={handleFillFakeCourse}
                    >
                      Fake data
                    </button>
                  )}
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
                        <button
                          className="link"
                          onClick={() => handleEditCourse(course)}
                        >
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

      {activeTab === "categories" && (
        <section className="split-panel" role="tabpanel">
          <div className="panel form-panel">
            <h2>{editingCategoryId ? "Edit category" : "Add a category"}</h2>
            <form className="form form-compact" onSubmit={handleCategorySubmit}>
              <label>
                Name
                <input
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm({ name: event.target.value })
                  }
                  placeholder="Analytics"
                  required
                />
              </label>
              <div className="form-actions">
                <button className="button" type="submit">
                  {editingCategoryId ? "Save category" : "Create category"}
                </button>
                {!editingCategoryId && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleFillFakeCategory}
                  >
                    Fake data
                  </button>
                )}
                {editingCategoryId && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleCancelCategory}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel table-panel">
            <div className="table-header">
              <h2>Categories</h2>
              <span className="count">{categories.length} total</span>
            </div>

            {loadingCategories ? (
              <p className="muted">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="muted">No categories yet. Create one on the left.</p>
            ) : (
              <div className="table">
                <div className="table-row table-head">
                  <span>Name</span>
                  <span>Created</span>
                  <span></span>
                </div>
                {categories.map((category) => (
                  <div className="table-row" key={category.id}>
                    <div>
                      <strong>{category.name}</strong>
                    </div>
                    <div>{new Date(category.createdAt).toLocaleDateString()}</div>
                    <div className="row-actions">
                      <button
                        className="link"
                        onClick={() => handleEditCategory(category)}
                      >
                        Edit
                      </button>
                      <button
                        className="link danger"
                        onClick={() => handleDeleteCategory(category)}
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

      {activeTab === "enrollments" && (
        <section className="split-panel" role="tabpanel">
          <div className="panel form-panel">
            <h2>{editingEnrollmentId ? "Edit enrollment" : "Add enrollment"}</h2>
            <form className="form form-compact" onSubmit={handleEnrollmentSubmit}>
              <label>
                User
                <select
                  value={enrollmentForm.userId}
                  onChange={(event) =>
                    setEnrollmentForm({
                      ...enrollmentForm,
                      userId: event.target.value
                    })
                  }
                  required
                  disabled={users.length === 0}
                >
                  <option value="">
                    {users.length === 0 ? "No users yet" : "Select a user"}
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Course
                <select
                  value={enrollmentForm.courseId}
                  onChange={(event) =>
                    setEnrollmentForm({
                      ...enrollmentForm,
                      courseId: event.target.value
                    })
                  }
                  required
                  disabled={courses.length === 0}
                >
                  <option value="">
                    {courses.length === 0 ? "No courses yet" : "Select a course"}
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={enrollmentForm.status}
                  onChange={(event) =>
                    setEnrollmentForm({
                      ...enrollmentForm,
                      status: event.target.value
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <div className="form-actions">
                <button className="button" type="submit">
                  {editingEnrollmentId ? "Save enrollment" : "Create enrollment"}
                </button>
                {!editingEnrollmentId && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleFillFakeEnrollment}
                  >
                    Fake data
                  </button>
                )}
                {editingEnrollmentId && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleCancelEnrollment}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel table-panel">
            <div className="table-header">
              <h2>Enrollments</h2>
              <div className="table-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={handleToggleActiveEnrollments}
                  disabled={loadingEnrollments}
                >
                  {showActiveEnrollments ? "Show all" : "Show active only"}
                </button>
                <span className="count">{enrollments.length} total</span>
              </div>
            </div>

            {loadingEnrollments ? (
              <p className="muted">Loading enrollments...</p>
            ) : enrollments.length === 0 ? (
              <p className="muted">No enrollments yet. Create one on the left.</p>
            ) : (
              <div className="table">
                <div className="table-row table-head enrollments-row">
                  <span>User</span>
                  <span>Course</span>
                  <span>Status</span>
                  <span>Enrolled</span>
                  <span></span>
                </div>
                {enrollments.map((enrollment) => (
                  <div className="table-row enrollments-row" key={enrollment.id}>
                    <div>
                      <strong>
                        {enrollment.userName ||
                          `User #${enrollment.userId}`}
                      </strong>
                      <div className="muted">{enrollment.userEmail}</div>
                    </div>
                    <div>
                      {enrollment.courseTitle ||
                        `Course #${enrollment.courseId}`}
                    </div>
                    <div>{enrollment.status}</div>
                    <div>
                      {enrollment.enrolledAt
                        ? new Date(enrollment.enrolledAt).toLocaleDateString()
                        : "—"}
                    </div>
                    <div className="row-actions">
                      <button
                        className="link"
                        onClick={() => handleEditEnrollment(enrollment)}
                      >
                        Edit
                      </button>
                      <button
                        className="link danger"
                        onClick={() => handleDeleteEnrollment(enrollment)}
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

      {activeTab === "progress" && (
        <section className="split-panel" role="tabpanel">
          <div className="panel form-panel">
            <h2>
              {editingCourseProgressId ? "Edit progress" : "Set course progress"}
            </h2>
            <form
              className="form form-compact"
              onSubmit={handleCourseProgressSubmit}
            >
              <label>
                User
                <select
                  value={courseProgressForm.userId}
                  onChange={(event) =>
                    setCourseProgressForm({
                      ...courseProgressForm,
                      userId: event.target.value
                    })
                  }
                  required
                  disabled={users.length === 0}
                >
                  <option value="">
                    {users.length === 0 ? "No users yet" : "Select a user"}
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Course
                <select
                  value={courseProgressForm.courseId}
                  onChange={(event) =>
                    setCourseProgressForm({
                      ...courseProgressForm,
                      courseId: event.target.value
                    })
                  }
                  required
                  disabled={courses.length === 0}
                >
                  <option value="">
                    {courses.length === 0 ? "No courses yet" : "Select a course"}
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Percent complete
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={courseProgressForm.percentComplete}
                  onChange={(event) =>
                    setCourseProgressForm({
                      ...courseProgressForm,
                      percentComplete: event.target.value
                    })
                  }
                  placeholder="0"
                  required
                />
              </label>
              <div className="form-actions">
                <button className="button" type="submit">
                  {editingCourseProgressId ? "Save progress" : "Set progress"}
                </button>
                {!editingCourseProgressId && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleFillFakeCourseProgress}
                  >
                    Fake data
                  </button>
                )}
                {editingCourseProgressId && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleCancelCourseProgress}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel-stack">
            <div className="panel table-panel">
              <div className="table-header">
                <h2>Course progress</h2>
                <span className="count">{courseProgress.length} total</span>
              </div>

              {loadingCourseProgress ? (
                <p className="muted">Loading progress...</p>
              ) : courseProgress.length === 0 ? (
                <p className="muted">
                  No course progress yet. Set one on the left.
                </p>
              ) : (
                <div className="table">
                  <div className="table-row table-head progress-row">
                    <span>User</span>
                    <span>Course</span>
                    <span>Percent</span>
                    <span>Updated</span>
                    <span></span>
                  </div>
                  {courseProgress.map((progress) => (
                    <div className="table-row progress-row" key={progress.id}>
                      <div>
                        <strong>
                          {progress.userName || `User #${progress.userId}`}
                        </strong>
                        <div className="muted">{progress.userEmail}</div>
                      </div>
                      <div>
                        {progress.courseTitle || `Course #${progress.courseId}`}
                      </div>
                      <div>{progress.percentComplete}%</div>
                      <div>
                        {progress.updatedAt
                          ? new Date(progress.updatedAt).toLocaleDateString()
                          : "—"}
                      </div>
                      <div className="row-actions">
                        <button
                          className="link"
                          onClick={() => handleEditCourseProgress(progress)}
                        >
                          Edit
                        </button>
                        <button
                          className="link danger"
                          onClick={() => handleDeleteCourseProgress(progress)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel table-panel">
              <div className="table-header">
                <h2>Course completions</h2>
                <span className="count">{courseCompletions.length} total</span>
              </div>

              {loadingCourseCompletions ? (
                <p className="muted">Loading completions...</p>
              ) : courseCompletions.length === 0 ? (
                <p className="muted">No course completions yet.</p>
              ) : (
                <div className="table">
                  <div className="table-row table-head completions-row">
                    <span>User</span>
                    <span>Course</span>
                    <span>Completed</span>
                  </div>
                  {courseCompletions.map((completion) => (
                    <div
                      className="table-row completions-row"
                      key={completion.id}
                    >
                      <div>
                        <strong>
                          {completion.userName || `User #${completion.userId}`}
                        </strong>
                        <div className="muted">{completion.userEmail}</div>
                      </div>
                      <div>
                        {completion.courseTitle ||
                          `Course #${completion.courseId}`}
                      </div>
                      <div>
                        {completion.completedAt
                          ? new Date(
                              completion.completedAt
                            ).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
