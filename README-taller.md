# Diagnóstico colectivo · El viaje invisible del aspirante

Versión en vivo del diagnóstico para el taller de Campus Latina en **REALCUP 2026 (Guayaquil)**: 90 minutos, entre 40 y 50 asistentes. Cada asistente responde desde su teléfono, etapa por etapa, por su universidad: con la realidad o lo más cercano a ella. Los expositores muestran los resultados de la sala cuando lo deciden, los discuten con la sala y eligen entre todos las ideas para subir el puntaje. Al final, cada asistente ve su mirada frente a la de la sala y puede pedir el informe en PDF por email.

## Las direcciones de REALCUP

| Quién | Dirección |
|---|---|
| Asistentes (QR) | `diagnostico.campuslatina.com/realcup2026` |
| Expositores | `diagnostico.campuslatina.com/realcup2026/expositor` |
| Pantalla espejo | `diagnostico.campuslatina.com/realcup2026/pantalla` |

Son la sesión de código `REALCUP` con direcciones fijas, sin código que escribir (`EVENTO` en [src/taller/datos.js](src/taller/datos.js)). La primera vez que se abre `/realcup2026/expositor` pide crear la sesión: nombre y clave de los expositores. Hasta entonces, `/realcup2026` muestra "El taller todavía no empezó". Para ensayar, usar otras sesiones (`/f`): lo que se responde en `REALCUP` queda en la sesión del evento.

## Las dos pantallas

| Quién | Dirección | Para qué |
|---|---|---|
| Asistente (teléfono) | `diagnostico.campuslatina.com/s/<CÓDIGO>` | Entra por el QR, sin login ni datos. Responde las 4 preguntas de la etapa abierta. En los resultados ve su mirada en grande y el puntaje de la sala al lado (el detalle está en la pantalla del salón) y, al final, el formulario para recibir el PDF; una vez enviado, el formulario se esconde y queda solo la opción de corregir el email. |
| Expositor (escritorio) | `diagnostico.campuslatina.com/f/<CÓDIGO>` | Lo que se proyecta en el salón, con una barra de controles que aparece al mover el mouse. Pide la clave de la sesión. |

Además:
- `/f` crea una sesión nueva (nombre del evento, clave y código).
- `/p/<CÓDIGO>` es una pantalla espejo **sin controles**, por si el proyector está conectado a otra computadora.
- `/s` sin código: para quien escribe la dirección a mano y después el código.

## Probar la demo en una computadora (sin Supabase)

```bash
npm install
npm run taller:local
```

Levanta la app con una base Postgres local (PGlite, en `.taller-local/`) que **crea sola la sesión `DEMO`**: 46 participantes sintéticos con las 28 respuestas. La clave de `DEMO` está en [scripts/taller-local.mjs](scripts/taller-local.mjs) (`DEMO.clave`).

1. Abrir la pantalla del expositor **con la dirección de red** que muestra la consola (por ejemplo `http://192.168.1.2:5175/f/DEMO`), no con `localhost`: así el QR funciona desde un teléfono en el mismo wifi.
2. Escanear el QR con un teléfono para ver la vista del asistente.
3. Avanzar con la flecha → (ver el guion más abajo).

Otras herramientas de prueba:

```bash
npm run taller:sembrar
```

Vuelve a crear la `DEMO` desde cero, en la pantalla del QR.

```bash
npm run taller:sembrar -- --cierre
```

La deja directo en el resultado final, con ideas elegidas en todas las etapas.

- **Ver el contador subir en vivo:** en `DEMO` todas las respuestas ya están cargadas, así que al abrir una etapa el contador aparece completo. Para ensayar con el contador en vivo, crear en `/f` una sesión marcando **Sesión de prueba** y usar **Más → Simular respuestas**: se suman hasta 15 participantes ficticios que responden de a poco cada etapa que se abre.
- **El email en local:** el PDF se genera igual y queda en `.taller-local/informes/`, y el mail no se envía (la consola lo registra).

```bash
npm run test:taller
```

Corre las pruebas de la base (permisos, flujo, topes del email) y de los cálculos de la sala.

## Puesta en producción

