import { useEffect, useState, type FormEvent } from "react";
import {
  checkDatabase,
  createDatabase,
  createLearningPlatform,
  createUser,
  deleteUser,
  fetchUsers,
  updateUser
} from "./api";
import { User } from "./types";
import "./styles.css";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: ""
};

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingDb, setCheckingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<"unknown" | "exists" | "missing">(
    "unknown"
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateDb() {
    setNotice(null);
    setError(null);
    try {
      await createDatabase();
      setNotice("Database ready.");
      setDbStatus("exists");
      await loadUsers();
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    try {
      if (editingId) {
        await updateUser(editingId, form);
        setNotice("User updated.");
      } else {
        await createUser(form);
        setNotice("User created.");
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleEdit(user: User) {
    setEditingId(user.id);
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete ${user.firstName} ${user.lastName}?`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await deleteUser(user.id);
      setNotice("User deleted.");
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const statusLabel =
    dbStatus === "exists"
      ? "Database exists"
      : dbStatus === "missing"
        ? "Database missing"
        : "Unknown status";
  const statusClass =
    dbStatus === "exists" ? "success" : dbStatus === "missing" ? "danger" : "neutral";

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Node + MSSQL</p>
          <h1>User Directory</h1>
          <p className="subtitle">
            Basic CRUD with a white, airy interface. Create the database on demand, then
            manage users in real time.
          </p>
        </div>
        <div className="hero-actions">
          <button className="button ghost" onClick={loadUsers} disabled={loading}>
            Refresh
          </button>
          <button className="button" onClick={handleCreateDb}>
            Create Database
          </button>
          <button className="button ghost" onClick={handleCreateLearningPlatform}>
            Create Learning Platform
          </button>
        </div>
      </header>

      <section className="panel">
        <h2>{editingId ? "Edit user" : "Add a new user"}</h2>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            First name
            <input
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              placeholder="Ada"
              required
            />
          </label>
          <label>
            Last name
            <input
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              placeholder="Lovelace"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="ada@example.com"
              required
            />
          </label>
          <div className="form-actions">
            <button className="button" type="submit">
              {editingId ? "Save changes" : "Create user"}
            </button>
            {editingId && (
              <button className="button ghost" type="button" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel table-panel">
        <div className="table-header">
          <h2>Users</h2>
          <span className="count">{users.length} total</span>
        </div>

        {error && <div className="alert error">{error}</div>}
        {notice && <div className="alert success">{notice}</div>}

        {loading ? (
          <p className="muted">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="muted">No users yet. Create one above.</p>
        ) : (
          <div className="table">
            <div className="table-row table-head">
              <span>Name</span>
              <span>Email</span>
              <span>Created</span>
              <span></span>
            </div>
            {users.map((user) => (
              <div className="table-row" key={user.id}>
                <div>
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                </div>
                <div>{user.email}</div>
                <div>{new Date(user.createdAt).toLocaleString()}</div>
                <div className="row-actions">
                  <button className="link" onClick={() => handleEdit(user)}>
                    Edit
                  </button>
                  <button className="link danger" onClick={() => handleDelete(user)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="status-bar">
        <div className="status-bar-inner">
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
        </div>
      </footer>
    </div>
  );
}
