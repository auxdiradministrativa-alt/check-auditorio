# Punto de retome — flujo por solicitud con enlace (2026-09-23)

1. **Objetivo:** construir la spec `2026-09-23-flujo-solicitud-por-enlace.md` (esta carpeta) con los 7
   hallazgos del revisor cerrados. Leo delegó todas las decisiones («autonomía completa… impecable,
   medida y probada»). Límites: **sin push**; el permiso `script.send_mail` lo autoriza la cuenta
   dueña, no el agente.
2. **Dónde:** worktree `C:\Users\Leonardo Reales\check-auditorio-flujo`, rama `flujo-solicitud`,
   rebasada sobre `main@077692e`. **No tocar** `C:\Users\Leonardo Reales\check-auditorio` (carril de
   diseño, sesión `check-auditorio-d9`; bitácora en su `docs/superpowers/bitacora-carriles.md`).
3. **Hecho y verde:** contrato shared (estados INVITADA/SOLICITADA/RECHAZADA, esquemas, 4 acciones);
   núcleo gas (`casos/solicitud.ts`, puerta vieja `qr.reclamar` cerrada, columnas nuevas en
   `Asignaciones` incl. `notif_decision|confirmacion|vencida` y `autoriza_datos_*`); pruebas
   `pruebas/solicitud.test.ts` 17/17 con 7 mutaciones que ponen rojo; plantillas
   `aplicacion/correo/{colores,plantillas}.ts` (Sage Garden). Commit `870b731` en la rama.
4. **En curso (sin commit):** `aplicacion/casos/notificaciones.ts` (outbox: reservar con bloqueo,
   enviar sin él, marcar con bloqueo corto) + `nucleo.procesarNotificaciones(correo)`.
5. **Pendiente mío:** infra GAS — `infraestructura/gas/correo-gas.ts` (MailApp), `main.ts` exporta
   `procesarOutbox`, `build.mjs` GLOBALES + `procesarOutbox`, `appsscript.json` + scope
   `script.send_mail`, `instalar.ts` (añadir columnas faltantes a hojas existentes, claves nuevas de
   CFG_General con `notificaciones_desde` = ahora, crear activador cada 10 min si falta),
   `tabla-gas.ts` estricto (escribir en columna inexistente ⇒ error, no pérdida silenciosa);
   `pruebas/notificaciones.test.ts` con correo falso; actualizar spec (§4 columnas `solicitud_*`,
   §6 bandejas separadas, correo de decisión, orden de despliegue) y `CLAUDE.md` (§1, §2, §3, §5, §6.6).
6. **Agentes en paralelo (en el mismo worktree, ficheros disjuntos):** (a) web gestor —
   `features/panel/**`, badge; (b) web solicitante — `app/r/**`, `app/mi-solicitud/**`,
   `features/solicitud/**`, `features/recepcion/**`; (c) pruebas y vista previa del correo —
   `pruebas/correo.test.ts`, `scripts/vista-correo.mjs`. Al volver: verificar sus rutas, `pnpm check`,
   build, `pnpm e2e` (e2e nuevo del flujo), revisión final con `feature-dev:code-reviewer`.
7. **Cierre:** commits por fase en la rama, sin push; informe a Leo con despliegue en orden:
   `push` de GAS → `instalar()` ejecutado por `auxdiradministrativa@` (autoriza el scope, añade
   columnas, crea activador) → nueva versión de la implementación → `probar-gas` → Vercel.

**Hechos-ancla**
- El correo no puede llevar el token del QR (lo deriva la web con `BETTER_AUTH_SECRET`): los correos
  enlazan a `/mi-solicitud/[id]`, que exige la sesión invitada y redirige.
- `contenidoRecepcion` (sello) toma el `RegistroRecepcion` entero: la bandeja de la constancia vive
  fuera de ese registro; REC-000001 sigue íntegra.
- `tabla-gas` ignora columnas que no están en el encabezado: sin la migración de `instalar()` los
  datos nuevos se perderían en silencio en el libro real.
