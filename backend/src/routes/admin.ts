import { Router } from "express";
import {
  databaseExists,
  ensureDatabaseAndTable,
  ensureLearningPlatformSchema
} from "../schema";

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

router.post("/create-learning-platform", async (_req, res) => {
  try {
    await ensureLearningPlatformSchema();
    res.json({ ok: true });
  } catch (error) {
    console.error("create-learning-platform error:", error);
    res.status(500).json({ error: "Learning platform schema creation failed" });
  }
});

export default router;
