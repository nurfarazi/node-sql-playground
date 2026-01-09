import { useState } from "react";
import {
  checkDatabase,
  createDatabase,
  createLearningPlatform,
  fetchTableCounts,
  fetchViewCount
} from "./api";
import "./styles.css";

type TableCount = {
  name: string;
  status: "ok" | "missing";
  count?: number;
};

export default function SettingsPage() {
  const [checkingDb, setCheckingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<"unknown" | "exists" | "missing">(
    "unknown"
  );
  const [tableCounts, setTableCounts] = useState<TableCount[]>([]);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [countsFetched, setCountsFetched] = useState(false);
  const [countsDatabase, setCountsDatabase] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [viewDatabase, setViewDatabase] = useState<string | null>(null);
  const [loadingViews, setLoadingViews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const statusLabel =
    dbStatus === "exists"
      ? "Database exists"
      : dbStatus === "missing"
        ? "Database missing"
        : "Unknown status";
  const statusClass =
    dbStatus === "exists" ? "success" : dbStatus === "missing" ? "danger" : "neutral";

  async function handleCreateDb() {
    setNotice(null);
    setError(null);
    try {
      await createDatabase();
      setNotice("Database ready.");
      setDbStatus("exists");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCheckDb() {
    setCheckingDb(true);
    setNotice(null);
    setError(null);
    try {
      const data = await checkDatabase();
      if (data.exists) {
        setDbStatus("exists");
        setNotice("Database exists.");
      } else {
        setDbStatus("missing");
        setNotice("Database not found.");
      }
    } catch (err) {
      setDbStatus("unknown");
      setError((err as Error).message);
    } finally {
      setCheckingDb(false);
    }
  }

  async function handleCreateLearningPlatform() {
    setNotice(null);
    setError(null);
    try {
      await createLearningPlatform();
      setNotice("Learning platform schema ready.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleFetchTableCounts() {
    setLoadingCounts(true);
    setNotice(null);
    setError(null);
    try {
      const data = await fetchTableCounts();
      setTableCounts(data.tables);
      setCountsDatabase(data.database);
      setCountsFetched(true);
      setNotice("Table counts loaded.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingCounts(false);
    }
  }

  async function handleFetchViewCount() {
    setLoadingViews(true);
    setNotice(null);
    setError(null);
    try {
      const data = await fetchViewCount();
      setViewCount(data.count);
      setViewDatabase(data.database);
      setNotice("View count loaded.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingViews(false);
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Node + MSSQL</p>
          <h1>Settings</h1>
          <p className="subtitle">
            Database setup and environment details live here.
          </p>
        </div>
        <div className="hero-actions">
          <button className="button" onClick={handleCreateDb}>
            Create Database
          </button>
          <button className="button ghost" onClick={handleCreateLearningPlatform}>
            Create Learning Platform
          </button>
        </div>
      </header>

      <section className="status-strip">
        <div className="status-block">
          <span className="status-chip">DB</span>
          <div>
            <p className="status-title">Database status</p>
            <p className="status-meta">Uses DB_DATABASE from backend config</p>
          </div>
          <span className={`pill ${statusClass}`}>{statusLabel}</span>
        </div>
        <div className="status-actions">
          <button
            className="button ghost"
            onClick={handleCheckDb}
            disabled={checkingDb}
          >
            {checkingDb ? "Checking..." : "Check Database"}
          </button>
        </div>
      </section>

      {(error || notice) && (
        <div className="alerts">
          {error && <div className="alert error">{error}</div>}
          {notice && <div className="alert success">{notice}</div>}
        </div>
      )}

      <section className="panel">
        <div className="table-header">
          <div>
            <h2>Views</h2>
            <p className="status-meta">
              dbo views
              {viewDatabase ? ` in ${viewDatabase}` : ""}
            </p>
          </div>
          <button
            className="button ghost"
            onClick={handleFetchViewCount}
            disabled={loadingViews}
          >
            {loadingViews ? "Loading..." : "Refresh views"}
          </button>
        </div>

        {loadingViews ? (
          <p className="muted">Loading view count...</p>
        ) : viewCount === null ? (
          <p className="muted">Load to see how many dbo views exist.</p>
        ) : (
          <div className="status-strip">
            <div className="status-block">
              <span className="status-chip">VW</span>
              <div>
                <p className="status-title">Total dbo views</p>
                <p className="status-meta">Count of views in schema dbo</p>
              </div>
              <span className="pill neutral">{viewCount}</span>
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="table-header">
          <div>
            <h2>Table counts</h2>
            <p className="status-meta">
              Learning platform tables
              {countsDatabase ? ` in ${countsDatabase}` : ""}
            </p>
          </div>
          <button
            className="button ghost"
            onClick={handleFetchTableCounts}
            disabled={loadingCounts}
          >
            {loadingCounts ? "Loading..." : "Refresh counts"}
          </button>
        </div>

        {loadingCounts ? (
          <p className="muted">Loading table counts...</p>
        ) : !countsFetched ? (
          <p className="muted">Load counts to see records per table.</p>
        ) : tableCounts.length === 0 ? (
          <p className="muted">No tables configured.</p>
        ) : (
          <div className="table">
            <div className="table-row table-head counts-row">
              <span>Table</span>
              <span>Status</span>
              <span>Count</span>
            </div>
            {tableCounts.map((table) => (
              <div className="table-row counts-row" key={table.name}>
                <div>
                  <strong>{table.name}</strong>
                </div>
                <div>
                  <span
                    className={`pill ${
                      table.status === "ok" ? "success" : "danger"
                    }`}
                  >
                    {table.status === "ok" ? "ok" : "missing"}
                  </span>
                </div>
                <div>{table.status === "ok" ? table.count ?? 0 : "—"}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
