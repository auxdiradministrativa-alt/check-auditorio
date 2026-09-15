# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# check-auditorio — Spec de trabajo

Sistema de **entrega temporal de espacios** (auditorio) de la Corporación Universitaria Americana.
**Dueño funcional: Infraestructura** (encargo de alta gerencia). No usar "Activos Fijos" en ningún texto, nombre ni dato.
Idioma de UI, dominio y commits: **español**. Zona horaria: `America/Bogota`.

## 1. Flujo de negocio (fuente de verdad)

1. **Infraestructura programa** una asignación (espacio, evento, inicio, fin) → se genera un **QR de un solo uso**.
2. **Quien recibe** (docente o administrativo, solo cuentas `@americana.edu.co`) escanea → inicia sesión con Google → la asignación pasa a `EN_VALIDACION`.
3. **Infraestructura confirma o rechaza** en su panel que esa cuenta es la persona presente. Rechazar libera el QR.
4. Quien recibe diligencia: rol, dependencia, cargo (opc.), celular, asistentes → **checklist** por elemento (`CONFORME`/`NOVEDAD`; cantidad recibida en equipos/mobiliario; **foto obligatoria solo si hay novedad**) → condiciones del espacio → **términos + autorización de datos** (Ley 1581, casillas separadas, sin marcar por defecto) → envía.
5. El servidor **sella**: consecutivo `REC-000123`, hora del servidor, SHA-256 del registro canónico, código de verificación. Queda `RECIBIDA`.
6. Se notifica por correo (receptor + destinatarios fijos). **No hay acta Doc/PDF**: constancia = fila en Sheets + correo HTML + página `/verificar/[consecutivo]` (recalcula hash; PDF solo con imprimir).
7. **Devolución**: la declara **solo quien recibió**, desde enlace personal del correo (buenas condiciones / con novedades + foto). Infraestructura **no participa**. Si vence el plazo → `DEVOLUCION_VENCIDA` + alerta a Infraestructura. Control cruzado: diferencias halladas en la siguiente entrega se asocian al turno anterior.

Estados: `PROGRAMADA → EN_VALIDACION → EN_DILIGENCIAMIENTO → RECIBIDA → DEVUELTA | DEVOLUCION_VENCIDA`; terminales `ANULADA`, `EXPIRADA`.
Fuera de alcance v1: **externos** (sin cuenta del dominio), integración con SIGAF.

## 2. Arquitectura (decidida, no reabrir)

```
Navegador ─► Vercel · Next.js 16 (UI + auth + validación + sello)
                 │  HMAC en el CUERPO (Apps Script no expone headers en doPost)
                 ▼
             Apps Script independiente (cuenta institucional de Infraestructura)
               · ÚNICO escritor del Google Sheet (LockService) · CacheService · Drive (fotos)
                 │  webhook no bloqueante {evento, id} + barrido periódico
                 ▼
             n8n (servidor privado institucional) · correos HTML vía Gmail · recordatorios · alertas
```

- **BD = Google Sheets** (lo opera Infraestructura sin TI). Nunca escribir la hoja desde Vercel ni desde n8n.
- **Primero guardar, luego notificar.** El correo nunca es el registro.
- n8n **no** está en la ruta crítica: si cae, la recepción ya existe y se reintenta (outbox).

## 3. Estado actual del repo (Bloque 1 terminado: mecanismo completo sin credenciales)

La Fase 2 está **escrita y probada en modo local**: el flujo entero corre contra el mismo núcleo que
irá a Apps Script, sobre un libro en memoria. **Google conectado y producción desplegada el
2026-09-15** en `https://check-auditorio-web.vercel.app`: prueba de uso completa en producción con
la sesión real (REC-000001). Guía y estado de Google en
[`docs/google-workspace.md`](docs/google-workspace.md). **Siguiente capítulo: n8n** — punto de
partida y decisiones a preguntar en
[`docs/superpowers/specs/2026-09-15-n8n-punto-de-partida.md`](docs/superpowers/specs/2026-09-15-n8n-punto-de-partida.md).
Latencia medida de Apps Script: páginas 2–4 s, escrituras 13–20 s.

