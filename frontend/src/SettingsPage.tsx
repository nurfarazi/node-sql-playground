import { useEffect, useState, type FormEvent } from "react";
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser
} from "./api";
import { User } from "./types";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: ""
};

const fakeFirstNames = [
  "Ava",
  "Noah",
  "Maya",
  "Leo",
  "Zoe",
  "Nina",
  "Omar",
  "Ezra"
];
const fakeLastNames = [
  "Singh",
  "Chen",
  "Lopez",
  "Patel",
  "Kim",
  "Garcia",
  "Nguyen",
  "Brown"
];
const fakeDomains = ["example.com", "mail.test", "demo.local"];

interface SettingsPageProps {
  onNavigateHome: () => void;
}

export default function SettingsPage({ onNavigateHome }: SettingsPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  function generateFakeUser() {
    const firstName =
      fakeFirstNames[Math.floor(Math.random() * fakeFirstNames.length)];
    const lastName =
      fakeLastNames[Math.floor(Math.random() * fakeLastNames.length)];
    const domain = fakeDomains[Math.floor(Math.random() * fakeDomains.length)];
    const suffix = Math.floor(Math.random() * 900 + 100);
    return {
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@${domain}`
    };
  }

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
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleFillFakeUser() {
    const fakeUser = generateFakeUser();
    setForm(fakeUser);
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

  return (
    <div className="page">
      <header className="hero">
        <div>
          <button className="link" onClick={onNavigateHome} style={{ marginBottom: "1rem" }}>
            ← Back to Home
          </button>
          <p className="eyebrow">Node + MSSQL</p>
          <h1>User Directory</h1>
          <p className="subtitle">
            Basic CRUD with a white, airy interface. Manage users in real time.
          </p>
        </div>
        <div className="hero-actions">
          <button className="button ghost" onClick={loadUsers} disabled={loading}>
            Refresh
          </button>
        </div>
      </header>

      {(error || notice) && (
        <div className="alerts">
          {error && <div className="alert error">{error}</div>}
          {notice && <div className="alert success">{notice}</div>}
        </div>
      )}

      <section className="split-panel" role="tabpanel">
        <div className="panel form-panel">
          <h2>{editingId ? "Edit user" : "Add a new user"}</h2>
          <form className="form form-compact" onSubmit={handleSubmit}>
            <label>
              First name
              <input
                value={form.firstName}
                onChange={(event) =>
                  setForm({ ...form, firstName: event.target.value })
                }
                placeholder="Ada"
                required
              />
            </label>
            <label>
              Last name
              <input
                value={form.lastName}
                onChange={(event) =>
                  setForm({ ...form, lastName: event.target.value })
                }
                placeholder="Lovelace"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="ada@example.com"
                required
              />
            </label>
            <div className="form-actions">
              <button className="button" type="submit">
                {editingId ? "Save changes" : "Create user"}
              </button>
              {!editingId && (
                <button
                  className="button ghost"
                  type="button"
                  onClick={handleFillFakeUser}
                >
                  Fake data
                </button>
              )}
              {editingId && (
                <button className="button ghost" type="button" onClick={handleCancel}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="panel table-panel">
          <div className="table-header">
            <h2>Users</h2>
            <span className="count">{users.length} total</span>
          </div>

          {loading ? (
            <p className="muted">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="muted">No users yet. Create one on the left.</p>
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
                  <div>{new Date(user.createdAt).toLocaleDateString()}</div>
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
        </div>
      </section>
    </div>
  );
}
