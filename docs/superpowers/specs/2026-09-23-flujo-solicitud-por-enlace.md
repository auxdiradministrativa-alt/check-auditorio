# Flujo por solicitud con enlace personal y notificaciones desde Apps Script

**Fecha:** 2026-09-23 · **Estado:** aprobado por Leonardo, pendiente de construir.
**Sustituye:** en el flujo de negocio (§1 de `CLAUDE.md`), la creación del evento por el gestor y la
validación de presencia; en la arquitectura (§2), n8n como pieza de notificaciones.

## 1. Decisiones de Leonardo (2026-09-23, por escrito)

1. La solicitud llega por **cualquier canal** (contacto, correo, presencial). El sistema empieza
   cuando el gestor la formaliza.
2. El gestor emite un **enlace/QR único amarrado al correo `@americana.edu.co` del solicitante**:
   solo esa cuenta de Google lo abre. Caduca si no se diligencia (por defecto **72 h**).
3. El solicitante diligencia los **datos del evento** y los suyos. El gestor **aprueba o rechaza**;
   rechazar devuelve la solicitud para corrección con un motivo visible.
4. **Un solo espacio**: el auditorio. El solicitante no elige espacio.
5. **No hay validación de presencia por el gestor.** La entrega física la confirma el solicitante
   desde un correo que le llega a la hora del evento y abre una confirmación atada a su solicitud.
   **Riesgo aceptado:** la constancia prueba la cuenta que confirmó, no la presencia física.
6. **Sin n8n.** Las notificaciones las envía el propio Apps Script (activador de tiempo + `MailApp`).
7. El correo de confirmación es una **plantilla HTML de calidad institucional** con botón de acceso.

## 2. Flujo

```
Canal externo ──► 1. Gestor emite enlace (correo del solicitante)          INVITADA
                      │  caduca en horas_vigencia_invitacion (72)
                      ▼
                  2. Solicitante abre /r/[token], login con ESA cuenta,
                     diligencia evento, inicio, fin y sus datos + autoriza datos   SOLICITADA
                      │
                      ▼
                  3. Gestor aprueba ──► PROGRAMADA        rechaza ──► RECHAZADA (motivo)
                      │ (revalida cruce)                         │ el solicitante corrige
                      │                                          └──► SOLICITADA
                      ▼
                  4. inicio: el activador envía el correo «Confirma la recepción»
                     (el mismo enlace muestra el botón aunque el correo no llegue)
                      ▼
                  5. Solicitante confirma: checklist con atajo «Todo en buen estado»
                     o novedad con foto                              EN_DILIGENCIAMIENTO → RECIBIDA (sello)
                      ▼
                  6. Devolución: igual que hoy
```

**El correo nunca es el registro.** Desde `inicio − 30 min` hasta `fin`, el enlace personal muestra
«Confirmar recepción» con correo o sin él. El activador solo recuerda.

## 3. Estados

Se **añaden** `INVITADA`, `SOLICITADA` y `RECHAZADA` a `ESTADOS_ASIGNACION`
(`packages/shared/src/domain/estados.ts`). Se reutilizan `PROGRAMADA` (= aprobada),
`EN_DILIGENCIAMIENTO`, `RECIBIDA`, `DEVUELTA`, `DEVOLUCION_VENCIDA`, `ANULADA` y `EXPIRADA`.

- `EN_VALIDACION` y su código (`qr.reclamar`, `validacion.decidir`, `tarjeta-validacion.tsx`) **se
  conservan** para leer filas históricas, pero ninguna fila nueva pasa por ahí. Retirarlos es una
  decisión aparte, cuando no quede ninguna fila en ese estado.
- `estadoEfectivo` (`apps/gas/src/dominio/asignacion.ts:10`): `INVITADA`, `SOLICITADA` o
  `RECHAZADA` con `ahora > token_vence` ⇒ `EXPIRADA`. Al aprobar, `token_vence` pasa a ser `fin`.
