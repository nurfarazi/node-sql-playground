import { useState } from "react";
import HomePage from "./HomePage";
import SettingsPage from "./SettingsPage";
import "./styles.css";

type Page = "home" | "settings";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="nav-brand">Node + MSSQL</div>
        <div className="nav-actions">
          <button
            className={`nav-link ${currentPage === "home" ? "active" : ""}`}
            onClick={() => setCurrentPage("home")}
            type="button"
          >
            Home
          </button>
          <button
            className={`nav-link ${currentPage === "settings" ? "active" : ""}`}
            onClick={() => setCurrentPage("settings")}
            type="button"
          >
            Settings
          </button>
        </div>
      </nav>
      {currentPage === "home" && (
        <HomePage />
      )}
      {currentPage === "settings" && (
        <SettingsPage />
      )}
    </div>
  );
}
