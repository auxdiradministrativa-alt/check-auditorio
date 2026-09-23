# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# check-auditorio — Spec de trabajo

Sistema de **entrega temporal de espacios** (auditorio) de la Corporación Universitaria Americana.
**Dueño funcional: Infraestructura** (encargo de alta gerencia). No usar "Activos Fijos" en ningún texto, nombre ni dato.
Idioma de UI, dominio y commits: **español**. Zona horaria: `America/Bogota`.

## 1. Flujo de negocio (fuente de verdad)

**Entrega directa, sin reservas (decisión de Leo, 2026-09-23, tarde)** — sustituye al flujo por
solicitud de la mañana ([spec archivada](docs/superpowers/specs/2026-09-23-flujo-solicitud-por-enlace.md)):
ya no hay solicitud, aprobación ni devolución con motivo.

1. La entrega se coordina por **cualquier canal**. **Infraestructura la registra en `/panel`** («Crear entrega»: evento, fecha, franja y **correo `@americana.edu.co` de quien recibe**) → nace en `PROGRAMADA`, revalidando el cruce de franja. Un solo espacio (el auditorio). El enlace/QR queda **amarrado a esa cuenta**: otra cuenta ve «Este enlace es personal» sin ningún dato del evento. Al crearla sale un correo «Entrega programada» a quien recibe.
2. **No hay validación de presencia por el gestor.** Desde `inicio − minutos_vigencia_qr_antes` (30) hasta `fin`, el enlace (`/r/[token]` o `/mi-entrega/[id]`) abre el acta; antes muestra cuándo podrá empezar, y a la hora de inicio llega un correo que lo recuerda. **Riesgo aceptado:** la constancia prueba la cuenta que confirmó, no la presencia física.
3. Quien recibe diligencia **una sola vez, en el acta**, sus datos (rol, dependencia, cargo opc., celular, asistentes) y el **checklist solo de infraestructura** (decisión de Leo, 2026-09-23; spec [`2026-09-23-checklist-solo-infraestructura.md`](docs/superpowers/specs/2026-09-23-checklist-solo-infraestructura.md)): un paso con los 10 aspectos oficiales (pisos, muros, iluminación, aire, sillas…), cada uno `CONFORME`/`NOVEDAD`; **sin equipos electrónicos, sin cantidades ni categorías**; **foto obligatoria solo si hay novedad**; atajo «Todo en buen estado» que no pisa una novedad ya descrita → **términos + autorización** (casillas separadas, sin marcar) → envía.
4. El servidor **sella**: consecutivo `REC-000123`, hora del servidor, SHA-256 del registro canónico, código de verificación. Queda `RECIBIDA`. **No hay acta Doc/PDF**: constancia = fila en Sheets + correo HTML + `/verificar/[consecutivo]` (recalcula hash; PDF solo con imprimir).
5. **Devolución**: la declara **solo quien recibió**, desde su enlace personal (buenas condiciones / con novedades + foto). Infraestructura **no participa**. Si vence el plazo → `DEVOLUCION_VENCIDA` + alerta. Control cruzado: diferencias en la siguiente entrega se asocian al turno anterior.

Estados: `PROGRAMADA → EN_DILIGENCIAMIENTO → RECIBIDA → DEVUELTA | DEVOLUCION_VENCIDA`; terminales `ANULADA`, `EXPIRADA`. **Solo para leer filas históricas:** `INVITADA`/`SOLICITADA`/`RECHAZADA` (flujo por solicitud: ya no hay acción que las avance; el panel las marca «Registro anterior», se anulan y se recrean, y expiran solas en su `token_vence`) y `EN_VALIDACION` (QR genérico con validación del gestor; `qr.reclamar` rechaza toda fila con enlace personal). Se retiraron `invitacion.crear`, `solicitud.diligenciar` y `solicitud.decidir`; `/mi-solicitud/[id]` reexporta `/mi-entrega/[id]` para no romper correos ya enviados.
Fuera de alcance v1: **externos** (sin cuenta del dominio), integración con SIGAF.

## 2. Arquitectura (decidida, no reabrir)

```
Navegador ─► Vercel · Next.js 16 (UI + auth + validación + sello)
                 │  HMAC en el CUERPO (Apps Script no expone headers en doPost)
                 ▼
             Apps Script independiente (cuenta institucional de Infraestructura)
               · ÚNICO escritor del Google Sheet (LockService) · CacheService · Drive (fotos)
               · activador de tiempo cada 10 min → procesarOutbox → MailApp (correos HTML)
```

