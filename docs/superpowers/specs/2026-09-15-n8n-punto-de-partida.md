# Capítulo n8n — punto de partida (2026-09-15)

Objetivo: **cada fila nueva de `Recepciones` y `Devoluciones` se convierte en un correo HTML**, sin
que n8n escriba nunca el Sheet (CLAUDE.md §2) y sin quedar en la ruta crítica (la constancia ya
existe cuando n8n actúa). Especificación funcional: CLAUDE.md §2.6.

## 1. Estado verificado al abrir el capítulo

- **Producción arriba**: `https://check-auditorio-web.vercel.app` (cuenta de Vercel de la
  auxiliar, Hobby, región `iad1`, variables solo en Production). Prueba de uso completa en
  producción el 2026-09-15 con la sesión real de la cuenta dueña: programar → QR → validación
  (el panel se refrescó solo) → checklist con foto en Drive → **REC-000001** → constancia íntegra
  → devolución con novedad y foto → Devuelta. 123 s de punta a punta.
- **Libro real**: `https://docs.google.com/spreadsheets/d/1-ws9w9UdgGzDmjdrd4s8OMjG5wo3y9ynUpYuDUh0Pu4/edit`
  (dueña `auxdiradministrativa@`). Script: `https://script.google.com/d/1z0PL4zCH2enBixFBChnttQZUR6T72WOkLNuhgzzwNmANnBNJl6ak0zPW/edit`.
- **La bandeja de salida ya existe en la hoja**: `Recepciones` y `Devoluciones` traen
  `notificacion` (se escribe `PENDIENTE`), `notif_intentos` (`0`) y `notif_reserva_hasta` (vacío)
  — `apps/gas/src/infraestructura/hojas/repositorios.ts:67`. REC-000001 y su devolución están en
  `PENDIENTE`: son el primer caso de prueba del flujo.
- `CFG_Destinatarios` (correo, nombre, evento `recepcion|devolucion|novedad|vencida`, activo)
  existe pero está **vacía**.

## 2. Lo que falta construir (en este orden)

1. **Acciones `outbox.*` en Apps Script** (no existen; CLAUDE.md §6 lo declara):
   - `outbox.pendientes` → filas `PENDIENTE` o `FALLIDO` con `notif_intentos < 3` y reserva vencida.
   - `outbox.reclamar {consecutivo, tipo}` → bajo `LockService`: pasa a `ENVIANDO`,
     `notif_reserva_hasta = ahora + 10 min`; si ya está reservada o `ENVIADO`, responde que no.
     **Esto es lo que garantiza «webhook y barrido simultáneos → un solo correo».**
   - `outbox.confirmar` → `ENVIADO` + evento en `Bitacora`.
   - `outbox.fallo {error}` → `notif_intentos + 1`; al 3.º → `FALLIDO` + alerta.
   - Devuelven los datos ya armados para el correo (constancia, detalle, destinatarios de
     `CFG_Destinatarios`, enlace de devolución solo para el receptor). n8n no lee el Sheet.
   - Contrato en `packages/shared/src/protocolo.ts`, casos en `apps/gas/src/aplicacion/casos/`,
     pruebas `node:test` como las existentes.
2. **Aviso no bloqueante** desde Apps Script al webhook de n8n tras `recepcion.registrar` y
   `devolucion.registrar` (`UrlFetchApp` con `muteHttpExceptions`, sin esperar respuesta útil).
3. **Workflows** en `n8n/workflows/*.json` sin credenciales: WF-01 recepción, WF-03 devolución
   (declarada), WF-00 errores; WF-02 recordatorio y «vencida» después.
4. **HMAC desde n8n hacia Apps Script**: el sobre es el mismo de la web
   (`cadenaAFirmar` en `protocolo.ts`). En n8n 2.x el Code node es aislado y sin `$env`: la firma
   se hace con el nodo **Crypto** (HMAC-SHA256) o se decide otra credencial (ver decisiones).
5. Correo HTML: escapar todo texto del usuario, estilos en línea, < 102 KB, sin imágenes
   embebidas, sin celular ni documento en el correo de destinatarios fijos.

