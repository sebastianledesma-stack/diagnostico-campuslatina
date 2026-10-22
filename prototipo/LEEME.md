# Link de prueba del taller (solo borrador, nunca producción)

`https://realcup-prototipo--diagnostico-campuslatina.netlify.app`: el taller con la marca nueva y una
base simulada **dentro del navegador** (PGlite con la migración 003 y la sala `DEMO`, clave `demo2026`).
No usa Supabase, no tiene functions y no envía mails.

Cómo se arma:

1. `VITE_TALLER_API_URL=/taller-api npx vite build` en esta rama, **sin** `.env.local` (sin claves de Supabase).
2. `npx vite build` dentro de `prototipo/taller-demo/` (deja `dist/taller-demo/`: el simulador y PGlite).
3. Carpeta para publicar: `dist/` sin `index.html` ni `campuslatina-logo.png`, más `taller-demo/`,
   `prototipo/inicio.html` como `index.html`, `<script type="module" src="/taller-demo/taller-demo.js">`
   antes del script del taller en `taller.html`, `_redirects` de `/s`, `/f`, `/p` y `/realcup2026` a
   `/taller.html` y `_headers` con `X-Robots-Tag: noindex, nofollow`.
4. `netlify deploy --no-build --dir <carpeta> --alias realcup-prototipo` (sin functions).