- **BD = Google Sheets** (lo opera Infraestructura sin TI). Nunca escribir la hoja desde Vercel.
- **Sin n8n en notificaciones (decisión de Leo, 2026-09-23).** Los correos los envía el propio Apps Script desde la cuenta dueña: bandeja de salida por correo en las columnas `notif_*`, reservada con el mismo `LockService`, **enviada fuera del bloqueo**, 3 intentos y respeto de la cuota diaria. El flujo de n8n (commit `d0e0275`, `docs/superpowers/specs/2026-09-15-n8n-punto-de-partida.md`) queda **archivado, sin borrar**, hasta probar el activador en la cuenta real.
- **Primero guardar, luego notificar.** El correo nunca es el registro: todo lo que avisa ya se ve en la web, y los correos enlazan a `/mi-entrega/[id]` (el token del QR lo deriva la web; Apps Script no lo conoce).

## 3. Estado actual del repo (Bloque 1 terminado: mecanismo completo sin credenciales)

La Fase 2 está **escrita y probada en modo local**: el flujo entero corre contra el mismo núcleo que
irá a Apps Script, sobre un libro en memoria. **Google conectado y producción desplegada el
2026-09-15** en `https://check-auditorio-web.vercel.app`: prueba de uso completa en producción con
la sesión real (REC-000001). Guía y estado de Google en
[`docs/google-workspace.md`](docs/google-workspace.md). **Flujo por enlace en producción desde el
2026-09-23** (web en Vercel desde `main`; Apps Script verificado por huella); la **entrega directa** (§1)
está en el árbol local, **sin commit ni publicar**. Para cambios futuros
del esquema, el orden (`instalar()` con la cuenta dueña → `publicar` → push de la web) está en la
spec §10.bis; saltárselo tumba los `doPost` o las escrituras. Latencia medida de Apps Script: páginas 2–4 s,
escrituras 13–20 s.

```
packages/shared/          contrato, sin build (se consume como TS fuente)
  src/domain/             zod 4: estados, constantes, esquemas de entrada, fechas
  src/protocolo.ts        Acciones {entrada, salida}, Respuesta, Sobre HMAC, cadenaAFirmar
  src/sin-zod.ts          entrada `./sin-zod` para Apps Script (el bundle de GAS no lleva zod)
apps/gas/                 núcleo del registro — Clean Architecture, esbuild → dist/codigo.js
  src/dominio/            reglas puras: asignación, recepción, devolución, sello, errores
  src/aplicacion/         puertos · enrutador (acción → caso) · sobre (HMAC, ventana, nonce)
                          casos/ un módulo por caso de uso (asignaciones.ts: crear la entrega; iniciar-recepcion.ts;
                          notificaciones.ts: la bandeja de correo)
                          correo/ plantillas HTML puras + colores.ts (Sage Garden en hex)
  src/infraestructura/
    hojas/                esquema (columnas §5), semilla, repositorios sobre la interfaz Tabla
    gas/                  tabla-gas, servicios-gas (Lock, Cache, Digest, Drive), correo-gas (MailApp),
                          instalar, main (doGet/doPost/procesarOutbox)
    memoria/              Tabla y servicios en memoria (pruebas y desarrollo local)
  src/nucleo.ts           raíz de composición: crearNucleo(tabla, servicios)
  pruebas/                node:test contra el núcleo en memoria
apps/web/                 Next.js 16.3.5 · React 19.3 · Tailwind 4.3 · lucide-react
  src/app/                / · /panel (operación, entregas, registro y constancias)
                          /panel?evento=<id>#operacion · /panel?nuevo=1#operacion
                          /panel/asignaciones(/nueva|/[id]) y /panel/recepciones redirigen al centro
                          /r/[token](/confirmada) · /devolucion/[id]?t= · /verificar/[consecutivo]
                          /mi-entrega/[id] (enlace estable de los correos: sesión → paso que toca; /mi-solicitud lo reexporta)
  src/features/<f>/       UI del caso + acciones.ts (Server Actions) en auth · panel · fotos · recepcion · devolucion; verificacion solo UI
  src/servidor/           solo servidor (`server-only`)
    entorno.ts            variables validadas; modos gas|memoria y google|local
    registro/             ÚNICO puerto de datos: index → cliente-gas (POST firmado) | cliente-memoria
                          lecturas: catálogo con revalidación a 60 s en GAS; estados sin caché persistente
    auth/                 better-auth (Google, sin BD) · sesion-local · sesion · permisos (guardas)
    tokens.ts · qr.ts · accion.ts (ejecutarAccion → Resultado)
  e2e/                    Playwright: entrega directa de punta a punta, gestión (enlace, filtros, CSV,
                          móvil) e ingreso; apoyo.ts con cuentas y franjas compartidas
n8n/workflows/            vacío (notificaciones sin n8n desde 2026-09-23)
```