## 3. Decisiones que hay que preguntar a Leonardo ANTES de construir

1. **n8n**: ¿versión (1.x / 2.x)? ¿URL pública por HTTPS para el webhook, o solo barrido
   periódico? (Decisión abierta nº 5.) Sin webhook público, basta con el barrido cada N min.
2. **Credencial Gmail** en n8n: OAuth de `auxdiradministrativa@` con cliente **Interno** (el de
   «Prueba» vence a los 7 días). ¿Se reutiliza el proyecto `check-auditorio` de Google Cloud?
3. **Secreto de n8n → Apps Script**: ¿el mismo `GAS_HMAC_SECRET` o uno propio con acciones
   restringidas a `outbox.*`? (Recomendado: propio, para que n8n no pueda llamar
   `recepcion.registrar`.)
4. **Destinatarios fijos** por evento para llenar `CFG_Destinatarios`.
5. Plazo de devolución y recordatorio (hoy `CFG_General` = 24 h tras el fin).

## 4. Pendientes arrastrados que afectan a este capítulo

- **Latencia de Apps Script**: escrituras de 13–20 s medidas en producción (crear, sellar,
  anular). n8n no la sufre de cara al usuario, pero `outbox.reclamar` bajo `LockService` compite
  con las recepciones: medir antes de fijar la frecuencia del barrido.
- **Datos de prueba en el libro real**: asignaciones «PRUEBA …» anuladas y REC-000001 de prueba.
  Decidir si se limpian o se instala un libro nuevo antes del uso real (el consecutivo seguiría
  en 000002).
- Plan de Vercel (Hobby = uso personal no comercial; decisión nº 8).

## 4.bis Herramienta y hallazgos (2026-09-15, segunda sesión)

- **MCP de n8n configurado para este repo**: `.mcp.json` en la raíz (servidor `n8n-mcp` contra
  `https://n8n.americana.edu.co`, la misma instancia que SIGAF). **No contiene secretos**: la key
  es `${SIGAF_N8N_API_KEY}`, variable de entorno de usuario de Windows. Excluido de git solo en
  local (`.git/info/exclude`), igual que en SIGAF. Key verificada: `GET /api/v1/workflows` → 200.
- **Al abrir la sesión nueva hay que aprobar el servidor** (`claude mcp list` lo mostraba como
  `Pending approval`). Sus herramientas llegan diferidas: cargarlas con `ToolSearch` (`+n8n`).
- **La instancia es compartida con SIGAF** y, según `sigaf-n8n`, sus corridas llegan a encolarse
  **35–47 min**. Consecuencias para este capítulo: el correo no será inmediato aunque haya
  webhook; `notif_reserva_hasta = ahora + 10 min` es **demasiado corta** (la reserva vencería con
  la ejecución aún en cola y el barrido reenviaría); los reintentos de nodo (tope 5 × 5 s) no
  cubren nada y la reconciliación la hace el barrido contra la hoja.
- Pendiente de medir por MCP antes de decidir: versión real (`n8n_health_check`), si
  `/webhook/*` es alcanzable desde internet (Apps Script) y la zona horaria de la instancia.
- **Orden acordado con Leo**: primero el flujo en n8n. No se ha creado nada en la instancia.
  Los workflows necesitan las acciones `outbox.*` (aún no existen) y el secreto de n8n → Apps
  Script (decisión 3): sin ellos solo cabe el esqueleto sin publicar.

## 4.ter Medido por MCP y esqueletos creados (2026-09-15, tercera sesión)

- **Versión real: n8n 2.29.1** (auditoría del propio servidor, `n8n_audit_instance` categoría
  `instance`; 11 versiones por detrás). El `2.85.0` del `health_check` es la versión del paquete
  `n8n-mcp`, no de n8n. Consecuencia: la API **no coloca workflows en carpetas** (requiere 2.32).
- **Zona horaria de la instancia: NO medible en solo lectura** (`/rest/settings` público no la
  expone). Neutralizado: los tres workflows fijan `settings.timezone = America/Bogota`.