```
packages/shared/          contrato, sin build (se consume como TS fuente)
  src/domain/             zod 4: estados, constantes, esquemas de entrada, fechas
  src/protocolo.ts        Acciones {entrada, salida}, Respuesta, Sobre HMAC, cadenaAFirmar
  src/sin-zod.ts          entrada `./sin-zod` para Apps Script (el bundle de GAS no lleva zod)
apps/gas/                 núcleo del registro — Clean Architecture, esbuild → dist/codigo.js
  src/dominio/            reglas puras: asignación, recepción, devolución, sello, errores
  src/aplicacion/         puertos · enrutador (acción → caso) · sobre (HMAC, ventana, nonce)
                          casos/ un módulo por caso de uso
  src/infraestructura/
    hojas/                esquema (columnas §5), semilla, repositorios sobre la interfaz Tabla
    gas/                  tabla-gas, servicios-gas (Lock, Cache, Digest, Drive), instalar, main (doGet/doPost)
    memoria/              Tabla y servicios en memoria (pruebas y desarrollo local)
  src/nucleo.ts           raíz de composición: crearNucleo(tabla, servicios)
  pruebas/                node:test contra el núcleo en memoria
apps/web/                 Next.js 16.3.5 · React 19.3 · Tailwind 4.3 · lucide-react
  src/app/                / · /panel(/asignaciones(/nueva|/[id]) | /recepciones)
                          /r/[token](/confirmada) · /devolucion/[id]?t= · /verificar/[consecutivo]
  src/features/<f>/       UI del caso + acciones.ts (Server Actions) en auth · panel · fotos · recepcion · devolucion; verificacion solo UI
  src/servidor/           solo servidor (`server-only`)
    entorno.ts            variables validadas; modos gas|memoria y google|local
    registro/             ÚNICO puerto de datos: index → cliente-gas (POST firmado) | cliente-memoria
    auth/                 better-auth (Google, sin BD) · sesion-local · sesion · permisos (guardas)
    tokens.ts · qr.ts · accion.ts (ejecutarAccion → Resultado)
  e2e/                    Playwright: prueba de uso entregador/receptor/intruso
n8n/workflows/            vacío (después del MVP)
```

Costuras que no se ven leyendo un solo fichero:

- **Dos modos por pieza, decididos por variables** (`servidor/entorno.ts`): registro `gas` si hay `GAS_WEBAPP_URL`+`GAS_HMAC_SECRET`, si no `memoria`; auth `google` si están las 3 de Google, si no `local` (formulario de nombre+correo, cookie firmada). **En producción, faltar cualquiera lanza** (`exigirEntornoCompleto`) — no degrada. La franja «Modo local» (`aviso-demo.tsx`) aparece sola mientras algún modo sea local.
- **El mismo núcleo corre en Apps Script y en memoria.** `cliente-memoria` importa `@check-auditorio/gas/memoria` y lo guarda en `globalThis` (sobrevive al hot reload; se borra al reiniciar `next dev`). Probar el núcleo en local prueba la lógica de GAS, **no** el runtime V8 de Google ni `SpreadsheetApp`.
- **Tokens derivados, no aleatorios almacenados** (`servidor/tokens.ts`): `token = HMAC(BETTER_AUTH_SECRET, 'qr'|'devolucion' + '|' + asignacionId)`; la hoja guarda solo el SHA-256 del de QR. El panel puede volver a mostrar el QR, pero **rotar `BETTER_AUTH_SECRET` invalida todos los QR y enlaces emitidos**, y local y Vercel deben compartirlo si usan el mismo Sheet.
- **`@check-auditorio/shared` se consume como TypeScript fuente** (`exports` → `src/index.ts`, `transpilePackages` en `next.config.ts`): un cambio ahí aplica directo en la web y en el bundle de GAS.
- **Los esquemas zod usan camelCase y la hoja snake_case**: el mapeo vive en `apps/gas/src/infraestructura/hojas/repositorios.ts`, que lee y escribe por **nombre** de columna (reordenar columnas a mano no rompe nada).
- **Regla «cantidad ≠ esperada con CONFORME»**: el esquema compartido no conoce el catálogo, así que está dos veces a propósito — `features/recepcion/validacion.ts` (cliente, para el mensaje) y el dominio del núcleo (servidor, contra el catálogo de la hoja). «Novedad exige observación y foto» sí está en el esquema compartido.
- **`revalidatePath` dentro de una Server Action repinta la página actual**: un estado de éxito que solo vive en el cliente se pierde. Por eso las confirmaciones las pinta el servidor desde el registro (ver `/devolucion/[id]`).
- **El POST a Apps Script no se reintenta; la lectura de su respuesta sí** (`registro/cliente-gas.ts`): doPost ejecuta y responde 302 a un eco en googleusercontent que a veces da 404 o redirige a `/exec` (se leería doGet). Se sigue la redirección a mano, se relee el eco hasta 4 veces y se valida la forma. Repetir el POST duplicaría la acción.
- **`RefrescoAutomatico` espera a que termine el refresco anterior**: con GAS un refresco dura segundos; un `setInterval` de 4 s cancelaba cada uno y el panel no se enteraba de la solicitud del receptor. En memoria no se ve.
- **Escritura no transaccional**: si Apps Script falla a mitad de `recepcion.registrar`, pueden quedar filas parciales. La clave de idempotencia permite reintentar; no hay rollback.

