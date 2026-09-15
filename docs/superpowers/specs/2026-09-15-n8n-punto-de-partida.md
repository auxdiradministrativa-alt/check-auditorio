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

## 5. Hechos-ancla (control positivo del retome)

1. `apps/gas/src/infraestructura/hojas/repositorios.ts` escribe `notificacion: 'PENDIENTE'` al crear filas de recepción/devolución.
2. `packages/shared/src/protocolo.ts` **no** tiene acciones `outbox.*` todavía.
3. `n8n/workflows/` está vacío.
