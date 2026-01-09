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

router.get("/", async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        CC.Id,
        CC.UserId,
        U.FirstName AS UserFirstName,
        U.LastName AS UserLastName,
        U.Email AS UserEmail,
        CC.CourseId,
        C.Title AS CourseTitle,
        CC.CompletedAt
      FROM dbo.CourseCompletions AS CC
      INNER JOIN dbo.Users AS U ON U.Id = CC.UserId
      INNER JOIN dbo.Courses AS C ON C.Id = CC.CourseId
      ORDER BY CC.Id DESC
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
          SELECT
            CC.Id,
            CC.UserId,
            U.FirstName AS UserFirstName,
            U.LastName AS UserLastName,
            U.Email AS UserEmail,
            CC.CourseId,
            C.Title AS CourseTitle,
            CC.CompletedAt
          FROM dbo.CourseCompletions AS CC
          INNER JOIN dbo.Users AS U ON U.Id = CC.UserId
          INNER JOIN dbo.Courses AS C ON C.Id = CC.CourseId
          WHERE CC.Id = @Id
        `
      );

    const completion = result.recordset[0];
    if (!completion) {
      return res.status(404).json({ error: "Course completion not found" });
    }
    res.json(completion);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