## 4. Reglas del código

- **Versiones fijadas**: TypeScript **6.0.3** (typescript-eslint soporta `<6.1`; TS 7 rompe el lint), ESLint **9** (plugins de Next no soportan 10), **pnpm 10.34.5** (máximo que Vercel instala sin configurar), Node ≥22 (Vercel usa 24). No actualizar sin verificar compatibilidad.
- Validación en los bordes con los esquemas de `@check-auditorio/shared`; el servidor revalida todo. **Nunca confiar en el cliente** para identidad, hora, catálogo, cantidades esperadas ni versión de términos.
- Secretos solo en server (`import 'server-only'`). Verificar sesión **dentro de cada Server Action/Route Handler**, no solo en `proxy.ts` (Next 16 renombró `middleware` → `proxy`).
- Tokens de colores: `navy-*`, `pearl-*`, `gold-*`, `ink-*`, `ok-*`, `danger-*` (en `globals.css`, contraste AA verificado). `gold-600` es solo decorativo; texto dorado sobre perla = `gold-700`.
- Archivos kebab-case; componentes y dominio con nombres en español; sin `any`; sin dependencias nuevas sin justificarlas.
- Antes de dar algo por terminado: `pnpm check` (typecheck + lint + format) y `pnpm build` en verde.

## 5. Modelo de datos — Google Sheet

Pestañas **editables por Infraestructura**:

| Hoja                | Columnas                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `CAT_Espacios`      | id, nombre, ubicacion, capacidad, activo                                                        |
| `CAT_Elementos`     | id, espacio_id, nombre, categoria (EQUIPO/MOBILIARIO/ESPACIO), cantidad_esperada, orden, activo |
| `CFG_Entregadores`  | correo, nombre, activo (quién puede usar `/panel`)                                              |
| `CFG_Destinatarios` | correo, nombre, evento (recepcion/devolucion/novedad/vencida), activo                           |
| `CFG_Terminos`      | version, texto_clausulas (JSON), texto_datos, sha256, vigente                                   |
| `CFG_General`       | clave, valor (horas_plazo_devolucion, minutos_vigencia_qr_antes, url_app…)                      |

Pestañas **protegidas (solo el script)** — nunca se editan ni borran; anular = evento en bitácora:

