import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Diagnostico from "./pages/Diagnostico.jsx";

// El panel se carga aparte para no sumar peso al test público.
const Admin = lazy(() => import("./pages/Admin.jsx"));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Diagnostico />} />
      {/* Diagnóstico en curso o terminado: el link secreto se comparte con el equipo. */}
      <Route path="/d/:clave" element={<Diagnostico />} />
      <Route path="/admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