- `exigirSinCruce` (`asignacion.ts:26`) **debe ignorar** `INVITADA`, `SOLICITADA` y `RECHAZADA`:
  solo una solicitud aprobada ocupa la franja. Se evalúa **al diligenciar** (aviso temprano contra
  lo ya aprobado) y **al aprobar** (la decisión que cuenta: otra pudo aprobarse entre medias).
- Aprobar exige además `fin > ahora`.
- `ANULABLES` (`asignacion.ts:43`) gana los tres estados nuevos.

## 4. Datos

**`Asignaciones`: columnas nuevas, añadidas al final** (la hoja se lee por nombre; no se borra ni
renombra ninguna):

| Columna                                                                                             | Qué guarda                                                                                       |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `invitado_correo`                                                                                   | La única cuenta que puede abrir el enlace                                                        |
| `motivo_rechazo`                                                                                    | El último motivo (el histórico completo, en `Bitacora`)                                          |
| `receptor_rol`, `receptor_dependencia`, `receptor_cargo`, `receptor_celular`, `receptor_asistentes` | Lo que diligenció el solicitante, para que el gestor decida y para **precargar** la confirmación |
| `autoriza_datos_en`                                                                                 | Hora del servidor en que autorizó el tratamiento de datos en la solicitud (Ley 1581)             |
| `notificacion`, `notif_intentos`, `notif_reserva_hasta`                                             | Bandeja de salida del correo de confirmación y de la alerta de devolución vencida                |

Al emitir la invitación, `evento` queda en `Por definir` e `inicio = fin = creada_en`, porque
`asignacionSchema` los exige. Toda vista que liste asignaciones debe mostrar «Por definir» en vez de
fechas para `INVITADA` (tabla, línea de tiempo, CSV).

**`CFG_General`:** clave nueva `horas_vigencia_invitacion` = `72` (también en `semilla.ts`).

**Sello y constancias existentes.** `contenidoRecepcion` (`apps/gas/src/dominio/sello.ts:30`)
**no cambia**: `rol`, `dependencia`, `celular`, etc. se siguen guardando en `Recepciones` al
confirmar, y evento, inicio y fin se leen de las mismas columnas. REC-000001 sigue «Íntegra».

**Doble captura evitada.** La confirmación precarga rol, dependencia, cargo, celular y asistentes
desde la solicitud; el solicitante solo los revisa. Términos y autorización se marcan de nuevo en la
confirmación (casillas sin marcar, como hoy), porque entran al sello con su versión.

**Ley 1581.** La solicitud recoge datos antes de aprobar: se pide la autorización ahí. Una solicitud
rechazada o expirada conserva sus datos en la hoja. **Pendiente de Jurídica:** plazo de conservación.

## 5. Contrato (`packages/shared/src/protocolo.ts`)

Acciones **nuevas** (ninguna se retira):

| Acción                  | Entrada                                                                           | Resultado                  |
| ----------------------- | --------------------------------------------------------------------------------- | -------------------------- |
| `invitacion.crear`      | `id`, `correoSolicitante`, `entregadoPor`, `tokenSha256`                          | `INVITADA`                 |
| `solicitud.diligenciar` | `id`, `receptor` (identidad de la sesión), `datos: SolicitudInput`                | `SOLICITADA`               |
| `solicitud.decidir`     | `id`, `decision: APROBAR\|RECHAZAR`, `motivo?` (obligatorio al rechazar), `actor` | `PROGRAMADA` o `RECHAZADA` |
| `recepcion.iniciar`     | `id`, `receptor`                                                                  | `EN_DILIGENCIAMIENTO`      |

`recepcion.registrar` **no cambia**.

`solicitudInputSchema` (en `esquemas.ts`): `evento`, `inicio`, `fin` (con `fin > inicio`), `rol`,
`dependencia`, `cargo`, `celular`, `asistentesEstimados` (mismas reglas que
`recepcionInputSchema`, `esquemas.ts:104`) y `autorizaDatos: true`.
`asignacionSchema` gana `invitadoCorreo` y `motivoRechazo` (nulos en filas viejas).

