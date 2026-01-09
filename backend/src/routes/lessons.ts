import { Router } from "express";
import { getPool, sql } from "../db";

const router = Router();

function toTrimmed(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function toOptionalText(value: unknown) {
  const text = toTrimmed(value);
  return text.length === 0 ? null : text;
}

function toPositiveInt(value: unknown) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

router.get("/", async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id, CourseId, Title, Content, Position, CreatedAt, UpdatedAt
      FROM dbo.Lessons
      ORDER BY Id DESC
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
    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query(
        `
          SELECT Id, CourseId, Title, Content, Position, CreatedAt, UpdatedAt
          FROM dbo.Lessons
          WHERE Id = @Id
        `
      );

    const lesson = result.recordset[0];
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", async (req, res) => {
  const courseId = toPositiveInt(req.body.courseId);
  const title = toTrimmed(req.body.title);
  const content = toOptionalText(req.body.content);
  const position = toPositiveInt(req.body.position) ?? 1;

  if (!courseId || !title) {
    return res.status(400).json({ error: "Invalid lesson data" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("CourseId", sql.Int, courseId)
      .input("Title", sql.NVarChar(200), title)
      .input("Content", sql.NVarChar(sql.MAX), content)
      .input("Position", sql.Int, position)
      .query(`
        INSERT INTO dbo.Lessons (CourseId, Title, Content, Position)
        OUTPUT inserted.Id, inserted.CourseId, inserted.Title, inserted.Content,
               inserted.Position, inserted.CreatedAt, inserted.UpdatedAt
        VALUES (@CourseId, @Title, @Content, @Position)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/:id", async (req, res) => {
  const id = toPositiveInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const courseId = toPositiveInt(req.body.courseId);
  const title = toTrimmed(req.body.title);
  const content = toOptionalText(req.body.content);
  const position = toPositiveInt(req.body.position) ?? 1;

  if (!courseId || !title) {
    return res.status(400).json({ error: "Invalid lesson data" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("CourseId", sql.Int, courseId)
      .input("Title", sql.NVarChar(200), title)
      .input("Content", sql.NVarChar(sql.MAX), content)
      .input("Position", sql.Int, position)
      .query(`
        UPDATE dbo.Lessons
        SET CourseId = @CourseId,
            Title = @Title,
            Content = @Content,
            Position = @Position,
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT inserted.Id, inserted.CourseId, inserted.Title, inserted.Content,
               inserted.Position, inserted.CreatedAt, inserted.UpdatedAt
        WHERE Id = @Id
      `);

    const lesson = result.recordset[0];
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.json(lesson);
  } catch (error) {
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
      .query("DELETE FROM dbo.Lessons WHERE Id = @Id; SELECT @@ROWCOUNT AS count;");

    const deleted = result.recordset[0]?.count ?? 0;
    if (deleted === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
