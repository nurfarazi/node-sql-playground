import { Router } from "express";
import { databaseExists, ensureDatabaseAndTable } from "../schema";

const router = Router();

router.post("/create-db", async (_req, res) => {
  try {
    await ensureDatabaseAndTable();
    res.json({ ok: true });
  } catch (error) {
    console.error("create-db error:", error);
    res.status(500).json({ error: "Database creation failed" });
  }
});

router.get("/db-exists", async (_req, res) => {
  try {
    const exists = await databaseExists();
    res.json({ exists });
  } catch (error) {
    console.error("db-exists error:", error);
    res.status(500).json({ error: "Database check failed" });
  }
});

export default router;
