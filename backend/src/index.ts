import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import adminRouter from "./routes/admin";
import categoriesRouter from "./routes/categories";
import courseCompletionsRouter from "./routes/courseCompletions";
import courseProgressRouter from "./routes/courseProgress";
import coursesRouter from "./routes/courses";
import enrollmentsRouter from "./routes/enrollments";
import lessonsRouter from "./routes/lessons";
import usersRouter from "./routes/users";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/admin", adminRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/course-completions", courseCompletionsRouter);
app.use("/api/course-progress", courseProgressRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/enrollments", enrollmentsRouter);
app.use("/api/lessons", lessonsRouter);
app.use("/api/users", usersRouter);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
