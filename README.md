# Diagnóstico de Madurez · CampusLatina

Webapp pública de autodiagnóstico del proceso de atracción universitaria (leadmagnet).
Test de 28 preguntas → informe online → PDF por mail al directivo + aviso interno → panel `/admin`.

**Stack:** React 18 + Vite · React Router 6 · Supabase (Postgres + Auth) · Resend · Netlify (hosting + Functions)

## Cómo funciona

```
Browser (/)                         Netlify Function /api/notify                 Resend
───────────                         ────────────────────────────                 ──────
última respuesta
  ├─ calcula scores (src/lib/scoring.js)
  ├─ INSERT en Supabase (anon key, 3 intentos) ──► diagnosticos
  ├─ POST /api/notify { id } ──────────► lee la fila (service key)
  │                                      genera PDF (@react-pdf/renderer)
  │                                      ├─ mail al directivo + PDF ───────────► universidad
  │                                      ├─ aviso interno + PDF ───────────────► CampusLatina
  │                                      └─ UPDATE mail_enviado / notif_enviada
  └─ a los 4 s muestra el informe (no espera nada de lo anterior)
     banner: "Te enviamos el informe en PDF a …" según el resultado
```

- El navegador **solo puede INSERTAR** (RLS). No puede leer diagnósticos, ni siquiera el suyo; por eso el `id` se genera en el cliente.
- `/api/notify` recibe **solo el id**. El destinatario sale de la base, así que el endpoint no sirve para mandar mails a terceros. Solo notifica diagnósticos creados en los últimos 30 minutos y usa claves de idempotencia de Resend para no duplicar envíos.
- `/admin` usa magic link de Supabase. `/api/admin-data` valida el token **y** que el email esté en `ADMIN_EMAILS`, y recién ahí lee con la service key.

## Estructura

```
src/
  App.jsx                 router: / y /admin (admin se carga aparte)
  pages/Diagnostico.jsx   app_diagnostico_v3.jsx adaptada (diseño y scoring sin cambios)
  pages/Admin.jsx         login, métricas, filtros, tabla, CSV, detalle
  components/ReportExtras.jsx  banner de envío + CTA de contacto del informe
  lib/scoring.js          getNivel, calcScore, calcEtapaProjected, … (lo usa también el servidor)
  lib/supabase.js         cliente con anon key
  lib/persist.js          INSERT con reintento + llamada a /api/notify
  data/                   etapas, fricciones, recs, paises (contenido original)
  theme.js                colores de marca
netlify/
  functions/notify.mjs      PDF + mails + flags
  functions/admin-data.mjs  datos del panel (auth + allowlist)
  lib/                      pdf, emails, mailer, supabaseAdmin, env, fonts.generated.js
supabase/schema.sql       tabla, índices y RLS
scripts/                  PDF de ejemplo y smoke tests de las functions (sin servicios reales)
docs/                     JSX original de referencia
```

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar valores
npm run dev                  # solo frontend en http://localhost:5173 (sin /api)
npx netlify dev              # frontend + functions en http://localhost:8888
```

Pruebas sin credenciales:

```bash
node scripts/sample-pdf.mjs informe.pdf     # genera un PDF de ejemplo
node scripts/test-notify.mjs /tmp/mails     # simula Supabase+Resend y guarda los HTML de los mails
node scripts/test-admin-data.mjs            # auth, allowlist y paginación del panel
```

## Puesta en producción

### 1. Supabase
1. Crear el proyecto (región São Paulo es la más cercana para LATAM).
2. **SQL Editor** → pegar y ejecutar `supabase/schema.sql`.
3. **Authentication → Sign In / Providers → Email**: dejar habilitado. **Desactivar "Allow new users to sign up".**
4. **Authentication → Users → Add user → Send invitation** para cada persona del equipo que use `/admin`. Sus emails también van en `ADMIN_EMAILS`.
5. **Authentication → URL Configuration**:
   - Site URL: `https://diagnostico.campuslatina.com`
   - Redirect URLs: `https://diagnostico.campuslatina.com/admin`, `http://localhost:8888/admin`, `http://localhost:5173/admin`
