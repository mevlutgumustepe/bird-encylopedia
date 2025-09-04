// src/App.jsx
import WorldMapPage from "./pages/WorldMapPage/WorldMapPage";
import DetailsPage from "./pages/DetailsPage/DetailsPage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  return (
    // Vite, build sırasında BASE_URL'i '/bird-encylopedia/' olarak geçer
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<WorldMapPage />} />
        <Route path="/details/:country" element={<DetailsPage />} />
        {/* Eşleşmeyen her şeyi ana sayfaya ata (opsiyonel ama faydalı) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