Centro de gestión: `features/panel/centro-gestion.tsx` compone operación, filtros y tablas paginadas.
`detalle-evento.tsx` reutiliza la asignación y el catálogo leídos por `/panel`, sin consultas propias.
El formulario se carga al abrirlo; la búsqueda, filtros, paginación y exportación trabajan sobre el
listado ya recibido. Los enlaces antiguos conservan compatibilidad mediante redirecciones.
Permisos y sesiones se deduplican con `React.cache` **solo dentro de una petición**, nunca entre usuarios.
Las pruebas usan `.next-e2e` (`CHECK_E2E=1`) para no interferir con el servidor de desarrollo abierto.

Costuras que no se ven leyendo un solo fichero:

- **Dos modos por pieza, decididos por variables** (`servidor/entorno.ts`): registro `gas` si hay `GAS_WEBAPP_URL`+`GAS_HMAC_SECRET`, si no `memoria`; auth `google` si están las 3 de Google, si no `local` (formulario de nombre+correo, cookie firmada). **En producción, faltar cualquiera lanza** (`exigirEntornoCompleto`) — no degrada. La franja «Modo local» (`aviso-demo.tsx`) aparece sola mientras algún modo sea local.
- **El mismo núcleo corre en Apps Script y en memoria.** `cliente-memoria` importa `@check-auditorio/gas/memoria` y lo guarda en `globalThis` (sobrevive al hot reload; se borra al reiniciar `next dev`). Probar el núcleo en local prueba la lógica de GAS, **no** el runtime V8 de Google ni `SpreadsheetApp`.
- **Tokens derivados, no aleatorios almacenados** (`servidor/tokens.ts`): `token = HMAC(BETTER_AUTH_SECRET, 'qr'|'devolucion' + '|' + asignacionId)`; la hoja guarda solo el SHA-256 del de QR. El panel puede volver a mostrar el QR, pero **rotar `BETTER_AUTH_SECRET` invalida todos los QR y enlaces emitidos**, y local y Vercel deben compartirlo si usan el mismo Sheet.
- **`@check-auditorio/shared` se consume como TypeScript fuente** (`exports` → `src/index.ts`, `transpilePackages` en `next.config.ts`): un cambio ahí aplica directo en la web y en el bundle de GAS.
- **Los esquemas zod usan camelCase y la hoja snake_case**: el mapeo vive en `apps/gas/src/infraestructura/hojas/repositorios.ts`, que lee y escribe por **nombre** de columna (reordenar columnas a mano no rompe nada).
- **El checklist debe cubrir exactamente el catálogo vigente**: el esquema compartido no conoce el catálogo, así que eso lo exige el dominio del núcleo (`dominio/recepcion.ts`, contra la hoja). «Novedad exige observación y foto» está en el esquema compartido y otra vez en el núcleo.
- **`revalidatePath` dentro de una Server Action repinta la página actual**: un estado de éxito que solo vive en el cliente se pierde. Por eso las confirmaciones las pinta el servidor desde el registro (ver `/devolucion/[id]`).
- **El POST a Apps Script solo se reenvía si la conexión ni se abrió; la lectura de su respuesta sí se reintenta** (`registro/cliente-gas.ts`): doPost ejecuta y responde 302 a un eco en googleusercontent que a veces da 404 o redirige a `/exec` (se leería doGet). Se sigue la redirección a mano, se relee el eco hasta 4 veces y se valida la forma. Repetir un POST que llegó duplicaría la acción; por eso el reenvío (3 intentos, solo ante `UND_ERR_CONNECT_TIMEOUT`, `ECONNREFUSED`, DNS…) usa **el mismo sobre y nonce**, que Apps Script rechazaría si llegara dos veces.
- **`RefrescoAutomatico` espera a que termine el refresco anterior**: con GAS un refresco dura segundos; un `setInterval` de 4 s cancelaba cada uno y el panel no se enteraba de la recepción. En memoria no se ve.
- **Escritura no transaccional**: si Apps Script falla a mitad de `recepcion.registrar`, pueden quedar filas parciales. La clave de idempotencia permite reintentar; no hay rollback.
- **El enlace personal tiene dos puertas y las dos cuentan**: la web (`app/r/[token]/page.tsx`, `features/recepcion/acciones.ts`, `/mi-entrega`) compara el correo de la sesión con `invitadoCorreo` antes de pintar nada, y el núcleo lo exige otra vez (`exigirInvitado` + `exigirReceptor` por `sub`). La web decide qué se ve; el núcleo, qué se escribe.
- **La vista `Asignacion` trae los plazos calculados** (`tokenVence`, `recepcionDesde`): la web nunca escribe 72 h ni 30 min. Si Infraestructura cambia `CFG_General`, el panel y el solicitante lo muestran solos.
- **`asignacion.crear` es idempotente por `id`** (lo genera la web): reintentar con los mismos datos devuelve la misma entrega; el mismo `id` con otros datos se rechaza.
- **Publicar primero el núcleo y enseguida la web**: la entrega directa quitó acciones del protocolo. Con la web vieja sobre el núcleo nuevo, «Emitir enlace» falla (acción desconocida); con la web nueva sobre el núcleo viejo, la entrega se crearía sin cuenta amarrada. El esquema de columnas no cambió: no hace falta `instalar()`.
- **`tabla-gas` es estricto con las columnas**: si falta una, falla con «Faltan columnas… Ejecuta instalar()». Tras un cambio de esquema, toda escritura falla hasta ejecutar `instalar()` en el libro real — a propósito, para no escribir filas a medias.
- **La bandeja de correo reserva con bloqueo y envía sin él**: las firmas de los usuarios esperan el bloqueo 20 s y `MailApp` tarda segundos. Hueco aceptado: si Apps Script muere entre enviar y marcar, ese correo sale dos veces.
- **Publicar el núcleo = `pnpm --filter @check-auditorio/gas publicar`, nunca a mano en el editor**: una «Nueva implementación» crea otra URL y la web se queda en la versión vieja sin error visible (pasó el 2026-09-23). `doGet` devuelve la `huella` del bundle; `publicar` falla si la URL de la web no sirve la recién compilada. Las sondas fuerzan IPv4 (en esta red Node se cuelga por IPv6 con Google).
- **Si `pnpm e2e` llena el log de `unhandledRejection: JSON.parse` sin stack**, es `.next-e2e/dev/cache/next-devtools-config.json` escrito a medias (bytes nulos) por una corrida interrumpida: se borra y Next lo regenera. No es código nuestro (medido el 2026-09-23).