Usa el mismo Supabase, Resend y Netlify que el diagnóstico (ver [README.md](README.md)). Las tablas del taller son propias (`taller_*`) y están separadas de los diagnósticos.

1. **Supabase → SQL Editor:** pegar y ejecutar [supabase/migrations/003_taller.sql](supabase/migrations/003_taller.sql). Crea las tablas, las funciones y el bucket privado `taller-informes`, donde quedan los PDF enviados. Si la base ya tenía el taller, ejecutar además [006_taller_informe.sql](supabase/migrations/006_taller_informe.sql), que suma el paso «El informe» del cierre. Las dos se pueden correr dos veces sin problema.
2. **Variables de entorno:** no hace falta ninguna nueva. El email usa `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY` y `MAIL_FROM`, las mismas del diagnóstico. Si se quiere otro remitente para el taller, cambiar `MAIL_FROM`.
3. **Deploy:** las rutas `/s`, `/f`, `/p` y `/realcup2026` ya están en [netlify.toml](netlify.toml) y se sirven con `taller.html`, fuera de buscadores y sin Analytics. El envío del PDF es la function `/api/taller/informe`.
4. **Sesión de demo en producción (opcional):** en el SQL Editor, `select public.taller_sembrar('DEMO', 'una-clave-larga');`. Para dejarla en el cierre, agregar `p_cierre => true`.
5. **Verificación:**
   - crear una sesión de prueba;
   - responder una etapa desde dos teléfonos;
   - mostrar resultados e ideas;
   - ir al cierre y pedir el PDF desde un teléfono real;
   - revisar que llegue el mail y que el PDF quede en **Storage → taller-informes**.

## Antes del taller

- [ ] **Crear la sesión del evento** abriendo `diagnostico.campuslatina.com/realcup2026/expositor`: pide el nombre ("REALCUP 2026 · Guayaquil") y una clave que tengan los dos expositores. La clave no se puede recuperar.
- [ ] **Ensayar** con una sesión de prueba y **Simular respuestas**, de punta a punta, con el control remoto de diapositivas que se va a usar.
- [ ] **En el salón:**
  - probar el wifi con un teléfono, escaneando el QR y respondiendo una pregunta;
  - tener a mano un hotspot 4G para la notebook.
- [ ] **En la notebook conectada al proyector:**
  - abrir `/realcup2026/expositor` y entrar con la clave;
  - pasar a pantalla completa con la tecla **F**;
  - desactivar el bloqueo de pantalla y las notificaciones.
- [ ] **Segundo expositor:** puede abrir `/realcup2026/expositor` en su propia computadora para seguir los números o elegir ideas. Ve lo mismo y los cambios se sincronizan en unos 2 segundos.

## Controles de la pantalla del expositor

| Tecla o botón | Qué hace |
|---|---|
| **→**, barra espaciadora o **Av Pág** (botón "siguiente" del control remoto) | Paso siguiente |
| **←** o **Re Pág** (botón "anterior" del control remoto) | Paso anterior |
| **F** | Pantalla completa |
| Mover el mouse | Muestra la barra: código, conectados, quiénes respondieron, anterior y siguiente, **Etapas** y **Más** |
| **Etapas** | Saltar a cualquier etapa: abrirla, reabrirla o ver sus resultados; ir al resultado final |
| **Más** | Volver al QR, copiar el link, abrir la pantalla espejo, exportar CSV con emails, simular respuestas (solo en sesiones de prueba) |
| En **Ideas para subir** | Clic en una idea para elegirla o quitarla (de a una) |

Los pasos, en orden:
1. **Antes de empezar** (cómo funciona) → **pantalla del QR**.
2. Por cada etapa: **etapa abierta** (contador en vivo) → **resultado** → **ideas para subir**.
3. **Resultado final: el viaje** → **el recorrido** → **con las ideas** → **el informe**.

