import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import WorldMapPage from "./pages/WorldMapPage/WorldMapPage";
import DetailsPage from "./pages/DetailsPage/DetailsPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorldMapPage />} />
        <Route path="/details/:country" element={<DetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
