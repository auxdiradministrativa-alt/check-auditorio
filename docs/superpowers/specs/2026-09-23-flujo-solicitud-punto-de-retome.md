# Punto de retome — flujo por solicitud con enlace (2026-09-23, refrescado)
n> Frontera: **limpia** — núcleo, correo y panel del gestor en commits; solo el agente (b) del solicitante sigue en vuelo (sus ficheros sin commit, ver punto 5).

1. **Objetivo:** construir la spec `2026-09-23-flujo-solicitud-por-enlace.md` (esta carpeta) con los
   7 hallazgos del revisor cerrados. Leo delegó todas las decisiones («autonomía completa…
   impecable, medida y probada») y otorgó +150k de ventana para terminar. Límites que NO cambian:
   **sin push**; el permiso `script.send_mail` lo autoriza la cuenta dueña, no el agente; las
   preguntas a Leo van por `AskUserQuestion` con opciones puntuales y entendibles.
2. **Dónde:** worktree `C:\Users\Leonardo Reales\check-auditorio-flujo`, rama `flujo-solicitud`
   sobre `main@077692e`. **No tocar** `C:\Users\Leonardo Reales\check-auditorio` (carril de diseño,
   sesión `check-auditorio-d9`, ya terminado y en `main`; bitácora en su
   `docs/superpowers/bitacora-carriles.md`).
3. **Cerrado y verde (commits `870b731`, `4424fab`):** contrato shared (INVITADA/SOLICITADA/RECHAZADA,
   esquemas, acciones `invitacion.crear`, `solicitud.diligenciar`, `solicitud.decidir`,
   `recepcion.iniciar`); núcleo (`casos/solicitud.ts`, `casos/notificaciones.ts`, puerta vieja
   `qr.reclamar`/`validacion.decidir` cerrada para filas con invitado); infra GAS (`correo-gas.ts`,
   `procesarOutbox`, scope `send_mail`, migración de columnas y claves en `instalar()`, activador cada
   10 min, `tabla-gas` estricto). Núcleo **30/30**, 7 mutaciones de seguridad en rojo verificadas.
4. **Sin commit, verde:** agente (c) — `pruebas/correo.test.ts` (8 pruebas, 2 mutaciones verificadas),
   `scripts/vista-correo.mjs` + script `vista-correo`, `apps/gas/tmp/` en `.gitignore`, HTML en
   `apps/gas/tmp/*.html`. Prettier aplicado a `apps/gas`, `packages`, `docs`.
5. **En curso:** agentes (a) web gestor — `features/panel/**`, `components/ui/badge.tsx`; (b) web
   solicitante — `app/r/**`, `app/mi-solicitud/**`, `features/solicitud/**`, `features/recepcion/**`.
   Al compactar (commit `c007a16`), `git status` mostraba sin commit: `badge.tsx`,
   `features/panel/{acciones,centro-gestion,exportar-registro,linea-tiempo,operacion-eventos,tabla-eventos,utilidades-qr}`,
   `features/recepcion/flujo-recepcion.tsx`, nuevos `form-emitir-enlace.tsx`, `tarjeta-solicitud.tsx`,
   `features/solicitud/`, y **`features/auth/acciones.ts` (fuera del carril asignado: revisar por qué)**.
   Sus informes llegan como mensajes de agente; si se perdieron en la compactación, `git diff` manda.
   **Agente (a) gestor TERMINADO y en commit `0a89e9c`** (check + build verdes). Decisiones:
   `form-nueva-asignacion.tsx` sin mostrarse (`?nuevo=1` abre «Emitir enlace»); CSV gana «Cuenta
   invitada» y «Motivo de corrección». **Deudas:** (1) 72 h escritas en la web
   (`HORAS_VIGENCIA_INVITACION` en detalle-evento.tsx) porque `Asignacion` no expone `tokenVence` →
   exponerlo en el contrato y usarlo; (2) e2e rotos: `e2e/centro-gestion.spec.ts:18,28,97` y
   `e2e/entrega-y-recepcion.spec.ts:100,106` buscan «Crear evento» → reescribir al flujo por enlace.
   Solo falta el agente (b) solicitante.
6. **Pendiente, en orden:** (i) al volver (a) y (b): leer sus informes, comprobar rutas citadas,
   `pnpm check` + `pnpm --filter @check-auditorio/web build`; (ii) e2e nuevo
   `apps/web/e2e/solicitud-por-enlace.spec.ts` (intruso, diligenciar, devolver, corregir, aprobar,
   confirmar en ventana, atajo, RECIBIDA, `/verificar` íntegra) y ajustar los e2e existentes si el panel
   cambió; `pnpm e2e`; (iii) revisión final `feature-dev:code-reviewer`; (iv) actualizar spec (§4
   columnas reales `solicitud_*`, `notif_decision|confirmacion|vencida_*`, `autoriza_datos_*`; §6
   correo de decisión y bandejas separadas; §10 orden de despliegue) y `CLAUDE.md` (§1 flujo, §2 sin
   n8n en notificaciones, §3 costuras nuevas, §5 columnas, §6.6); (v) commits por fase; informe a Leo.
7. **Despliegue (lo hace Leo / la cuenta dueña, en este orden):** `pnpm --filter @check-auditorio/gas
push` → `instalar()` ejecutado por `auxdiradministrativa@` (autoriza `send_mail`, añade columnas y
   claves, crea el activador) → nueva VERSIÓN de la implementación → `probar-gas` → merge a `main` y
   push (Vercel). Publicar la versión antes de autorizar el scope tumba todos los `doPost`.
   Condición de producción: texto de autorización de Jurídica.

**Hechos-ancla**

- El correo no puede llevar el token del QR (lo deriva la web con `BETTER_AUTH_SECRET`): los correos
  enlazan a `/mi-solicitud/[id]`, que exige la sesión invitada y redirige al paso que toca.
- `contenidoRecepcion` (sello) toma el `RegistroRecepcion` entero: la bandeja de la constancia vive
  fuera de ese registro; REC-000001 sigue íntegra.
- `tabla-gas` ignoraba columnas ausentes del encabezado; ahora falla con «Faltan columnas… Ejecuta
  instalar()». Hasta ejecutar `instalar()` en el libro real, TODA escritura de asignaciones falla
  (a propósito): por eso el orden del punto 7.
