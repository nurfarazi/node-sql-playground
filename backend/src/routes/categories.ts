import { Router } from "express";
import { getPool, sql } from "../db";

const router = Router();

function toTrimmed(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function isUniqueViolation(error: unknown) {
  const code = (error as { number?: number })?.number;
  return code === 2627 || code === 2601;
}

function isForeignKeyViolation(error: unknown) {
  const code = (error as { number?: number })?.number;
  return code === 547;
}

router.get("/", async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id, Name, CreatedAt
      FROM dbo.Categories
      ORDER BY Id DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query("SELECT Id, Name, CreatedAt FROM dbo.Categories WHERE Id = @Id");

    const category = result.recordset[0];
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", async (req, res) => {
  const name = toTrimmed(req.body.name);

  if (!name) {
    return res.status(400).json({ error: "Invalid category data" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Name", sql.NVarChar(120), name)
      .query(`
        INSERT INTO dbo.Categories (Name)
        OUTPUT inserted.Id, inserted.Name, inserted.CreatedAt
        VALUES (@Name)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: "Category already exists" });
    }

    res.status(500).json({ error: "Database error" });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const name = toTrimmed(req.body.name);

  if (!name) {
    return res.status(400).json({ error: "Invalid category data" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("Name", sql.NVarChar(120), name)
      .query(`
        UPDATE dbo.Categories
        SET Name = @Name
        OUTPUT inserted.Id, inserted.Name, inserted.CreatedAt
        WHERE Id = @Id
      `);

    const category = result.recordset[0];
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: "Category already exists" });
    }

    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query("DELETE FROM dbo.Categories WHERE Id = @Id; SELECT @@ROWCOUNT AS count;");

    const deleted = result.recordset[0]?.count ?? 0;
    if (deleted === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(204).send();
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return res.status(409).json({ error: "Category has courses" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