**Servidor, nunca el cliente:** la identidad sale de la sesión; `solicitud.diligenciar` y
`recepcion.iniciar` exigen que el correo de la sesión sea `invitado_correo`
(`exigirInvitado`, análoga a `exigirReceptor`); el espacio lo fija el núcleo y falla explícitamente
si `CAT_Espacios` no tiene exactamente uno activo; la hora es la del servidor.

## 6. Notificaciones sin n8n

**Dónde:** `apps/gas/src/infraestructura/gas/activador.ts`, función global `procesarOutbox`
exportada desde `main.ts` como `doGet`, `doPost` e `instalar`.

**Instalación:** `instalar()` crea, si no existe, un activador `timeBased().everyMinutes(10)` que
llama a `procesarOutbox`. `appsscript.json` gana el permiso
`https://www.googleapis.com/auth/script.send_mail`. ⚠️ **La cuenta dueña debe volver a autorizar
el script: se avisa a Leonardo antes del `push`; no lo hace el agente.**

**Qué envía:**

| Correo                | Cuándo                          | A quién                                       | Columna de bandeja          |
| --------------------- | ------------------------------- | --------------------------------------------- | --------------------------- |
| Confirma la recepción | `PROGRAMADA` y `ahora ≥ inicio` | Solicitante                                   | `Asignaciones.notificacion` |
| Constancia sellada    | Al quedar `RECIBIDA`            | Solicitante + `CFG_Destinatarios` (recepcion) | `Recepciones.notificacion`  |
| Devolución vencida    | `DEVOLUCION_VENCIDA` derivado   | `CFG_Destinatarios` (vencida)                 | `Asignaciones.notificacion` |

**Cómo:** con el **mismo** `LockService` de `doPost` (`servicios-gas.ts`), para que la hoja siga
teniendo un solo escritor.

1. Reserva: `ENVIANDO` + `notif_reserva_hasta = ahora + 5 min` (una reserva vencida se puede retomar).
2. Envía con `MailApp.sendEmail` desde la cuenta dueña.
3. Éxito ⇒ `ENVIADO`. Fallo ⇒ `notif_intentos + 1`; al 3.º ⇒ `FALLIDO` + evento en `Bitacora`.
4. Si `MailApp.getRemainingDailyQuota() < 10`, corta y sigue en el próximo turno.

**Límites aceptados:** el correo puede llegar hasta 10 min después del inicio. Un fallo justo entre
enviar y marcar `ENVIADO` puede duplicar un correo (misma naturaleza que la escritura no
transaccional ya descrita en `CLAUDE.md` §3). Las cuotas diarias de correo y de activadores se
confirman en la cuenta real antes de producción.

## 7. Plantilla de correo (calidad institucional)

**Dónde:** `apps/gas/src/infraestructura/gas/correo/` — `plantilla.ts` (funciones puras, sin APIs
de Google, probadas con `node:test`), `colores.ts` y `enviar.ts` (el único que llama a `MailApp`).
Vista previa: `pnpm --filter @check-auditorio/gas vista-correo` escribe los HTML en `apps/gas/tmp/`
(ignorado por git) y se revisan en navegador y en Gmail real.

**Reglas de construcción** (los clientes de correo no son navegadores):

- Maquetación con `<table role="presentation">`, ancho 600 px centrado, fluido por debajo.
- **Estilos en línea** en cada elemento; un `<style>` en `<head>` solo para mejoras (móvil, modo
  oscuro) que pueden perderse sin romper nada.
- Botón «a prueba de clientes»: `<a>` con `display:inline-block`, padding y fondo en línea dentro de
  una celda con el mismo fondo; debajo, **el enlace en texto** por si el botón no se pinta.
- Tipografía de sistema con Inter primero (`Inter, Segoe UI, Arial, sans-serif`): las fuentes web no
  cargan en la mayoría de clientes.
- Escudo servido desde `${url_app}/logo-americana.png` con `alt`, ancho y alto fijos; si el cliente
  bloquea imágenes, el correo se entiende igual.