| Hoja                 | Columnas clave                                                                                                                                                                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Asignaciones`       | id (uuid), espacio_id, evento, inicio, fin, estado, entregado_por, creada_en, token_sha256, token_vence, receptor_correo, receptor_nombre, receptor_sub, consecutivo                                                                                                                                                         |
| `Recepciones`        | consecutivo, asignacion_id, receptor_nombre, receptor_correo, receptor_sub, rol, dependencia, cargo, celular, asistentes, terminos_version, terminos_sha256, sellada_en, sha256, codigo_verificacion, clave_idempotencia, user_agent, notificacion (PENDIENTE/ENVIANDO/ENVIADO/FALLIDO), notif_intentos, notif_reserva_hasta |
| `Recepcion_Detalle`  | consecutivo, elemento_id, elemento_nombre, categoria, cantidad_esperada, cantidad_recibida, estado, observacion, foto_ids                                                                                                                                                                                                    |
| `Devoluciones`       | consecutivo, resultado, declarada_en, sha256, clave_idempotencia, notificacion…                                                                                                                                                                                                                                              |
| `Devolucion_Detalle` | consecutivo, elemento_id, observacion, foto_ids                                                                                                                                                                                                                                                                              |
| `Bitacora`           | ts, evento, entidad_id, actor_correo, datos_json                                                                                                                                                                                                                                                                             |

Siempre IDs estables (uuid/consecutivo), **nunca número de fila**. Límite: 20 M celdas por libro.
La fuente de verdad de las columnas es `apps/gas/src/infraestructura/hojas/esquema.ts` (la escribe `instalar()`); esta tabla la resume.
`receptor_nombre` (Asignaciones) y `categoria` (Recepcion_Detalle) se añadieron en el Bloque 1: la tarjeta de validación y la constancia los necesitan sin cruzar hojas. Todas las celdas de las pestañas protegidas son texto plano. `DEVOLUCION_VENCIDA` no se escribe: se deriva al leer (`dominio/asignacion.ts`).

## 6. Fase 2 — Mecanismo (orden sugerido, criterios de aceptación)

**Cómo quedó implementado (Bloque 1, 2026-09-15) — donde difiere de la spec de abajo, manda esto:**

- **esbuild, no Rollup** (`apps/gas/build.mjs`): IIFE ES2019 + funciones globales `doGet`, `doPost`, `instalar`.
- **QR vigente desde `inicio − 30 min` hasta el `fin`** del evento (no hasta `inicio`), y **token derivado** con HMAC del id (§3), no aleatorio almacenado.
- Acciones implementadas: las de `packages/shared/src/protocolo.ts` (incluye `entregador.autorizado` y `terminos.vigentes`). **No existen** `outbox.*` ni `devoluciones.porVencer`: el MVP sale sin correo (§8) y el enlace de devolución se muestra en `/r/[token]/confirmada`.
- ✅ verificados en local: los de 2.1, 2.3, 2.4 y 2.5 con `pnpm --filter @check-auditorio/gas prueba` y `pnpm e2e`. **Pendientes de verificar con Google real:** el claim `hd` de 2.2 (Better Auth sin BD), el runtime V8 de Apps Script y `SpreadsheetApp`/`LockService` bajo concurrencia real.

**2.1 `apps/gas`** — TypeScript + Rollup → `clasp push` (clasp 3 **no** transpila TS). Script **independiente** (no vinculado: un script vinculado es visible para quien vea el libro). Web app: _Ejecutar como: yo_ (cuenta de Infraestructura), _Acceso: cualquiera_ + HMAC.

- `doPost(e)`: body `{accion, datos, ts, nonce, firma}`; `firma = HMAC-SHA256(secret, accion|ts|nonce|sha256(datos))`; rechazar `|ahora−ts| > 300 s` y nonce repetido (CacheService, TTL 10 min).
- Router de acciones → `domain/` (reglas) → `infra/` (sheets-repo, lock, cache, drive, bitacora). Respuesta `{ok, datos} | {ok:false, codigo, mensaje}`.
- Acciones: `catalogo.listar`, `asignacion.crear|listar|obtener|anular`, `qr.reclamar`, `qr.estado`, `validacion.decidir`, `recepcion.registrar`, `foto.subir`, `devolucion.registrar`, `constancia.obtener`, `outbox.pendientes|reclamar|confirmar|fallo`, `devoluciones.porVencer`.
- ✅ Dos `recepcion.registrar` simultáneos generan consecutivos distintos y seguidos; reenviar la misma `clave_idempotencia` devuelve el mismo consecutivo.

**2.2 Auth** — Better Auth **sin BD** (sesión en cookie firmada), proveedor Google con `hd: 'americana.edu.co'` y validación del claim `hd` en servidor; identificar por `sub`. Rutas `/panel/*` exigen correo en `CFG_Entregadores`. Forzar reautenticación reciente antes de firmar (PC compartidos).

- ✅ Cuenta Gmail personal o de otro dominio → rechazada aunque manipule la URL de login.

**2.3 QR** — token aleatorio 32 bytes base64url; en la hoja solo su SHA-256; vigente desde `inicio − N min` hasta `inicio`; un solo uso. URL `${APP_URL}/r/${token}`; QR SVG generado en servidor (paquete `qrcode`). Panel consulta el estado cada ~4 s solo mientras hay `EN_VALIDACION`.

- ✅ Token usado, vencido o inexistente → pantalla "QR no vigente"; rechazar vuelve a `PROGRAMADA`.

**2.4 Recepción** — Route Handler/Server Action: sesión + esquema + estado `EN_DILIGENCIAMIENTO` + cuenta = la validada. Fotos: comprimir en cliente (≤1600 px, JPEG ~0.72), subir una por una (`foto.subir` → id de Drive) antes de enviar. Servidor agrega identidad, hora, catálogo, términos; arma JSON canónico (claves ordenadas, RFC 8785) → SHA-256 → `recepcion.registrar`.

- ✅ Cantidad recibida ≠ esperada con estado CONFORME → rechazado en cliente y servidor. Novedad sin foto u observación → rechazado.

**2.5 Devolución y verificación** — enlace `/devolucion/[id]?t=token-personal` + login de la misma cuenta. `/verificar` recalcula el hash desde la hoja y muestra Íntegra/Alterada (requiere login).

- ✅ Editar a mano una celda de `Recepcion_Detalle` → `/verificar` muestra "Alterada".

**2.6 n8n** (`n8n/workflows/*.json`, sin credenciales) — WF-01 notificar recepción (webhook + barrido → `outbox.reclamar` → datos → Code arma HTML → Gmail → `outbox.confirmar`), WF-02 recordatorio devolución, WF-03 devolución declarada/vencida, WF-00 errores.

- Solo **credencial Gmail** (OAuth de la cuenta de Infraestructura; cliente Interno o publicado: en "Testing" el token vence a los 7 días). Header Auth en webhooks.
- n8n 2.x: Code node aislado y **sin `$env`**; configuración llega desde Apps Script. Guardar ≠ Publicar.
- Correo: escapar todo texto del usuario, estilos en línea, **< 102 KB** (Gmail recorta), sin imágenes embebidas; enlace de devolución **solo** en el correo del receptor; sin documento/celular en el de destinatarios fijos.
- ✅ Webhook y barrido simultáneos → un solo correo. 3 fallos → `FALLIDO` + alerta.

## 7. Fase 3 — Deploy

- **Desplegado (2026-09-15)**: cuenta de Vercel de la auxiliar (GitHub `auxdiradministrativa-alt`), proyecto con dominio `check-auditorio-web.vercel.app`, región `iad1`, despliega solo con push a `main`. Trampas medidas:
  - `NEXT_PUBLIC_APP_URL` **no puede ser Secret** (Vercel lo rechaza) → tipo **Config**. Se fija al compilar: cambiarla exige redeploy. Con `http://localhost:3001` el login de Google vuelve a localhost.
  - **Editar una variable Secret la guarda vacía** (el campo Value aparece en blanco): para cambiarle el entorno se borra y se crea de nuevo.
  - Variables **solo en Production**: las previews corren con `NODE_ENV=production` y escribirían en el Sheet real.
  - Pegar `.env.local` en el campo Key crea todas las variables de una vez (incluida la de localhost: quitarla).
  - Si en producción `/api/auth/*` da 404, la app cree estar en modo local: falta una variable de Google o `BETTER_AUTH_SECRET` (el 500 de las páginas nombra cuáles en el log).
- Vercel: Root Directory `apps/web`, pnpm detectado por lockfile, Node 24. Variables: `NEXT_PUBLIC_APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `GAS_WEBAPP_URL`, `GAS_HMAC_SECRET` (ver `apps/web/.env.example`).
- Google Cloud: cliente OAuth con redirect `https://<dominio>/api/auth/callback/google` y el de localhost.
- Vercel Hobby = solo uso personal no comercial; confirmar plan/cuenta institucional antes de producción. Cron de Hobby: 1 vez/día → los recordatorios los hace n8n.
- Dueña de todo (Sheet, script, Drive, Gmail n8n, Vercel): **cuenta institucional de Infraestructura**, no personal.

## 8. Decisiones abiertas (preguntar a Leonardo antes de implementar)

1. ¿Infraestructura hace revisión previa del checklist al programar?
2. ¿Más espacios además del Auditorio Principal?
3. Vigencia del QR y plazo para declarar devolución.
4. ~~Correo/cuenta de Infraestructura dueña del sistema.~~ **Cerrada (2026-09-15):** `auxdiradministrativa@americana.edu.co` es dueña de Sheet, script, Drive, Gmail, OAuth y repo; a esa persona se le entrega el proyecto. Las keys/credenciales de Google Workspace las configura Leonardo: avisarle al llegar a ese punto, no crearlas.
   **MVP 2026-09-15 (confirmado por Leonardo):** sale **sin correo** (n8n después; la constancia vive en la hoja + `/verificar` y el enlace de devolución se muestra en la pantalla de confirmación). Nº 3 por defecto en `CFG_General`: QR vigente desde **30 min** antes del inicio; devolución hasta **24 h** tras el fin. Nº 7: términos de ejemplo marcados **borrador** hasta el texto de Jurídica.

5. n8n: ¿expuesto a internet por HTTPS? versión (1.x/2.x).
6. ¿Control Interno exige PDF archivado?
7. Texto final de términos (Jurídica).
8. Plan de Vercel.

## 9. Comandos

```bash
corepack enable && pnpm install
pnpm dev          # http://localhost:3001 (puerto fijo: debe coincidir con el redirect OAuth)
pnpm check        # typecheck + lint + format:check
pnpm build
pnpm format       # prettier --write (incluye orden de clases Tailwind)
pnpm e2e          # prueba de uso con Playwright (puerto 3100)
pnpm --filter @check-auditorio/web e2e:gas   # la misma, contra el Sheet REAL (escribe filas de prueba)
pnpm secretos     # imprime GAS_HMAC_SECRET y BETTER_AUTH_SECRET nuevos

# Apps Script (con la cuenta dueña; guía completa en docs/google-workspace.md)
pnpm --filter @check-auditorio/gas prueba    # núcleo en memoria (node:test)
pnpm --filter @check-auditorio/gas build     # → apps/gas/dist/codigo.js
pnpm --filter @check-auditorio/gas login     # clasp -u duena login (credencial nombrada en ~/.clasprc.json)
pnpm --filter @check-auditorio/gas cuenta    # debe decir auxdiradministrativa@
pnpm --filter @check-auditorio/gas crear     # una vez: crea el script independiente y .clasp.json
pnpm --filter @check-auditorio/gas push      # build + clasp push (luego: nueva VERSIÓN de la implementación)
pnpm --filter @check-auditorio/web probar-gas  # GET + POST firmado contra GAS_WEBAPP_URL de .env.local

# Por paquete
pnpm --filter @check-auditorio/web lint
pnpm --filter @check-auditorio/shared typecheck
```

- **Pruebas** (sin credenciales, todo en modo local):
  - `pnpm --filter @check-auditorio/gas prueba` → núcleo en memoria con `node:test` (flujo, idempotencia, «Alterada», cantidades, QR, cruce, HMAC).
  - `pnpm e2e` → Playwright (`apps/web/e2e/`): levanta su propio `next dev` en el **puerto 3100** y hace la prueba de uso con tres navegadores: entregador, receptor e intruso. **Falla si ya hay otro `next dev` corriendo en `apps/web`** (Next 16 no admite dos): detenlo antes. La franja del evento se calcula con la hora actual de Bogotá, así que no corre después de las 23:55.
- Git: rama `main`, remoto `origin` = `github.com/auxdiradministrativa-alt/check-auditorio`.
- `next dev` crea y vuelve a crear `apps/web/AGENTS.md` y `apps/web/CLAUDE.md` (reglas de Next para agentes): se versionan, no se borran.
- `pnpm dev` usa el puerto **3001 fijo** (`next dev -p 3001`): el redirect OAuth de localhost apunta ahí y `NEXT_PUBLIC_APP_URL` debe coincidir. Si está ocupado, falla en vez de moverse de puerto.
