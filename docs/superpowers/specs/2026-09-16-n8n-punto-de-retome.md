# Retome — capítulo n8n (2026-09-16, aterrizaje forzoso en rojo)

Contexto completo del capítulo: [`2026-09-15-n8n-punto-de-partida.md`](2026-09-15-n8n-punto-de-partida.md),
secciones 4.bis a 4.septies. Aquí solo lo que hace falta para seguir.

## 1. Modo cerrado y su evidencia — NO, en vuelo

Modo **diagnóstico** abierto sobre «el flujo publicado no dispara». La construcción sí está cerrada
y probada (§4.quater y §4.quinquies del punto de partida). Lo que queda vivo es la hipótesis del
disparador.

## 2. Mediciones con su entorno

- **n8n 2.29.1** (auditoría del propio servidor). Instancia compartida `n8n.americana.edu.co`,
  proyecto personal `gptautomatizacion@`. Sin team projects. La API no mueve workflows de carpeta
  (necesita 2.32).
- **La cola de 35–47 min de la skill `sigaf-n8n` NO aplica hoy**: `nj5i3-A_YpE6_nwN2xmvJ` corre cada
  5 min en <0,5 s y `wecdCaUQl5WphmX1` (Vigía Póliza, programado) corrió a las 04:00 del 2026-09-16.
- **`check-auditorio · notificaciones` (`iMWgOznAuVoTDqWB`) no ha disparado NI UNA VEZ** en ~15 h
  publicado. Única ejecución: la manual `318343` del 2026-09-15 22:38 (probó «Leer CFG_General»:
  2 filas, sin envíos). Estado medido tras los intentos: `active: true`, `versionCounter 4`,
  `activeVersionId == versionId`, `triggerCount: 1`, disparador «Cada 15 minutos» **v1.3** activo.
- **Latencia de Apps Script, 3 vueltas con script firmado, sin carga:** `entregador.autorizado`
  2,1–3,2 s · `asignacion.listar` 3,0–4,4 s · **`/panel` 5,1–7,6 s en serie**; **3,6 s en paralelo**.
- **Prueba de uso real (e2e:gas contra GAS y Sheet reales):** selló **REC-000002** con novedad y foto
  y su devolución CON_NOVEDADES; `constancia.obtener` → `integra: true`, `DEVUELTA`, 17 líneas.
  REC-000001 también `integra: true`. Falló solo el último paso: `/panel` dio 500 por timeout de
  30 s (`cliente-gas.ts:16`) en `entregador.autorizado`.

## 3. Lo que NO hay que rehacer

- El workflow está construido, validado (0 errores) y publicado, con los tres destinatarios fijos
  (`rbracho@`, `andresbermudez@`, `auxdiradministrativa@`) escritos en «Armar pendientes» y en
  «Armar alerta técnica». JSON canónico en `n8n/workflows/check-auditorio-notificaciones.json`.
- Credenciales creadas y ya conectadas por Leo: Gmail `a1JCK7RIIoLGRDzV`, Sheets `kbtl9jKqwo5cn9u5`.
- Google Cloud ya tiene redirect y APIs habilitadas (Leo, 2026-09-15).
- Ya se probó: despublicar+publicar por API (dos veces) y subir el disparador de 1.2 a **1.3**.
  **Ninguna de las dos hizo que disparara.**

## 4. Falsos positivos ya descartados

- «Es la cola de la instancia» → falso hoy, medido arriba.
- «Se publicó una versión vieja» → falso: `activeVersionId == versionId` y el código publicado
  contiene los correos fijos.
- «El disparador no está registrado por versión antigua del nodo» → probado con 1.3, sigue sin
  disparar.
- «n8n escribiendo la hoja rompe `/verificar`» → falso: `notificacion`/`notif_*` no entran en el
  hash (`repositorios.ts:72-88`, `sello.ts:30-47`), y GAS nunca reescribe esas filas
  (`tabla-gas.ts:59-70`).

## 5. Decisiones abiertas

1. **Enlace de devolución** en el correo: hoy `enlaceDevolucion` devuelve `null` (el token exige
   `BETTER_AUTH_SECRET`, que también firma las sesiones). Pendiente elegir mecanismo; ojo con los
   prefetch de Gmail/Outlook si el enlace ejecuta una acción con un clic.
2. **Recordatorio 2 h y escalamiento por vencida**: faltan columnas de estado en `Asignaciones`.
3. **Alternativa a la latencia de Apps Script**: (1) llamadas del panel en paralelo, (2) memorizar
   `entregador.autorizado` unos minutos, (3) streaming + error amable en vez de 500, (4) leer el
   libro desde Vercel con la API de Sheets en solo lectura. Recomendado 1–3 ya, 4 con la fase 2.
   **Leo aún no lo aprobó.**
4. Limpiar del libro real los datos de prueba (REC-000001, REC-000002 y sus fotos en Drive).

## 6. Ficheros vivos

- `docs/superpowers/specs/2026-09-15-n8n-punto-de-partida.md` (modificado, sin commit).
- `n8n/workflows/check-auditorio-notificaciones.json` (nuevo, sin commit; refleja la versión viva
  antes de subir el disparador a 1.3 — **reexportar**).
- `CLAUDE.md` (modificado: §2 ahora permite que n8n escriba las columnas de notificación).
- Sin commit ni push en toda la sesión.

## 7. Siguiente modo y su puerta

**Diagnóstico**, retomando la hipótesis en vuelo. Puerta de cierre: una ejecución `mode: trigger`
del workflow `iMWgOznAuVoTDqWB`, o la causa nombrada con evidencia.

Prueba a medias, lista para continuar: **se creó la sonda `check-auditorio · sonda (borrar)`
(`ewJWf3Iemh1nTfsf`)**, disparador cada minuto + NoOp, **sin publicar**: el guardián de ventana
denegó activarla. Al retomar: publicarla y mirar 3 min.

- Si dispara → el problema está dentro de nuestro workflow; sospechoso: el nodo webhook
  **desactivado** «Etapa 2 · entrada desde la app» en el mismo flujo (quitarlo y republicar).
- Si no dispara → la instancia no registra disparadores nuevos (haría falta reinicio del servicio,
  que es de Infraestructura de TI). Plan B: que la app llame al webhook al sellar, que es el cable
  ya previsto para la fase 2.
- **Borrar la sonda al terminar**: `ewJWf3Iemh1nTfsf`.

Con el disparador funcionando, lo que falta verificar es lo de siempre: 4 filas `PENDIENTE`
(REC-000001 y REC-000002 con sus devoluciones) → correos al receptor y a los tres fijos → filas en
`ENVIADO` → `constancia.obtener` sigue `integra: true`. El receptor de prueba
`laura.perez@americana.edu.co` **no existe**: ese correo rebotará, y es lo esperado.

## Hechos-ancla (control positivo)

1. `n8n/workflows/check-auditorio-notificaciones.json` existe y el flujo vivo es `iMWgOznAuVoTDqWB`.
2. El workflow tiene 33 nodos, tres de ellos «Etapa 2 · …» desactivados, y su disparador es
   «Cada 15 minutos» en `typeVersion` 1.3.
3. `CLAUDE.md` §2 ya NO dice «Nunca escribir la hoja desde Vercel ni desde n8n»: ahora permite a
   n8n escribir las columnas de notificación.