## 4. Reglas del código

- **Versiones fijadas**: TypeScript **6.0.3** (typescript-eslint soporta `<6.1`; TS 7 rompe el lint), ESLint **9** (plugins de Next no soportan 10), **pnpm 10.34.5** (máximo que Vercel instala sin configurar), Node ≥22 (Vercel usa 24). No actualizar sin verificar compatibilidad.
- Validación en los bordes con los esquemas de `@check-auditorio/shared`; el servidor revalida todo. **Nunca confiar en el cliente** para identidad, hora, catálogo ni versión de términos.
- Secretos solo en server (`import 'server-only'`). Verificar sesión **dentro de cada Server Action/Route Handler**, no solo en `proxy.ts` (Next 16 renombró `middleware` → `proxy`).
- **Paleta oficial: Sage Garden (decisión de Leo, 2026-09-23)**, tema de 21st.dev adoptado completo (colores, radio 0.35rem, `--spacing` 0.23rem, fuentes). Solo **tokens por rol** de `globals.css`, nunca un color literal: texto `foreground` / `muted-foreground`; superficies `background`, `card`, `sidebar` (barra superior), `muted`, `accent`; marca `primary` (solo foco, líneas y detalles: con texto blanco da 3.40:1) y **`primary-strong`** (botones rellenos y enlaces, 5.95:1), `primary-soft`; bordes `border` y `border-strong` (campos, 3:1); estados `success*`, `attention*` (el dorado del escudo) y `destructive*`. El texto sobre `destructive-soft` va en `destructive-strong`, y el texto sobre `muted` en `foreground` (`muted-foreground` sobre `muted` da 3.88:1). El bloque `.dark` existe pero nada lo activa.
- Diseño: **Antic** (sans, solo peso 400; los 600 se sintetizan) y JetBrains Mono para códigos, cargadas por `next/font` en `app/layout.tsx`. Signifier (serif del tema) es comercial y cae en Georgia. `text-page` / `sm:text-page-lg` para título de página, `text-section` para secciones y **`text-card-title`** para tarjetas (no `text-card`: sería el color de la superficie; el nombre está registrado en `lib/cn.ts` para tailwind-merge). Etiquetas medium, cuerpo regular y metadatos `text-xs`; evitar tamaños arbitrarios y mayúsculas decorativas. Fondo `background`, cards `card`, encabezados y pies de card `background`. Usar `CardHeader`, `CardBody` y `CardFooter` con padding compartido; `CardTitle` admite `as` para respetar niveles de títulos anidados.
- Con `--spacing` a 0.23rem, `min-h-11` mide ~40 px, no 44: las zonas táctiles quedan por encima de los 24 px de WCAG 2.2 AA, pero por debajo de los 44 que recomienda la guía de Apple.
- Archivos kebab-case; componentes y dominio con nombres en español; sin `any`; sin dependencias nuevas sin justificarlas.
- Antes de dar algo por terminado: `pnpm check` (typecheck + lint + format) y `pnpm build` en verde.

