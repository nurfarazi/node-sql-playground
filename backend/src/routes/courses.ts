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
      SELECT Id, CategoryId, Title, Description, Level, Status, CreatedAt, UpdatedAt
      FROM dbo.Courses
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
          SELECT Id, CategoryId, Title, Description, Level, Status, CreatedAt, UpdatedAt
          FROM dbo.Courses
          WHERE Id = @Id
        `
      );

    const course = result.recordset[0];
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", async (req, res) => {
  const categoryId = toPositiveInt(req.body.categoryId);
  const title = toTrimmed(req.body.title);
  const description = toOptionalText(req.body.description);
  const level = toOptionalText(req.body.level);
  const status = toOptionalText(req.body.status) ?? "draft";

  if (!categoryId || !title) {
    return res.status(400).json({ error: "Invalid course data" });
  }

  try {
    const pool = await getPool();
    const categoryExists = await pool
      .request()
      .input("Id", sql.Int, categoryId)
      .query("SELECT 1 AS ok FROM dbo.Categories WHERE Id = @Id");
    if (categoryExists.recordset.length === 0) {
      return res.status(400).json({ error: "Category not found" });
    }
    const result = await pool
      .request()
      .input("CategoryId", sql.Int, categoryId)
      .input("Title", sql.NVarChar(200), title)
      .input("Description", sql.NVarChar(sql.MAX), description)
      .input("Level", sql.NVarChar(50), level)
      .input("Status", sql.NVarChar(40), status)
      .query(`
        INSERT INTO dbo.Courses (CategoryId, Title, Description, Level, Status)
        OUTPUT inserted.Id, inserted.CategoryId, inserted.Title, inserted.Description,
               inserted.Level, inserted.Status, inserted.CreatedAt, inserted.UpdatedAt
        VALUES (@CategoryId, @Title, @Description, @Level, @Status)
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

  const categoryId = toPositiveInt(req.body.categoryId);
  const title = toTrimmed(req.body.title);
  const description = toOptionalText(req.body.description);
  const level = toOptionalText(req.body.level);
  const status = toOptionalText(req.body.status) ?? "draft";

  if (!categoryId || !title) {
    return res.status(400).json({ error: "Invalid course data" });
  }

  try {
    const pool = await getPool();
    const categoryExists = await pool
      .request()
      .input("Id", sql.Int, categoryId)
      .query("SELECT 1 AS ok FROM dbo.Categories WHERE Id = @Id");
    if (categoryExists.recordset.length === 0) {
      return res.status(400).json({ error: "Category not found" });
    }
    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("CategoryId", sql.Int, categoryId)
      .input("Title", sql.NVarChar(200), title)
      .input("Description", sql.NVarChar(sql.MAX), description)
      .input("Level", sql.NVarChar(50), level)
      .input("Status", sql.NVarChar(40), status)
      .query(`
        UPDATE dbo.Courses
        SET CategoryId = @CategoryId,
            Title = @Title,
            Description = @Description,
            Level = @Level,
            Status = @Status,
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT inserted.Id, inserted.CategoryId, inserted.Title, inserted.Description,
               inserted.Level, inserted.Status, inserted.CreatedAt, inserted.UpdatedAt
        WHERE Id = @Id
      `);

    const course = result.recordset[0];
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
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
      .query("DELETE FROM dbo.Courses WHERE Id = @Id; SELECT @@ROWCOUNT AS count;");

    const deleted = result.recordset[0]?.count ?? 0;
    if (deleted === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