- **`/webhook/*` alcanzable desde internet**: DNS público (8.8.8.8) → `64.23.209.179`, TLS + nginx,
  y n8n responde a un POST externo `404 "webhook … is not registered"`. Prueba definitiva: la
  primera llamada real de `UrlFetchApp` desde Apps Script.
- **Sin team projects** (`teamProjectsEnabled: false`): «proyecto» = carpeta `check-auditorio`
  (`R07hDTQ7dA9frOhX`, raíz del proyecto personal). Los workflows quedaron en la raíz: moverlos a
  la carpeta desde la UI.
- `p6yqSrZ9eMPrBpxJ` («My workflow 50») **no es de este capítulo**: publicado, Gmail Trigger vivo
  cada minuto sobre la credencial `gpttalentohumano`, sin nodos después. No se tocó.
- **Esqueletos SIN PUBLICAR** (NoOp con nombre de paso, disparadores `disabled`, webhook
  `headerAuth` sin credencial, sin pinData, `errorWorkflow` → WF-00):
  WF-00 errores `EEsJJ9skxmXTQLtH` · WF-01 recepción `f3cPfgIphx1W0ar2`
  (`/webhook/check-auditorio-recepcion`) · WF-03 devolución `g9KO1mEMD7Ae7BMY`
  (`/webhook/check-auditorio-devolucion`).
- **Restricción que decide la opción del secreto**: en n8n 2.x el Code node no lee `$env` ni
  credenciales, y el nodo Crypto toma el secreto HMAC como **parámetro literal**. No hay forma de
  firmar el sobre HMAC sin dejar el secreto en el workflow. Lo que sí sale de una credencial es
  una clave en query (`httpQueryAuth`), que `doPost` lee en `e.parameter`.

**Respuestas de Leo (2026-09-15):**

- Gmail: **OAuth nuevo de `auxdiradministrativa@`** (cliente Interno). Lo crea Leo en la UI.
- Destinatarios fijos, **todos los eventos**: Dra. Rosa Bracho (falta su correo),
  `auxdiradministrativa@` y un tercero que dirá después.
- Plazos: devolución **24 h** tras el fin; recordatorio **2 h antes** de vencer; reserva 90 min y
  barrido cada 15 min (si se mantiene el outbox).
- Secreto n8n → Apps Script: **abierto**. Leo propone otra arquitectura: **Google Sheets Trigger
  (fila añadida) → Code arma el HTML → Gmail**, sin `outbox.*`, y pregunta por qué tres flujos.
  Pendiente de su decisión tras ver los costes (sin estado ENVIADO, enlace de devolución que exige
  `BETTER_AUTH_SECRET`, lectura de filas a medio escribir, datos repartidos en 5 hojas).

## 4.quater Decisión final y workflow construido (2026-09-15)

**Leo cambió la arquitectura del capítulo:** n8n usa solo nodos nativos, **lee y escribe el
libro directo** con la OAuth de `auxdiradministrativa@` y **no pasa por Apps Script** (no hay
`outbox.*`, ni webhook desde GAS, ni secreto n8n → GAS). **Un solo workflow**, con errores en ramas
del mismo flujo. Los esqueletos WF-00/01/03 se borraron.

Verificado en el código antes de escribir desde n8n:

- `notificacion`, `notif_intentos` y `notif_reserva_hasta` **no entran en el hash** de `/verificar`
  (`repositorios.ts:72-88` no las mapea; `sello.ts:30-47`).
- Apps Script **nunca reescribe** filas de `Recepciones`/`Devoluciones`: solo `agregar` al final
  (`tabla-gas.ts:59-70`), y `actualizar` toca celda a celda y solo en `Asignaciones`.
- El detalle se escribe **antes** que la fila principal (`repositorios.ts:199-236`): cuando n8n ve
  la fila, el detalle ya está.

