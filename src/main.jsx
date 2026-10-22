import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
// Estilos del campo de teléfono en el CSS principal (no con el componente diferido): así nunca se ve el selector sin estilos.
import "react-phone-number-input/style.css";
import "./components/PhoneField.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