- `<meta name="color-scheme" content="light">` y colores con contraste AA también si el cliente
  invierte.
- **Todo texto del usuario escapado.** Peso total < 102 KB (Gmail recorta por encima).
- Texto de vista previa (preheader) oculto al inicio.
- Versión en texto plano en el mismo envío (`body` de `MailApp`).

**Colores:** los tokens de `apps/web/src/app/globals.css` replicados en `colores.ts` como constantes
con el mismo nombre (el correo no puede leer variables CSS). Si cambia un token, se cambia en los dos
sitios; una prueba compara ambos ficheros para que no se desalineen.

| Rol                           | Token                            | Valor                 |
| ----------------------------- | -------------------------------- | --------------------- |
| Banda de cabecera             | `navy-900`                       | `#0b1f3a`             |
| Botón principal               | `navy-800` / texto `pearl-50`    | `#12305a` / `#ffffff` |
| Filete de acento (decorativo) | `gold-500`                       | `#c9a227`             |
| Fondo exterior                | `pearl-100`                      | `#f4f6f8`             |
| Tarjeta                       | `pearl-50`                       | `#ffffff`             |
| Bordes                        | `pearl-200`                      | `#e3e7ed`             |
| Texto                         | `ink-900` / secundario `ink-600` | `#111827` / `#5b6472` |
| Aviso de novedad              | `danger-700` sobre `danger-50`   | `#a8261b` / `#fbeceb` |

**Estructura del correo «Confirma la recepción»:**

1. Preheader: «Tu evento en el Auditorio empezó. Confirma la recepción del espacio.»
2. Cabecera `navy-900` con el escudo y «Infraestructura · Corporación Universitaria Americana»,
   filete `gold-500` debajo.
3. Saludo con el nombre y una frase: qué se pide y por qué (queda constancia).
4. Ficha del evento en tabla clave–valor: evento, espacio, fecha, franja, consecutivo de la
   solicitud.
5. Botón **«Confirmar recepción»** + enlace en texto.
6. Nota: «Si algo no está en buen estado, repórtalo desde el mismo enlace con una foto.» y plazo
   (hasta el fin del evento).
7. Pie `pearl-100`: correo automático, a quién escribir, sin datos personales del destinatario más
   allá del nombre.

La constancia y la alerta de vencida reutilizan la misma carcasa (cabecera, ficha, pie) con otro
cuerpo. **El enlace de devolución va solo en el correo del solicitante**; el de destinatarios fijos
no lleva celular ni enlaces personales.

## 8. Ficheros

**shared:** `domain/estados.ts` · `domain/esquemas.ts` · `protocolo.ts`.

**gas:**

- Dominio: `dominio/entidades.ts` (campos y `Config.horasVigenciaInvitacion`) ·
  `dominio/asignacion.ts` (estados, cruce, `exigirInvitado`, `aVista`).
- Aplicación: `aplicacion/puertos.ts` (ampliar `actualizar` a `evento`, `inicio`, `fin`,
  `tokenVence`, `motivoRechazo` y los campos del solicitante) · **nuevo** `casos/solicitud.ts`
  (`crearInvitacion`, `diligenciarSolicitud`, `decidirSolicitud`, `iniciarRecepcion`) ·
  `enrutador.ts`.
- Infraestructura: `hojas/esquema.ts` · `hojas/repositorios.ts` · `hojas/semilla.ts` · **nuevos**
  `gas/activador.ts`, `gas/correo/{plantilla,colores,enviar}.ts` · `gas/main.ts` · `gas/instalar.ts` ·
  `memoria/*` (espejo para pruebas) · `appsscript.json`.

**web:**

- Panel: **nuevo** `features/panel/form-invitar.tsx` (solo correo; sustituye el formulario de
  crear evento como acción principal) · **nuevo** `tarjeta-solicitud.tsx` (datos propuestos,
  Aprobar / Rechazar con motivo) · `detalle-evento.tsx`, `operacion-eventos.tsx`,
  `centro-gestion.tsx`, `tabla-eventos.tsx`, `linea-tiempo.tsx`, `utilidades-qr.tsx` (QR y enlace
  para copiar y enviar por el canal que sea) · `features/panel/acciones.ts`.