**Workflow `check-auditorio · notificaciones` — `iMWgOznAuVoTDqWB`, SIN PUBLICAR.** JSON canónico:
`n8n/workflows/check-auditorio-notificaciones.json` (generado; lleva IDs de credenciales, no
secretos). Validación MCP: 0 errores. Lógica de «Armar pendientes» probada en local con datos
simulados (filtro de estados, reserva vencida, escape HTML, sin celular a fijos, < 5 KB).

- Cada 15 min: lee 8 pestañas → arma un correo por fila `PENDIENTE` (o `ENVIANDO` con reserva
  vencida) → bucle de a una: releer → reservar `ENVIANDO` con `hasta|ejecución` (90 min) → releer y
  enviar solo si la reserva escrita es la propia → Gmail receptor → Gmail fijos → `ENVIADO`.
- Fallo de Gmail → +1 intento (PENDIENTE); al 3.º `FALLIDO` + alerta. Fallo de Sheets → alerta
  técnica + Stop and Error. Escritura con `cellFormat: RAW`.
- Destinatarios desde `CFG_Destinatarios` (evento `recepcion`/`devolucion`/`novedad`; alertas:
  `alerta`/`vencida`, si no todos los activos, si no auxdiradministrativa@). `url_app` y
  `minutos_reserva_notificacion` opcionales en `CFG_General`.
- **Riesgo residual declarado:** sin bloqueo en Sheets hay una ventana de segundos para doble
  envío; y si Gmail envía al receptor y falla a los fijos, el reintento repite el del receptor.
- **Etapa 2 (conectar con la app en producción):** 3 nodos desactivados «Etapa 2 · …» (webhook de
  entrada `check-auditorio-notificar`; avisos a la app tras ENVIADO y tras fallo). Un nodo
  desactivado deja pasar los datos: el flujo funciona hoy sin ellos.

**Credenciales creadas por API** (valores leídos de `apps/web/.env.local`, nunca impresos;
`allowedHttpRequestDomains: none`): Gmail `a1JCK7RIIoLGRDzV`, Sheets `kbtl9jKqwo5cn9u5`, ambas
«check-auditorio · … (auxdiradministrativa)», con el cliente OAuth del proyecto check-auditorio.

**Hecho después (2026-09-15):** Leo configuró Google Cloud (redirect, APIs) y conectó las dos
credenciales; la ejecución manual `318343` probó solo «Leer CFG_General» (2 filas, sin envíos).
**Destinatarios fijos escritos en el flujo** (constante en «Armar pendientes» y en «Armar alerta
técnica»), para todos los eventos y alertas: `rbracho@`, `andresbermudez@`,
`auxdiradministrativa@americana.edu.co`; `CFG_Destinatarios` suma otros. Parche aplicado sobre la
versión viva (que Leo había reacomodado en la UI) sin sobrescribir posiciones; `versionCounter` 3.

**Pendiente para publicar:** 4. Mover el workflow a la carpeta `check-auditorio` desde la UI; prueba manual con REC-000001
(está en PENDIENTE) y luego Publish. 5. **Enlace de devolución**: mecanismo abierto (`enlaceDevolucion` devuelve `null`; hoy el correo
remite a la pantalla de confirmación). 6. **Recordatorio 2 h y escalamiento por vencida**: faltan columnas de estado en `Asignaciones`.

## 4.quinquies Prueba de punta a punta (2026-09-15, ~23:00)

Leo movió el workflow a la carpeta y lo **publicó**: `active: true`, `activeVersionId =
09c3d644-…` = `versionCounter 3` (el parche con los destinatarios fijos), `triggerCount: 1`.

**No hubo login humano disponible** (la cuenta dueña no estaba), así que la prueba se hizo con
`pnpm --filter @check-auditorio/web e2e:gas`: app en local con login de prueba, **contra el Apps
Script y el Sheet REALES**. No se usó la sesión de nadie.

- ✅ **App → GAS → hoja:** selló **REC-000002** (evento «Foro de Investigación …», 1 novedad con
  foto) y registró su **devolución CON_NOVEDADES** a las 17:56 Bogotá. Medido por
  `constancia.obtener` firmado: `integra: true`, `estado: DEVUELTA`, 17 líneas de detalle.
  REC-000001 sigue `integra: true`. 2 de 3 pruebas del fichero en verde.