## 5. Modelo de datos — Google Sheet

Pestañas **editables por Infraestructura**:

| Hoja                | Columnas                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `CAT_Espacios`      | id, nombre, ubicacion, capacidad, activo                                                                                    |
| `CAT_Elementos`     | id, espacio_id, nombre, orden, activo (aspectos de infraestructura del checklist)                                           |
| `CFG_Entregadores`  | correo, nombre, activo (quién puede usar `/panel`)                                                                          |
| `CFG_Destinatarios` | correo, nombre, evento (recepcion/devolucion/novedad/vencida), activo                                                       |
| `CFG_Terminos`      | version, texto_clausulas (JSON), texto_datos, sha256, vigente                                                               |
| `CFG_General`       | clave, valor (horas_plazo_devolucion, minutos_vigencia_qr_antes, horas_vigencia_invitacion, url_app, notificaciones_desde…) |

Pestañas **protegidas (solo el script)** — nunca se editan ni borran; anular = evento en bitácora:

| Hoja                 | Columnas clave                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Asignaciones`       | id (uuid), espacio_id, evento, inicio, fin, estado, entregado_por, creada_en, token_sha256, token_vence, receptor_correo, receptor_nombre, receptor_sub, consecutivo; **flujo por enlace:** invitado_correo, solicitada_en, motivo_rechazo, solicitud_{rol,dependencia,cargo,celular,asistentes}, autoriza_datos_{en,version,sha256}, notif_{decision,confirmacion,vencida} con sus `_intentos` y `_reserva` |
| `Recepciones`        | consecutivo, asignacion_id, receptor_nombre, receptor_correo, receptor_sub, rol, dependencia, cargo, celular, asistentes, terminos_version, terminos_sha256, sellada_en, sha256, codigo_verificacion, clave_idempotencia, user_agent, notificacion (PENDIENTE/ENVIANDO/ENVIADO/FALLIDO), notif_intentos, notif_reserva_hasta                                                                                 |
| `Recepcion_Detalle`  | consecutivo, elemento_id, elemento_nombre, estado, observacion, foto_ids                                                                                                                                                                                                                                                                                                                                     |
| `Devoluciones`       | consecutivo, resultado, declarada_en, sha256, clave_idempotencia, notificacion…                                                                                                                                                                                                                                                                                                                              |
| `Devolucion_Detalle` | consecutivo, elemento_id, observacion, foto_ids                                                                                                                                                                                                                                                                                                                                                              |
| `Bitacora`           | ts, evento, entidad_id, actor_correo, datos_json                                                                                                                                                                                                                                                                                                                                                             |

Siempre IDs estables (uuid/consecutivo), **nunca número de fila**. Límite: 20 M celdas por libro.
La fuente de verdad de las columnas es `apps/gas/src/infraestructura/hojas/esquema.ts` (la escribe `instalar()`); esta tabla la resume.
Las columnas del flujo por enlace (2026-09-23) van **al final** y `instalar()` las añade a un libro existente sin tocar filas; ninguna entra en el sello (`contenidoRecepcion`), así que las constancias anteriores siguen «Íntegra». `token_vence` es el `fin` de la entrega (en filas históricas: invitación +72 h, solicitada el `inicio` propuesto). `solicitada_en`, `motivo_rechazo` y `solicitud_*` ya no se escriben; `notif_decision` guarda el correo «Entrega programada».
`receptor_nombre` (Asignaciones) se añadió en el Bloque 1: la tarjeta de validación lo necesita sin cruzar hojas. `categoria`, `cantidad_esperada` y `cantidad_recibida` se retiraron el 2026-09-23: `instalar()` solo añade columnas, así que en el libro real las quita `reiniciarRegistroDePrueba()` (copia el libro, vacía el registro de pruebas y vuelve a sembrar catálogo y términos; exige la propiedad `PERMITIR_REINICIO=SI` y la borra al terminar). Todas las celdas de las pestañas protegidas son texto plano. `DEVOLUCION_VENCIDA` no se escribe: se deriva al leer (`dominio/asignacion.ts`).

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

**2.3 QR** — token derivado en servidor; en la hoja solo su SHA-256; vigente desde `inicio − N min` hasta `fin`; un solo uso. URL `${APP_URL}/r/${token}`; QR SVG generado en servidor (paquete `qrcode`), descargable desde la operación del evento. Panel refresca cada ~4 s cuando el evento seleccionado está programado, en validación o diligenciándose; el seguimiento general usa ~30 s mientras haya reservas abiertas. Cada refresco espera al anterior y respeta la visibilidad de la pestaña.

- ✅ Token usado, vencido o inexistente → pantalla "QR no vigente"; rechazar vuelve a `PROGRAMADA`.

**2.4 Recepción** — Route Handler/Server Action: sesión + esquema + estado `EN_DILIGENCIAMIENTO` + cuenta = la validada. Fotos: comprimir en cliente (≤1600 px, JPEG ~0.72), subir una por una (`foto.subir` → id de Drive) antes de enviar. Servidor agrega identidad, hora, catálogo, términos; arma JSON canónico (claves ordenadas, RFC 8785) → SHA-256 → `recepcion.registrar`.

- ✅ Cantidad recibida ≠ esperada con estado CONFORME → rechazado en cliente y servidor. Novedad sin foto u observación → rechazado.

**2.5 Devolución y verificación** — enlace `/devolucion/[id]?t=token-personal` + login de la misma cuenta. `/verificar` recalcula el hash desde la hoja y muestra Íntegra/Alterada (requiere login).

- ✅ Editar a mano una celda de `Recepcion_Detalle` → `/verificar` muestra "Alterada".

**2.6 Notificaciones — ~~n8n~~ sustituido por Apps Script (2026-09-23)**, spec del flujo por enlace §6 y §7. Un activador de tiempo (`procesarOutbox`, cada 10 min, lo crea `instalar()`) envía con `MailApp` desde la cuenta dueña: decisión (aprobada/devuelta), «Confirma la recepción» al llegar el inicio, constancia (solicitante + destinatarios fijos) y devolución vencida. El diseño con n8n (WF-00…03) queda archivado en el commit `d0e0275`.

- Correo: escapar todo texto del usuario, estilos en línea, **< 102 KB** (Gmail recorta), texto plano en el mismo envío; enlace de devolución **solo** en el correo de quien recibió; sin celular ni enlaces personales en el de destinatarios fijos. Vista previa: `pnpm --filter @check-auditorio/gas vista-correo`.
- Requiere el permiso `script.send_mail`: lo autoriza la cuenta dueña al ejecutar `instalar()`, nunca el agente.
- ✅ (núcleo) Dos barridos seguidos → un solo envío; 3 fallos → `FALLIDO` + bitácora; sin cuota → espera sin gastar intento; no envía la confirmación antes de `inicio`. **Pendiente con Google real:** cuotas de `MailApp` y del activador en la cuenta `auxdiradministrativa@`.

## 7. Fase 3 — Deploy

- **Desplegado (2026-09-15)**: cuenta de Vercel de la auxiliar (GitHub `auxdiradministrativa-alt`), proyecto con dominio `check-auditorio-web.vercel.app`, región `iad1`, despliega solo con push a `main`. Trampas medidas:
  - `NEXT_PUBLIC_APP_URL` **no puede ser Secret** (Vercel lo rechaza) → tipo **Config**. Se fija al compilar: cambiarla exige redeploy. Con `http://localhost:3001` el login de Google vuelve a localhost.
  - **Editar una variable Secret la guarda vacía** (el campo Value aparece en blanco): para cambiarle el entorno se borra y se crea de nuevo.
  - Variables **solo en Production**: las previews corren con `NODE_ENV=production` y escribirían en el Sheet real.
  - Pegar `.env.local` en el campo Key crea todas las variables de una vez (incluida la de localhost: quitarla).
  - Si en producción `/api/auth/*` da 404, la app cree estar en modo local: falta una variable de Google o `BETTER_AUTH_SECRET` (el 500 de las páginas nombra cuáles en el log).