La pantalla proyectada va en fondo claro. En el resultado de una etapa, cada pregunta tiene una barra con el promedio de la sala sobre la escala de 1 a 5, con los 4 niveles de fondo; la más baja va más oscura y con el rótulo "La más baja". En el cierre, **el viaje** muestra las 7 etapas como un recorrido (petróleo, hoy; ámbar punteado, con las ideas elegidas) y **el recorrido** es el haz del diagnóstico con los puntajes de la sala: en cada etapa se angosta según su puntaje y los aspirantes que llegan se encienden en ámbar. Al pasar a **con las ideas**, el haz se abre en movimiento. Es ilustrativo y lo dice en pantalla. **El informe** muestra 4 páginas de ejemplo del PDF que recibe cada asistente (imágenes en `public/taller/`; si cambia el PDF, regenerarlas).

"Mostrar resultados" cierra la etapa: lo que llegue después ya no cuenta. En los teléfonos no aparece nada hasta que ustedes muestran los resultados.

## Guion minuto a minuto (90 minutos)

Cada etapa lleva unos 9 minutos: 2 para responder, 3 para el resultado y 4 para las ideas. Si una conversación se alarga, se recupera acortando el resultado en las etapas siguientes.

| Minuto | En pantalla | Qué tocar | Qué hacer con la sala |
|---|---|---|---|
| 0:00 | Antes de empezar | — | Bienvenida. Sus respuestas las ve solo cada uno; en la pantalla, solo el promedio. Responder con la realidad de su universidad (o lo más cercano). De dónde sale el diagnóstico y para qué sirve. |
| 0:04 | QR y "N personas ya entraron" | **→** Pantalla del QR | Pedir que escaneen el QR; quien no puede, escribe la dirección que está al lado. |
| 0:08 | Etapa 1 abierta, contador | **→** Abrir etapa 1 | Leer la pregunta guía ("¿Lo encuentran?"). El teléfono muestra la consigna y las 4 preguntas. |
| 0:10 | Resultado: puntaje y una fila por pregunta | **→** Mostrar resultados (cuando el contador está cerca del total) | ¿Por qué dio esto? ¿Qué sorprende? ¿Dónde coincidimos y dónde no? La pregunta más baja va en negrita. |
| 0:13 | Ideas para subir | **→**, después clic en las ideas que elige la sala | Debatir cuáles aplicarían y elegirlas entre todos; ver cuánto sube la etapa. |
| 0:17 | Etapa 2 abierta | **→** Abrir etapa 2 | Igual que la etapa 1. |
| 0:26 | Etapa 3 abierta | **→** | — |
| 0:35 | Etapa 4 abierta | **→** | — |
| 0:44 | Etapa 5 abierta | **→** | — |
| 0:53 | Etapa 6 abierta | **→** | — |
| 1:02 | Etapa 7 abierta | **→** | — |
| 1:11 | El viaje: las 7 etapas, hoy y con las ideas elegidas | **→** Resultado final | Dónde se pierden más aspirantes y cuánto subiría la sala con lo elegido. |
| 1:17 | El recorrido, hoy | **→** | Cuántos aspirantes quedan en el camino en las universidades de la sala. |
| 1:20 | El recorrido, con las ideas | **→** | El haz se abre: lo que cambia si se aplican las ideas que eligió la sala. |
| 1:24 | El informe | **→** | Qué le llega a cada uno por email. Invitar a mirar el teléfono: su mirada frente a la sala, y el email para recibir el PDF (puede llegar a Notificaciones o a Spam). |
| 1:30 | — | **Más → Exportar CSV** (después del taller) | Cierre. |

## Si algo sale mal

- **Alguien no puede escanear el QR:**
  - al lado del QR está la dirección corta;
  - con una etapa abierta, la pantalla muestra un QR chico abajo a la derecha;
  - **Más → Mostrar el QR** lo vuelve a poner en grande.
- **Se cae el wifi:**
  - los teléfonos guardan las respuestas y las envían solos cuando vuelve la señal;
  - la barra del expositor y los teléfonos muestran "Sin conexión";
  - para la notebook, usar el hotspot 4G.
