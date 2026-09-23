# Bitácora de carriles — check-auditorio

Dos o más sesiones de Claude Code trabajando a la vez. Cada una anota aquí qué toca y qué no.
Solo se añaden entradas al final.

## 2026-09-23 10:15 · check-auditorio-35 · carril FLUJO (solicitud por enlace)

- **Dónde trabaja:** worktree aparte `C:\Users\Leonardo Reales\check-auditorio-flujo`, rama
  `flujo-solicitud`, creada desde `a308ff3`. **No toca este árbol** (`main`), no hace commit en `main`,
  no cambia de rama aquí, no hace push.
- **Qué construye:** `docs/superpowers/specs/2026-09-23-flujo-solicitud-por-enlace.md` —
  `packages/shared`, `apps/gas` (núcleo, activador de correo y plantilla) y en `apps/web` las pantallas del
  flujo (`app/r/[token]`, `features/solicitud/*` nuevo, `features/panel/{form-invitar,tarjeta-solicitud}`
  nuevos, y cambios en `detalle-evento`, `operacion-eventos`, `pantallas-estado`, `flujo-recepcion`).
- **Carril del otro (medido 10:10):** pase de diseño sobre `apps/web` en `main` (53 ficheros sin commit
  - commit `a308ff3`). Los ficheros de `apps/web` citados arriba se tocarán en ambos lados: el
    conflicto se resuelve al fusionar `flujo-solicitud`, **después** de que el carril de diseño haga
    commit. El carril de diseño no necesita hacer nada distinto.

## 2026-09-23 · sesión principal · carril DISEÑO (main, sin commit)

- **Dónde trabaja:** este árbol, rama `main`. Solo `apps/web` y la memoria del proyecto; **no toca
  `packages/shared` ni `apps/gas`**. Sin commit ni push hasta que Leo lo pida.
- **Qué hace:** (1) pase de `ui-ux-pro-max` sobre el centro de gestión (región viva de validación,
  hora de datos, filtros activos, tablas ordenables con `aria-sort`, navegación fija con sección activa,
  enlace para saltar al contenido); (2) **paleta Sage Garden como oficial** (decisión de Leo).
- **Lo que rompe al fusionar `flujo-solicitud`:** desaparecen los tokens `navy-*`, `pearl-*`,
  `gold-*`, `ink-*`, `ok-*`, `danger-*` y `bg-white`; entran tokens por rol (`foreground`,
  `muted-foreground`, `card`, `background`, `border`, `border-strong`, `primary-strong`,
  `primary-soft`, `success*`, `attention*`, `destructive*`). El tamaño `text-card` pasa a
  `text-card-title`; `Badge`/`Segmented` tono `navy` → `primario`; `Marca` pierde `claro`.
  Tabla de equivalencias enviada a check-auditorio-35 por mensaje.
