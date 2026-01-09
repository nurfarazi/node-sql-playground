import { useState } from "react";
import HomePage from "./HomePage";
import SettingsPage from "./SettingsPage";
import "./styles.css";

type Page = "home" | "settings";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  return (
    <>
      {currentPage === "home" && (
        <HomePage onNavigateSettings={() => setCurrentPage("settings")} />
      )}
      {currentPage === "settings" && (
        <SettingsPage onNavigateHome={() => setCurrentPage("home")} />
      )}
    </>
  );
}
