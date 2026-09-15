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

## 3. Estado actual del repo (Fase 1 terminada: interfaz con datos de ejemplo)

```
apps/web/            Next.js 16.3.5 · React 19.3 · Tailwind 4.3 · lucide-react
  src/app/           rutas: / · /panel · /panel/asignaciones(/nueva|/[id]) · /panel/recepciones
                     /r/[token](/confirmada) · /devolucion/[id] · /verificar/[consecutivo]
  src/components/    ui/ (primitivas propias, sin shadcn) · layout/ (shells, marca, aviso-demo)
  src/features/      panel/ · recepcion/ · devolucion/ · verificacion/
  src/lib/datos/repositorio.ts   ← ÚNICO acceso a datos (hoy mock; Fase 2 → cliente Apps Script)
  src/lib/mock/datos.ts          ← catálogo, asignaciones y términos de ejemplo
packages/shared/     zod 4: estados, constantes, esquemas (asignación, recepción, devolución)
apps/gas/            vacío (Fase 2)
n8n/workflows/       vacío (Fase 2)
```

Demo: `/r/demo` (flujo), `/r/espera`, `/r/expirado`, `/verificar/REC-000122` (alterada). Franja dorada "Modo interfaz" en `components/layout/aviso-demo.tsx` → quitar al conectar datos reales.

Costuras que no se ven leyendo un solo fichero:

- **`@check-auditorio/shared` se consume como TypeScript fuente** (`exports` → `src/index.ts`, `transpilePackages` en `next.config.ts`): no tiene build; un cambio ahí aplica directo en la web.
- **Las páginas solo leen datos vía `repositorio.ts`** (`server-only`). Su firma es el contrato que la Fase 2 debe conservar al cambiar el mock por el cliente de Apps Script; `resolverToken` hoy decide el estado por el texto del token (`espera`/`expirado`).
- **Los esquemas zod usan camelCase** (`espacioId`, `cantidadEsperada`) y la hoja usa snake_case: el mapeo va en la capa de acceso, no en los esquemas.
- **La regla «cantidad recibida ≠ esperada con CONFORME» NO está en `checklistItemInputSchema`** (el esquema no conoce el catálogo): vive en `features/recepcion/validacion.ts`, solo en cliente. El servidor de la Fase 2 debe repetirla contra el catálogo. La de «novedad exige observación y foto» sí está en el esquema compartido.

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
| `Asignaciones`       | id (uuid), espacio_id, evento, inicio, fin, estado, entregado_por, creada_en, token_sha256, token_vence, receptor_correo, receptor_sub, consecutivo                                                                                                                                                                          |
| `Recepciones`        | consecutivo, asignacion_id, receptor_nombre, receptor_correo, receptor_sub, rol, dependencia, cargo, celular, asistentes, terminos_version, terminos_sha256, sellada_en, sha256, codigo_verificacion, clave_idempotencia, user_agent, notificacion (PENDIENTE/ENVIANDO/ENVIADO/FALLIDO), notif_intentos, notif_reserva_hasta |
| `Recepcion_Detalle`  | consecutivo, elemento_id, elemento_nombre, cantidad_esperada, cantidad_recibida, estado, observacion, foto_ids                                                                                                                                                                                                               |
| `Devoluciones`       | consecutivo, resultado, declarada_en, sha256, clave_idempotencia, notificacion…                                                                                                                                                                                                                                              |
| `Devolucion_Detalle` | consecutivo, elemento_id, observacion, foto_ids                                                                                                                                                                                                                                                                              |
| `Bitacora`           | ts, evento, entidad_id, actor_correo, datos_json                                                                                                                                                                                                                                                                             |

Siempre IDs estables (uuid/consecutivo), **nunca número de fila**. Límite: 20 M celdas por libro.

## 6. Fase 2 — Mecanismo (orden sugerido, criterios de aceptación)

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

- Vercel: Root Directory `apps/web`, pnpm detectado por lockfile, Node 24. Variables: `NEXT_PUBLIC_APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `GAS_WEBAPP_URL`, `GAS_HMAC_SECRET` (ver `apps/web/.env.example`).
- Google Cloud: cliente OAuth con redirect `https://<dominio>/api/auth/callback/google` y el de localhost.
- Vercel Hobby = solo uso personal no comercial; confirmar plan/cuenta institucional antes de producción. Cron de Hobby: 1 vez/día → los recordatorios los hace n8n.
- Dueña de todo (Sheet, script, Drive, Gmail n8n, Vercel): **cuenta institucional de Infraestructura**, no personal.

## 8. Decisiones abiertas (preguntar a Leonardo antes de implementar)

1. ¿Infraestructura hace revisión previa del checklist al programar?
2. ¿Más espacios además del Auditorio Principal?
3. Vigencia del QR y plazo para declarar devolución.
4. Correo/cuenta de Infraestructura dueña del sistema.
5. n8n: ¿expuesto a internet por HTTPS? versión (1.x/2.x).
6. ¿Control Interno exige PDF archivado?
7. Texto final de términos (Jurídica).
8. Plan de Vercel.

## 9. Comandos

```bash
corepack enable && pnpm install
pnpm dev          # http://localhost:3000
pnpm check        # typecheck + lint + format:check
pnpm build
pnpm format       # prettier --write (incluye orden de clases Tailwind)

# Por paquete
pnpm --filter @check-auditorio/web lint
pnpm --filter @check-auditorio/shared typecheck
```

- **No hay runner de pruebas** (ni Vitest ni Playwright instalados): los criterios ✅ de la Fase 2 hoy se verifican a mano. Añadir uno es una dependencia nueva y se justifica.
- Git: rama `main`, remoto `origin` = `github.com/auxdiradministrativa-alt/check-auditorio`.
- `next dev` crea y vuelve a crear `apps/web/AGENTS.md` y `apps/web/CLAUDE.md` (reglas de Next para agentes): se versionan, no se borran.
- En esta máquina el puerto 3000 suele estar ocupado; `next dev` pasa solo al 3001.
