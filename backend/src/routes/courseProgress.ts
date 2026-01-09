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

function toPercentInt(value: unknown) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0 || num > 100) {
    return null;
  }
  return num;
}

function isUniqueViolation(error: unknown) {
  const code = (error as { number?: number })?.number;
  return code === 2627 || code === 2601;
}

async function fetchCourseProgressById(
  pool: Awaited<ReturnType<typeof getPool>>,
  id: number
) {
  const result = await pool
    .request()
    .input("Id", sql.Int, id)
    .query(
      `
        SELECT
          CP.Id,
          CP.UserId,
          U.FirstName AS UserFirstName,
          U.LastName AS UserLastName,
          U.Email AS UserEmail,
          CP.CourseId,
          C.Title AS CourseTitle,
          CP.PercentComplete,
          CP.UpdatedAt
        FROM dbo.CourseProgress AS CP
        INNER JOIN dbo.Users AS U ON U.Id = CP.UserId
        INNER JOIN dbo.Courses AS C ON C.Id = CP.CourseId
        WHERE CP.Id = @Id
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

async function ensureCourseCompletion(
  pool: Awaited<ReturnType<typeof getPool>>,
  userId: number,
  courseId: number
) {
  await pool
    .request()
    .input("UserId", sql.Int, userId)
    .input("CourseId", sql.Int, courseId)
    .query(
      `
        IF NOT EXISTS (
          SELECT 1 FROM dbo.CourseCompletions
          WHERE UserId = @UserId AND CourseId = @CourseId
        )
        BEGIN
          INSERT INTO dbo.CourseCompletions (UserId, CourseId)
          VALUES (@UserId, @CourseId)
        END
      `
    );
}

router.get("/", async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        CP.Id,
        CP.UserId,
        U.FirstName AS UserFirstName,
        U.LastName AS UserLastName,
        U.Email AS UserEmail,
        CP.CourseId,
        C.Title AS CourseTitle,
        CP.PercentComplete,
        CP.UpdatedAt
      FROM dbo.CourseProgress AS CP
      INNER JOIN dbo.Users AS U ON U.Id = CP.UserId
      INNER JOIN dbo.Courses AS C ON C.Id = CP.CourseId
      ORDER BY CP.Id DESC
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
    const progress = await fetchCourseProgressById(pool, id);
    if (!progress) {
      return res.status(404).json({ error: "Course progress not found" });
    }
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", async (req, res) => {
  const userId = toPositiveInt(req.body.userId);
  const courseId = toPositiveInt(req.body.courseId);
  const percentComplete = toPercentInt(req.body.percentComplete);

  if (!userId || !courseId || percentComplete === null) {
    return res.status(400).json({ error: "Invalid course progress data" });
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
      .input("PercentComplete", sql.Int, percentComplete)
      .query(`
        INSERT INTO dbo.CourseProgress (UserId, CourseId, PercentComplete)
        OUTPUT inserted.Id
        VALUES (@UserId, @CourseId, @PercentComplete)
      `);

    const progressId = result.recordset[0]?.Id;
    if (!progressId) {
      return res.status(500).json({ error: "Course progress creation failed" });
    }

    if (percentComplete >= 100) {
      await ensureCourseCompletion(pool, userId, courseId);
    }

    const progress = await fetchCourseProgressById(pool, progressId);
    res.status(201).json(progress);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: "Course progress already exists" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/:id", async (req, res) => {
  const id = toPositiveInt(req.params.id);
  const userId = toPositiveInt(req.body.userId);
  const courseId = toPositiveInt(req.body.courseId);
  const percentComplete = toPercentInt(req.body.percentComplete);

  if (!id) {
    return res.status(400).json({ error: "Invalid id" });
  }
  if (!userId || !courseId || percentComplete === null) {
    return res.status(400).json({ error: "Invalid course progress data" });
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
      .input("PercentComplete", sql.Int, percentComplete)
      .query(`
        UPDATE dbo.CourseProgress
        SET UserId = @UserId,
            CourseId = @CourseId,
            PercentComplete = @PercentComplete,
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT inserted.Id
        WHERE Id = @Id
      `);

    const progressId = result.recordset[0]?.Id;
    if (!progressId) {
      return res.status(404).json({ error: "Course progress not found" });
    }

    if (percentComplete >= 100) {
      await ensureCourseCompletion(pool, userId, courseId);
    }

    const progress = await fetchCourseProgressById(pool, progressId);
    res.json(progress);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: "Course progress already exists" });
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
        "DELETE FROM dbo.CourseProgress WHERE Id = @Id; SELECT @@ROWCOUNT AS count;"
      );

    const deleted = result.recordset[0]?.count ?? 0;
    if (deleted === 0) {
      return res.status(404).json({ error: "Course progress not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