- Solicitante: **nuevo** `features/solicitud/{form-solicitud.tsx,acciones.ts}` ·
  `app/r/[token]/page.tsx` (rama por estado: formulario, en revisión, rechazada con motivo,
  esperando la hora, confirmar recepción) · `features/recepcion/pantallas-estado.tsx` ·
  `flujo-recepcion.tsx` (precarga y atajo «Todo en buen estado»).

## 9. Pruebas

- **Núcleo** (`apps/gas/pruebas/`): camino feliz invitación → solicitud → aprobar → confirmar →
  sello → devolución; rechazo con motivo y corrección; otra cuenta con el enlace ⇒ `NO_AUTORIZADO`;
  invitación vencida ⇒ `EXPIRADA`; dos aprobaciones en la misma franja ⇒ la segunda falla; aprobar
  con `fin` pasado ⇒ falla; solicitudes pendientes no bloquean la franja; **regresión:** filas en
  `EN_VALIDACION` y `EN_DILIGENCIAMIENTO` siguen su camino viejo; REC-000001 sembrada sigue
  «Íntegra».
- **Correo** (nuevo `correo.test.ts`): escapa HTML del usuario, < 102 KB, botón y enlace en texto
  presentes, sin enlace de devolución en el de destinatarios fijos, `colores.ts` coincide con
  `globals.css`.
- **Activador** (nuevo `activador.test.ts`): reserva y retoma, 3 fallos ⇒ `FALLIDO`, dos barridos
  seguidos ⇒ un solo envío, no envía antes de `inicio`.
- **E2E** (nuevo `solicitud-por-enlace.spec.ts`): intruso rechazado; diligencia; gestor rechaza,
  corrige, aprueba; botón de confirmar solo en su ventana; atajo; `RECIBIDA`; `/verificar` Íntegra.
  `centro-gestion.spec.ts` cubre filtros y CSV con los estados nuevos. Toda prueba debe fallar si se
  quita la regla que protege (control negativo).

## 10. Fases

Cada fase cierra con su comprobación en verde antes de abrir la siguiente.

| #   | Fase                                             | Cierra con                                                                          |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 1   | Contrato (shared)                                | `pnpm --filter @check-auditorio/shared typecheck`                                   |
| 2   | Núcleo: esquema y dominio, **regresión primero** | pruebas de regresión en verde                                                       |
| 3   | Núcleo: casos nuevos                             | `pnpm --filter @check-auditorio/gas prueba`                                         |
| 4   | Web: panel y solicitante                         | `pnpm check`, `pnpm build`, `pnpm e2e`                                              |
| 5   | Plantilla de correo                              | `correo.test.ts` + revisión visual de Leonardo en navegador y Gmail                 |
| 6   | Activador en Apps Script real                    | ⚠️ aviso a Leonardo para re-autorizar; `pnpm --filter @check-auditorio/web e2e:gas` |
| 7   | Documentación                                    | `CLAUDE.md` §1, §2, §6.6 y el punto de partida de n8n marcados como sustituidos     |

Antes de la fase 6: confirmar en el Sheet real que no hay filas en `EN_VALIDACION` o
`EN_DILIGENCIAMIENTO` en tránsito.

**Revertir:** las columnas nuevas no estorban al código viejo; el código vuelve con git; el activador
se borra desde el editor de Apps Script. Lo que no se revierte gratis son las solicitudes reales que
se creen con el flujo nuevo: por eso la fase 6 se prueba con `e2e:gas` antes de anunciarlo.

## 11. Pendientes fuera del código

- Jurídica: texto de la autorización en la solicitud y plazo de conservación de solicitudes
  rechazadas o expiradas.
- Cuotas reales de `MailApp` y activadores en la cuenta `auxdiradministrativa@`.
- El flujo de n8n del commit `d0e0275` queda archivado, sin borrar, hasta que la fase 6 esté probada.