6. **Authentication → Emails → SMTP Settings**: configurar el SMTP de Resend (`smtp.resend.com`, puerto 465, usuario `resend`, contraseña = API key). Sin SMTP propio, Supabase solo envía magic links a miembros del proyecto y con un límite de pocos mails por hora.
7. **Project Settings → API**: copiar `Project URL`, `anon public` y `service_role` (esta última es secreta).

### 2. Resend
1. **Domains → Add domain** `campuslatina.com` y cargar en el DNS los registros SPF/DKIM que indica. Esperar a que figure *Verified*.
2. **API Keys → Create** con permiso *Sending access*.

### 3. GitHub + Netlify
1. Subir el repo a GitHub (`.env.local` queda fuera por `.gitignore`).
2. Netlify → **Add new site → Import from Git** → elegir el repo. Build command y publish dir salen de `netlify.toml`.
3. **Site configuration → Environment variables** → cargar todas las de `.env.example`:

| Variable | Dónde se usa | Valor |
|---|---|---|
| `VITE_SUPABASE_URL` | navegador (build) | Project URL |
| `VITE_SUPABASE_ANON_KEY` | navegador (build) | anon public key |
| `VITE_CONTACT_EMAIL` | botón "Escribinos" del informe | email comercial |
| `VITE_CONTACT_WHATSAPP` | opcional: si se define, el botón abre WhatsApp | ej `5491122334455` |
| `SUPABASE_URL` | functions | Project URL |
| `SUPABASE_SERVICE_KEY` | functions (**secreta**) | service_role key |
| `RESEND_API_KEY` | functions (**secreta**) | API key de Resend |
| `MAIL_FROM` | functions | `Diagnóstico CampusLatina <no-reply@campuslatina.com>` |
| `MAIL_INTERNAL_TO` | functions | quién recibe el aviso de cada diagnóstico (coma para varios) |
| `CONTACT_EMAIL` | functions | Reply-To del informe y botón "Hablemos" |
| `SITE_URL` | functions | `https://diagnostico.campuslatina.com` |
| `ADMIN_EMAILS` | functions | emails con acceso a `/admin` (coma para varios) |

   Las `VITE_*` se incrustan al compilar: si cambian hay que **redeployar**.
   Marcar `SUPABASE_SERVICE_KEY` y `RESEND_API_KEY` como *secret* y con alcance *Functions*.
4. **Domain management → Add domain** `diagnostico.campuslatina.com` → crear en el DNS el `CNAME` que indica Netlify. HTTPS se emite solo (Let's Encrypt).

### 4. Verificación post-deploy
- [ ] Completar un diagnóstico real con un email propio → llega el mail con el PDF adjunto y llega el aviso interno.
- [ ] En Supabase → Table editor: la fila tiene `mail_enviado = true` y `notif_enviada = true`.
- [ ] `/admin` → pedir magic link → entra y lista el diagnóstico. Un email que no está en `ADMIN_EMAILS` ve "sin acceso".
- [ ] Netlify → Functions → `notify` → revisar los logs (ahí quedan los errores de Resend y del PDF).

## Pendiente / decisiones abiertas
- **WhatsApp**: descartado por ahora; la notificación interna va por mail. Para sumarlo después alcanza con agregar un envío en `netlify/functions/notify.mjs`, en paralelo a los mails.
- **Tasa de completitud** del dashboard: requiere registrar cuándo se *empieza* el test (hoy solo se guarda al terminar).
- **Abuso**: el INSERT es público por diseño (leadmagnet). Si aparecen envíos automatizados, conviene agregar Cloudflare Turnstile antes del INSERT y validarlo en `/api/notify`.
- El botón "Descargar PDF" del informe online sigue usando la versión imprimible del navegador (`window.print`). El PDF del mail se genera en el servidor.
