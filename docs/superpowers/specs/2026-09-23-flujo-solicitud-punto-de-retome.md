# Punto de retome — flujo por solicitud con enlace (2026-09-23)

> ✅ **CERRADO (2026-09-23, sesión siguiente).** Los 3 hechos-ancla se confirmaron en disco. Punto 6
> completo: deudas 1-2 (`612b966`: la vista trae `tokenVence` y `recepcionDesde`), e2e reescritos
> (`ingreso`, `centro-gestion`, `solicitud-por-enlace` + `apoyo.ts`), control negativo en núcleo y
> e2e, revisión con `feature-dev:code-reviewer` sin hallazgos de confianza alta, formulario muerto
> de «Crear evento» retirado, spec y `CLAUDE.md` al día. Puerta: `pnpm check` ✓ · núcleo 31/31 ·
> build ✓ · `pnpm e2e` 5/5. Deuda 3 (`/mi-solicitud` con filas del flujo anterior) se acepta: esas
> filas no tienen enlace personal y ven «personal». **Queda solo el punto 7 (despliegue), que hace
> la cuenta dueña.** Este documento ya no es un retome vivo.

> Frontera: **limpia** — construcción terminada por fases y en commits; falta la verificación de extremo a extremo (e2e) y la documentación.

1. **Objetivo:** construir la spec `2026-09-23-flujo-solicitud-por-enlace.md` (esta carpeta) con los
   7 hallazgos del revisor cerrados. Leo delegó todas las decisiones («autonomía completa…
   impecable, medida y probada»). Límites que NO cambian: **sin push**; el permiso
   `script.send_mail` lo autoriza la cuenta dueña, no el agente; las preguntas a Leo van por
   `AskUserQuestion` con opciones puntuales y entendibles.
2. **Dónde:** worktree `C:\Users\Leonardo Reales\check-auditorio-flujo`, rama `flujo-solicitud`
   sobre `main@077692e`. **No tocar** `C:\Users\Leonardo Reales\check-auditorio` (carril de diseño,
   sesión `check-auditorio-d9`, terminado y en `main`).
3. **Hecho y en commits** (`870b731`, `4424fab`, `c007a16`, `0a89e9c`, `305d6bc`): contrato; núcleo
   30/30 con 7 mutaciones de seguridad y 2 de correo verificadas; bandeja de correo desde Apps Script
   (4 correos, reintentos, cuota, reserva fuera del bloqueo); `instalar()` migra columnas y crea el
   activador; `tabla-gas` estricto; plantillas Sage Garden + vista previa (`pnpm --filter
@check-auditorio/gas vista-correo` → `apps/gas/tmp/index.html`); panel del gestor (emitir enlace,
   aprobar/devolver con versión, estados nuevos en tabla, línea de tiempo, CSV).
4. **Sin commit al cerrar (el agente del solicitante terminó, check + build verdes):** `app/r/[token]/page.tsx`
   (rama `enlacePersonal`), `app/mi-solicitud/{layout,[id]/page}.tsx`, `features/solicitud/{acciones,form-solicitud,boton-confirmar}`,
   `features/recepcion/{pantallas-estado,flujo-recepcion}` (precarga + «Todo en buen estado»),
   `features/auth/acciones.ts` (a propósito: `cerrarSesion` acepta `destino`). **Primer paso de la sesión
   nueva:** `git -C <worktree> status` y commitear esto como «Solicitante: formulario por enlace,
   confirmar recepción y /mi-solicitud». Borrar `/tmp/fix.cjs` si existe.
5. **Deudas conocidas (arreglar antes de cerrar):** (1) 72 h escritas en la web
   (`HORAS_VIGENCIA_INVITACION`, detalle-evento.tsx) → exponer `tokenVence` en `Asignacion`;
   (2) `MINUTOS_QR_ANTES = 30` escrito en la web → `qr.estado` debe devolver `habilitadaDesde`;
   (3) `/mi-solicitud` solo reconoce filas con invitado (las del flujo anterior ven «personal»:
   aceptable, o comparar con `receptor.correo`); (4) e2e rotos que buscan «Crear evento»:
   `e2e/centro-gestion.spec.ts:18,28,97` y `e2e/entrega-y-recepcion.spec.ts:100,106`.
6. **Pendiente, en orden:** (i) commit del punto 4; `pnpm check` + `pnpm --filter
@check-auditorio/web build`; (ii) arreglar deudas 1-2; (iii) e2e nuevo
   `apps/web/e2e/solicitud-por-enlace.spec.ts` (intruso «personal», diligenciar, devolver con motivo,
   corregir, aprobar, confirmar solo en ventana, atajo, RECIBIDA, `/verificar` íntegra) y reescribir
   los e2e rotos al flujo por enlace; `pnpm e2e` (puerto 3100; el carril de diseño ya terminó);
   (iv) revisión final con `feature-dev:code-reviewer` y comprobar sus hallazgos; (v) actualizar spec
   (§4 columnas reales `solicitud_*`, `notif_decision|confirmacion|vencida_*`, `autoriza_datos_*`; §6
   correo de decisión y bandejas separadas; §10 orden de despliegue) y `CLAUDE.md` (§1 flujo, §2 sin
   n8n en notificaciones, §3 costuras nuevas, §5 columnas, §6.6); (vi) informe a Leo con micro-lección
   y una pregunta de comprobación (skill `leo-ingeniero`), y completar el «Resultado» en
   `~/.claude/skills/leo-ingeniero/datos/decisiones.md`.
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
- `tabla-gas` falla con «Faltan columnas… Ejecuta instalar()» si falta una columna: hasta ejecutar
  `instalar()` en el libro real, toda escritura de asignaciones falla a propósito (orden del punto 7).
