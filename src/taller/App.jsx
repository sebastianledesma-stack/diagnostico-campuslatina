// Diagnóstico colectivo: versión en vivo del diagnóstico para el taller en sala. Dos frontends:
//   /s/<código>  asistente (teléfono, sin login ni datos)
//   /f/<código>  expositor (escritorio): lo que se proyecta, con los controles encima (con clave)
// Además: /f crea una sesión y /p/<código> es la pantalla espejo, sin controles.
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Participante from "./pages/Participante.jsx";
import Ingresar from "./pages/Ingresar.jsx";

// El teléfono baja solo su parte: lo del expositor se carga aparte.
const Crear = lazy(() => import("./pages/Crear.jsx"));
const Expositor = lazy(() => import("./pages/Expositor.jsx"));
const Proyeccion = lazy(() => import("./pages/Proyeccion.jsx"));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/s/:codigo" element={<Participante />} />
        <Route path="/f" element={<Crear />} />
        <Route path="/f/:codigo" element={<Expositor />} />
        <Route path="/p/:codigo" element={<Proyeccion />} />
        <Route path="*" element={<Ingresar />} />
      </Routes>
    </Suspense>
  );
}