- ❌ **Falla el último paso, y no es del flujo de n8n:** al recargar `/panel`,
  `entregador.autorizado` agotó los 30 s de `cliente-gas.ts:84` («el eco no entregó la respuesta»,
  TimeoutError) y la página dio 500, así que no se vio «Devuelta». Es la latencia de Apps Script
  bajo carga, ya conocida (13–20 s por escritura). **Riesgo real de producción:** una página del
  panel puede caerse por timeout aunque el registro esté bien.
- ⏳ **n8n no ha ejecutado ninguna pasada programada** 20+ min después de publicar (solo la manual
  `318343`, que probó «Leer CFG_General»: 2 filas, sin envíos). Coherente con la cola de 35–47 min
  de la instancia compartida. **Quedan 4 filas `PENDIENTE`** (REC-000001 y REC-000002, cada una con
  su devolución): son el caso de prueba pendiente de verificar.

**Por verificar cuando n8n corra** (nadie lo ha visto todavía): que llegue el correo al receptor
(`laura.perez@americana.edu.co` **no existe** → rebotará; es esperado) y a los tres fijos, que las
filas pasen a `ENVIADO`, y que `constancia.obtener` siga diciendo `integra: true` después de que
n8n escriba. Sin eso, **no está probado que la fase 1 funcione punta a punta**.

## 4.sexies El disparador no se registró (2026-09-16)

- **La cola de 35–47 min NO aplica hoy**: la instancia ejecuta disparadores puntualmente (workflow
  `nj5i3-A_YpE6_nwN2xmvJ` corre cada 5 min en <0,5 s; `wecdCaUQl5WphmX1` Vigía Póliza corrió a las
  04:00). **Nuestro flujo no disparó NI UNA VEZ** en ~15 h publicado (solo la manual `318343`).
- Despublicar + publicar por API no lo arregló (30 min más sin ejecución).
- **Diferencia medida**: Vigía Póliza usa `scheduleTrigger` **typeVersion 1.3**; el nuestro se creó
  con **1.2**. Subido a 1.3 y republicado (2026-09-16 ~14:0x UTC); pendiente de confirmar que dispara.
  Sospechoso secundario si sigue sin disparar: el nodo webhook **desactivado** «Etapa 2 · entrada
  desde la app» en el mismo workflow. Plan B: que la app llame al webhook (el cable de la etapa 2).

## 4.septies Latencia de Apps Script: causa medida y alternativas

Medido sin carga (3 vueltas, script firmado): `entregador.autorizado` **2,1–3,2 s** ·
`asignacion.listar` **3,0–4,4 s** · **carga de `/panel` 5,1–7,6 s** en serie; **3,6 s** si las dos
van en paralelo. Son dos viajes secuenciales a GAS por carga:
`app/panel/layout.tsx:10` (guarda) y después `app/panel/page.tsx:19` (datos). Con carga real
superó los 30 s de `cliente-gas.ts:16` → 500 en la página.

Alternativas, de menor a mayor esfuerzo: (1) las dos llamadas en paralelo (7,6 → 3,6 s medidos);
(2) memorizar `entregador.autorizado` por correo unos minutos (las Server Actions siguen
comprobando en el momento); (3) streaming + error amable en vez de 500; (4) estructural: leer el
libro desde Vercel con la API de Sheets en solo lectura, dejando GAS como único escritor (mismo
patrón que ya usa n8n). Recomendado: 1–3 ahora, 4 con la fase 2.

## 5. Hechos-ancla (control positivo del retome)

1. `apps/gas/src/infraestructura/hojas/repositorios.ts` escribe `notificacion: 'PENDIENTE'` al crear filas de recepción/devolución.
2. `packages/shared/src/protocolo.ts` **no** tiene acciones `outbox.*` (y ya no se necesitan: §4.quater).
3. `n8n/workflows/check-auditorio-notificaciones.json` existe y su workflow vivo es `iMWgOznAuVoTDqWB`, sin publicar.
