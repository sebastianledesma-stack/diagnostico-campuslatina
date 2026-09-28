// Teléfono internacional: selector de país con código fijo (+54, +52…) y formato automático
// según el país. Usa react-phone-number-input (libphonenumber de Google).
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import es from "react-phone-number-input/locale/es.json";
// Solo las banderas que más se usan (LATAM + países frecuentes): las ~250 completas sumaban ~100 KB.
import { AR, BO, BR, CL, CO, CR, CU, EC, SV, GT, HN, MX, NI, PA, PY, PE, PR, DO, UY, VE, ES, US, PT, IT, FR, DE, GB, CA } from "country-flag-icons/react/3x2";
import "react-phone-number-input/style.css";
import "./PhoneField.css";



const flags = { AR, BO, BR, CL, CO, CR, CU, EC, SV, GT, HN, MX, NI, PA, PY, PE, PR, DO, UY, VE, ES, US, PT, IT, FR, DE, GB, CA };

// Bandera incluida si está; si no, el código del país en texto (nunca se pide una imagen a un servidor externo).
function Bandera({ country, countryName }) {
  const F = flags[country];
  if (F) return <F title={countryName} />;
  return <span className="cl-flag-code" title={countryName}>{country}</span>;
}

const LATAM = ["AR", "BO", "BR", "CL", "CO", "CR", "CU", "EC", "SV", "GT", "HN", "MX", "NI", "PA", "PY", "PE", "PR", "DO", "UY", "VE"];

export default function PhoneField({ id, value, onChange, onBlur, defaultCountry, invalid, describedBy }) {
  return (
    <PhoneInput
      className={`cl-phone${invalid ? " cl-phone--error" : ""}`}
      international
      countryCallingCodeEditable={false}
      defaultCountry={defaultCountry}
      labels={es}
      flagComponent={Bandera}
      countryOptionsOrder={[...LATAM, "|", "..."]}
      value={value || undefined}
      // Además del valor (E.164, ej. +5491112345678) informa si es válido para su país.
      onChange={(v) => onChange(v || "", !!v && isValidPhoneNumber(v))}
      onBlur={onBlur}
      numberInputProps={{ id, autoComplete: "tel", inputMode: "tel", "aria-invalid": invalid || undefined, "aria-describedby": describedBy }}
      countrySelectProps={{ "aria-label": "Código de país" }}
    />
  );
}
