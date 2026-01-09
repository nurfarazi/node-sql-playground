import { Router } from "express";
import { getPool, sql } from "../db";

const router = Router();

function toPositiveInt(value: unknown) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

const enrollmentStatuses = ["active", "paused", "completed", "cancelled"] as const;
type EnrollmentStatus = (typeof enrollmentStatuses)[number];

function toEnrollmentStatus(value: unknown): EnrollmentStatus | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return enrollmentStatuses.includes(normalized as EnrollmentStatus)
    ? (normalized as EnrollmentStatus)
    : null;
}

function isUniqueViolation(error: unknown) {
  const code = (error as { number?: number })?.number;
  return code === 2627 || code === 2601;
}

async function fetchEnrollmentById(pool: Awaited<ReturnType<typeof getPool>>, id: number) {
  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .query(
      `
        SELECT
          E.Id,
          E.UserId,
          U.FirstName AS UserFirstName,
          U.LastName AS UserLastName,
          U.Email AS UserEmail,
          E.CourseId,
          C.Title AS CourseTitle,
          E.Status,
          E.EnrolledAt
        FROM dbo.Enrollments AS E
        INNER JOIN dbo.Users AS U ON U.Id = E.UserId
        INNER JOIN dbo.Courses AS C ON C.Id = E.CourseId
        WHERE E.Id = @Id
      `
    );

  return result.recordset[0];
}

async function validateUserAndCourse(
  pool: Awaited<ReturnType<typeof getPool>>,
  userId: number,
  courseId: number
) {
  const userResult = await pool
    .request()
    .input("UserId", sql.Int, userId)
    .query("SELECT 1 AS ok FROM dbo.Users WHERE Id = @UserId");
  if (userResult.recordset.length === 0) {
    return { ok: false as const, error: "User not found" };
  }

  const courseResult = await pool
    .request()
    .input("CourseId", sql.Int, courseId)
    .query("SELECT 1 AS ok FROM dbo.Courses WHERE Id = @CourseId");
  if (courseResult.recordset.length === 0) {
    return { ok: false as const, error: "Course not found" };
  }

  return { ok: true as const };
}

router.get("/", async (_req, res) => {
  const status = _req.query.status;
  const statusFilter =
    status === undefined ? null : toEnrollmentStatus(status);
  if (status !== undefined && !statusFilter) {
    return res.status(400).json({ error: "Invalid status filter" });
  }

  try {
    const pool = await getPool();
    const request = pool.request();
    let source = "dbo.Enrollments";
    if (statusFilter === "active") {
      source = "dbo.ActiveEnrollments";
    } else if (statusFilter === "cancelled") {
      source = "dbo.CancelledEnrollments";
    }
    if (statusFilter && statusFilter !== "active") {
      request.input("Status", sql.NVarChar(40), statusFilter);
    }
    const result = await request.query(`
      SELECT
        E.Id,
        E.UserId,
        U.FirstName AS UserFirstName,
        U.LastName AS UserLastName,
        U.Email AS UserEmail,
        E.CourseId,
        C.Title AS CourseTitle,
        E.Status,
        E.EnrolledAt
      FROM ${source} AS E
      INNER JOIN dbo.Users AS U ON U.Id = E.UserId
      INNER JOIN dbo.Courses AS C ON C.Id = E.CourseId
      ${statusFilter && statusFilter !== "active" ? "WHERE E.Status = @Status" : ""}
      ORDER BY E.Id DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/:id", async (req, res) => {
  const id = toPositiveInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const pool = await getPool();
    const enrollment = await fetchEnrollmentById(pool, id);
    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", async (req, res) => {
  const userId = toPositiveInt(req.body.userId);
  const courseId = toPositiveInt(req.body.courseId);
  const status =
    req.body.status === undefined
      ? "active"
      : toEnrollmentStatus(req.body.status);

  if (!userId || !courseId || !status) {
    return res.status(400).json({ error: "Invalid enrollment data" });
  }

  try {
    const pool = await getPool();
    const validation = await validateUserAndCourse(pool, userId, courseId);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("CourseId", sql.Int, courseId)
      .input("Status", sql.NVarChar(40), status)
      .query(`
        INSERT INTO dbo.Enrollments (UserId, CourseId, Status)
        OUTPUT inserted.Id
        VALUES (@UserId, @CourseId, @Status)
      `);

    const enrollmentId = result.recordset[0]?.Id;
    if (!enrollmentId) {
      return res.status(500).json({ error: "Enrollment creation failed" });
    }

    const enrollment = await fetchEnrollmentById(pool, enrollmentId);
    res.status(201).json(enrollment);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: "User already enrolled in course" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/:id", async (req, res) => {
  const id = toPositiveInt(req.params.id);
  const userId = toPositiveInt(req.body.userId);
  const courseId = toPositiveInt(req.body.courseId);
  const status = toEnrollmentStatus(req.body.status);

  if (!id) {
    return res.status(400).json({ error: "Invalid id" });
  }
  if (!userId || !courseId || !status) {
    return res.status(400).json({ error: "Invalid enrollment data" });
  }

  try {
    const pool = await getPool();
    const validation = await validateUserAndCourse(pool, userId, courseId);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("UserId", sql.Int, userId)
      .input("CourseId", sql.Int, courseId)
      .input("Status", sql.NVarChar(40), status)
      .query(`
        UPDATE dbo.Enrollments
        SET UserId = @UserId,
            CourseId = @CourseId,
            Status = @Status
        OUTPUT inserted.Id
        WHERE Id = @Id
      `);

    const enrollmentId = result.recordset[0]?.Id;
    if (!enrollmentId) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const enrollment = await fetchEnrollmentById(pool, enrollmentId);
    res.json(enrollment);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: "User already enrolled in course" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = toPositiveInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query(
        "DELETE FROM dbo.Enrollments WHERE Id = @Id; SELECT @@ROWCOUNT AS count;"
      );

    const deleted = result.recordset[0]?.count ?? 0;
    if (deleted === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