- **Alguien llega tarde:** entra a la etapa que esté abierta; las anteriores le quedan sin responder.
- **Se avanzó por error:** **←** vuelve. Si se cerró una etapa antes de tiempo, abrirla otra vez desde **Etapas → Reabrir**: las respuestas se mantienen y sus resultados se ocultan hasta volver a mostrarlos.
- **El proyector está en otra computadora:** abrir ahí `/realcup2026/pantalla` (pantalla espejo) y manejar desde `/realcup2026/expositor` en la propia.

## Cómo se calculan los números

- **Valor de cada respuesta:** A = 1, B = 2, C = 4, D = 5, igual que en el diagnóstico.
- **Puntaje de una etapa:** el promedio de sus preguntas para cada persona, y después el promedio de la sala.
- **Ideas para subir:** las mismas del diagnóstico, aplicadas a la respuesta más elegida de cada pregunta. Cuánto sube cada idea se calcula sobre todos:
  - una acción suma su impacto a quien respondió A o B en la pregunta que mejora;
  - un "próximo nivel" lleva a ese nivel a quien está por debajo.
- **Con lo elegido:** el puntaje de la sala si se aplicaran todas las ideas elegidas, con tope 5 por persona.
- **Su mirada:** el puntaje de cada persona frente al promedio de la sala, solo en las etapas que respondió. Los demás aparecen como puntos sin nombre.
- **Más acuerdo y más desacuerdo:** las preguntas con menor y mayor dispersión de respuestas.

## Datos

- **Respuestas:** se guardan con un identificador anónimo que genera el teléfono.
- **Emails:** si la persona pide el PDF, el email queda guardado junto a sus respuestas (tabla `taller_envios`) y el PDF en el bucket `taller-informes`. Nada individual aparece en la pantalla del salón; los emails solo salen en el CSV del expositor y en el panel `/admin`, solapa **Taller REALCUP**, donde cada persona se identifica con su email (o queda anónima, con su número, si no pidió el PDF).
- **Topes del envío:** se puede pedir el informe solo después del resultado final, hasta 3 veces por persona y 600 por sesión.
- **Si un envío falla:** el email queda guardado igual (en el panel figura sin informe). Para mandárselo después, desde una computadora con el `.env.local`:

  ```bash
  npm run taller:reenviar
  ```

  Lista los pendientes de `REALCUP` sin enviar nada: el último pedido de cada persona que falló o quedó sin respuesta del servidor hace más de 2 minutos. Si a ese mismo email ya le llegó un pedido anterior, no lo repite. Con `-- --enviar` los manda con el mismo PDF que quedó guardado (o lo rearma con sus respuestas si no se guardó) y los marca como enviados en el panel. Otras opciones: otro código de sesión (`-- PRUEBA`), un pedido puntual aunque ya haya salido (`-- --envio 16`), o `-- --pdf carpeta` para guardar los PDF sin enviarlos. El código está en [scripts/taller-reenviar.mjs](scripts/taller-reenviar.mjs).

## Archivos

```
taller.html                      entrada de la app del taller (separada del diagnóstico)
src/taller/
  pages/Participante.jsx         teléfono del asistente
  pages/Expositor.jsx            pantalla del expositor con controles · Proyeccion.jsx: espejo · Crear.jsx: /f
  pages/ExpositorEvento.jsx      /realcup2026/expositor: crea la sesión del evento si todavía no existe
  vistas/                        pantallas proyectadas (Salud.jsx: los gráficos por pregunta y por etapa) y resultados en el teléfono
  sala.js                        cálculos de la sala (puntajes, ideas, mirada propia, estadísticas)
  api.js · useParticipante.js · usePanel.js   conexión con la base (consultas cada 2–3 s, cola sin conexión)
supabase/migrations/003_taller.sql   tablas, funciones, permisos, simulación, siembra de la demo
netlify/functions/taller-informe.mjs  envío del PDF por email
netlify/lib/pdfTaller.js · tallerInforme.js   PDF y proceso del envío (su mirada, la sala, el recorrido, qué mide cada etapa, ideas)
src/taller/recorrido.js         modelo ilustrativo del recorrido (el haz), compartido por la pantalla y el PDF; sin cantidades de aspirantes
scripts/taller-local.mjs · taller-sembrar.mjs · test-taller.mjs   base local, demo y pruebas
```