- Vercel: Root Directory `apps/web`, pnpm detectado por lockfile, Node 24. Variables: `NEXT_PUBLIC_APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `GAS_WEBAPP_URL`, `GAS_HMAC_SECRET` (ver `apps/web/.env.example`).
- Google Cloud: cliente OAuth con redirect `https://<dominio>/api/auth/callback/google` y el de localhost.
- Vercel Hobby = solo uso personal no comercial; confirmar plan/cuenta institucional antes de producción. Cron de Hobby: 1 vez/día → los recordatorios los hace el activador de Apps Script.
- Dueña de todo (Sheet, script, Drive, correo, Vercel): **cuenta institucional de Infraestructura**, no personal.

## 8. Decisiones abiertas (preguntar a Leonardo antes de implementar)

1. ¿Infraestructura hace revisión previa del checklist al programar?
2. ¿Más espacios además del Auditorio Principal?
3. Vigencia del QR y plazo para declarar devolución.
4. ~~Correo/cuenta de Infraestructura dueña del sistema.~~ **Cerrada (2026-09-15):** `auxdiradministrativa@americana.edu.co` es dueña de Sheet, script, Drive, Gmail, OAuth y repo; a esa persona se le entrega el proyecto. Las keys/credenciales de Google Workspace las configura Leonardo: avisarle al llegar a ese punto, no crearlas.
   **MVP 2026-09-15 (confirmado por Leonardo):** sale **sin correo** (n8n después; la constancia vive en la hoja + `/verificar` y el enlace de devolución se muestra en la pantalla de confirmación). Nº 3 por defecto en `CFG_General`: QR vigente desde **30 min** antes del inicio; devolución hasta **24 h** tras el fin. Nº 7: términos de ejemplo marcados **borrador** hasta el texto de Jurídica.

