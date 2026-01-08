import { Router } from "express";
import { getPool, sql } from "../db";

const router = Router();

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

router.get("/", async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id, FirstName, LastName, Email, CreatedAt
      FROM dbo.Users
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
      .query(
        "SELECT Id, FirstName, LastName, Email, CreatedAt FROM dbo.Users WHERE Id = @Id"
      );

    const user = result.recordset[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", async (req, res) => {
  const firstName = toTrimmed(req.body.firstName);
  const lastName = toTrimmed(req.body.lastName);
  const email = toTrimmed(req.body.email).toLowerCase();

  if (!firstName || !lastName || !email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid user data" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("FirstName", sql.NVarChar(100), firstName)
      .input("LastName", sql.NVarChar(100), lastName)
      .input("Email", sql.NVarChar(255), email)
      .query(`
        INSERT INTO dbo.Users (FirstName, LastName, Email)
        OUTPUT inserted.Id, inserted.FirstName, inserted.LastName, inserted.Email, inserted.CreatedAt
        VALUES (@FirstName, @LastName, @Email)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: "Email already exists" });
    }

    res.status(500).json({ error: "Database error" });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const firstName = toTrimmed(req.body.firstName);
  const lastName = toTrimmed(req.body.lastName);
  const email = toTrimmed(req.body.email).toLowerCase();

  if (!firstName || !lastName || !email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid user data" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("FirstName", sql.NVarChar(100), firstName)
      .input("LastName", sql.NVarChar(100), lastName)
      .input("Email", sql.NVarChar(255), email)
      .query(`
        UPDATE dbo.Users
        SET FirstName = @FirstName,
            LastName = @LastName,
            Email = @Email
        OUTPUT inserted.Id, inserted.FirstName, inserted.LastName, inserted.Email, inserted.CreatedAt
        WHERE Id = @Id
      `);

    const user = result.recordset[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: "Email already exists" });
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
      .query("DELETE FROM dbo.Users WHERE Id = @Id; SELECT @@ROWCOUNT AS count;");

    const deleted = result.recordset[0]?.count ?? 0;
    if (deleted === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
