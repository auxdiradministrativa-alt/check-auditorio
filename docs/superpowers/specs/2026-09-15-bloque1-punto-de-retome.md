# Punto de retome — Bloque 1 (mecanismo sin credenciales) · 2026-09-15

> Frontera: **aterrizaje forzoso** (ventana en rojo). Código del Bloque 1 escrito y en verde; falta la prueba punta a punta en navegador y actualizar CLAUDE.md.

Contexto: Leo exige HOY (a) lo diligenciado guardado en el Sheet en orden, (b) QR funcional que abre el formulario, (c) deploy en Vercel. Pidió Clean Architecture y modularización sin monolitos ni redundancias. **No hacer push sin su permiso.** Bloque 2 = Google Workspace: la cuenta dueña es `auxdiradministrativa@americana.edu.co` y las keys las configura Leo; avisarle, no crearlas.

## §1 Modo cerrado y su evidencia

Construcción del Bloque 1 (código): cerrada con `pnpm check` → exit 0, `pnpm build` → exit 0 y `pnpm --filter @check-auditorio/gas prueba` → 7/7. **No cerrada:** la prueba manual del flujo en navegador.

## §2 Mediciones con su entorno

- Windows 11, Node 24.16, pnpm 10.34.5, sin variables de entorno (modo local: registro en memoria y login simulado).
- `apps/gas`: `dist/codigo.js` pesa 42 KB y no contiene zod (grep 0).
- Build de la web: `/r/[token]` y `/r/[token]/confirmada` son dinámicas (ƒ).

## §3 Lo que NO hay que rehacer

- `apps/gas` en capas, cerrado y probado:
  - `src/dominio` (reglas puras)
  - `src/aplicacion` (`puertos`, `enrutador`, `sobre`, un caso de uso por módulo en `casos/`)
  - `src/infraestructura` (`hojas`: esquema, semilla y repositorios; `gas`: tabla, servicios, instalar, main; `memoria`)
  - `src/nucleo.ts` (raíz de composición)
- `packages/shared`: `protocolo.ts`, `domain/fechas.ts`, entrada `./sin-zod`.
- Web `src/servidor/`: `entorno` (con `exigirEntornoCompleto`), `registro/{index,cliente-gas,cliente-memoria}`, `auth/{better-auth,sesion,sesion-local,permisos}`, `tokens`, `qr`, `accion`.
- Features con `acciones.ts`: `auth`, `panel`, `fotos`, `recepcion`, `devolucion`.
- Páginas conectadas: `/`, `/panel/*`, `/r/[token]`, `/r/[token]/confirmada`, `/devolucion/[id]?t=`, `/verificar/[consecutivo]`.
- Eliminados `lib/datos` y `lib/mock`.

## §4 Falsos positivos ya descartados

- El error de build «Faltan variables de entorno de producción» NO es un fallo de configuración: venía del prerender estático. Se resolvió con `connection()` en `registro()` y `obtenerSesion()`, y con `exigirEntornoCompleto` separado de `entorno()`.
- Los avisos `size-[28rem]` y `min-w-[44rem]` de Tailwind vienen de la Fase 1 y no rompen nada.

## §5 Decisiones abiertas (avisar a Leo)

- QR vigente desde inicio−30 min hasta el **fin** del evento (la spec decía «hasta inicio»).
- MVP sin correo: el enlace de devolución se muestra en la constancia confirmada.
- Esbuild en lugar de Rollup para `apps/gas`.
- Columnas añadidas: `receptor_nombre` en Asignaciones y `categoria` en Recepcion_Detalle. Hay que llevarlas a CLAUDE.md §5.
- Riesgos:
  - Better Auth sin base de datos solo se verifica con credenciales reales.
  - El runtime V8 de Apps Script no está probado.
  - Si Apps Script falla a mitad de `recepcion.registrar`, la escritura queda parcial.

## §6 Ficheros vivos

`apps/web/src/servidor/entorno.ts`, `apps/web/src/servidor/auth/better-auth.ts`, `apps/gas/src/infraestructura/gas/{main,instalar,tabla-gas}.ts`, `CLAUDE.md`.

## §7 Siguiente modo y su puerta

1. **Verificación local:**
   - `pnpm dev` (puerto 3001) e ingreso local como `auxdiradministrativa@americana.edu.co`.
   - Programar una asignación que empiece ya y abrir el enlace del QR en otra ventana privada con otra cuenta.
   - Solicitar → confirmar en el panel → diligenciar (con una novedad y foto) → constancia → `/verificar` íntegra → devolución.
   - Puerta: el flujo completo sin errores.
2. **CLAUDE.md:** §3 arquitectura nueva, §5 columnas, §9 comandos de gas (`build`, `prueba`, `push`).
3. **Bloque 2**, lista para Leo:
   - Sheet vía `instalar()` con la cuenta dueña.
   - `clasp login` + `.clasp.json` desde `.clasp.json.example`, `pnpm --filter @check-auditorio/gas push`, desplegar la web app (ejecutar como yo, acceso cualquiera) → `GAS_WEBAPP_URL`.
   - Propiedad `GAS_HMAC_SECRET` (≥32 caracteres).
   - Cliente OAuth web con consentimiento Interno y retornos `https://<dominio>/api/auth/callback/google` y `http://localhost:3001/api/auth/callback/google`.
   - `BETTER_AUTH_SECRET` (≥32).
4. **Bloque 3:** Vercel (Root `apps/web`, las 6 variables) y prueba real; push solo con permiso.

## Hechos-ancla

- `pnpm check` y `pnpm build` terminan con exit 0 en el árbol del commit que sigue a `86e8e01`.
- `pnpm --filter @check-auditorio/gas prueba` pasa 7/7 (flujo, idempotencia, «Alterada», cantidades, QR, cruce, HMAC).
- Sin `GAS_WEBAPP_URL` la web usa `servidor/registro/cliente-memoria.ts` (el mismo núcleo en memoria); en producción sin variables, `exigirEntornoCompleto` lanza.