5. ~~n8n: ¿expuesto a internet por HTTPS? versión.~~ **Cerrada (2026-09-23):** sin n8n; notifica Apps Script.
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
pnpm --filter @check-auditorio/gas publicar  # ÚNICA forma de publicar: build, push, versión, apunta la implementación de GAS_WEBAPP_URL y verifica su huella
pnpm --filter @check-auditorio/gas push      # solo build + clasp push (no cambia lo que sirve la web)
pnpm --filter @check-auditorio/web probar-gas  # GET + POST firmado contra GAS_WEBAPP_URL de .env.local

# Por paquete
pnpm --filter @check-auditorio/web lint
pnpm --filter @check-auditorio/shared typecheck
```

- **Pruebas** (sin credenciales, todo en modo local):
  - `pnpm --filter @check-auditorio/gas prueba` → núcleo en memoria con `node:test` (flujo, idempotencia, «Alterada», catálogo oficial, novedades, QR, cruce, HMAC).
  - `pnpm e2e` → Playwright (`apps/web/e2e/`): levanta su propio `next dev` en el **puerto 3100**, con compilación aislada en `.next-e2e`, y prueba la gestión unificada y el flujo con tres navegadores: entregador, receptor e intruso. Puede coexistir con `pnpm dev` en 3001. La franja del evento se calcula con la hora actual de Bogotá, así que no corre después de las 23:55.
- Git: rama `main`, remoto `origin` = `github.com/auxdiradministrativa-alt/check-auditorio`.
- `next dev` crea y vuelve a crear `apps/web/AGENTS.md` y `apps/web/CLAUDE.md` (reglas de Next para agentes): se versionan, no se borran.
- `pnpm dev` usa el puerto **3001 fijo** (`next dev -p 3001`): el redirect OAuth de localhost apunta ahí y `NEXT_PUBLIC_APP_URL` debe coincidir. Si está ocupado, falla en vez de moverse de puerto.
