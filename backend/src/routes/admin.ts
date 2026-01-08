import { Router } from "express";
import { ensureDatabaseAndTable } from "../schema";

const router = Router();

router.post("/create-db", async (_req, res) => {
  try {
    await ensureDatabaseAndTable();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Database creation failed" });
  }
});

export default router;
