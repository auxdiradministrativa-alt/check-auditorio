# Checklist solo de infraestructura

**Decisión de Leo, 2026-09-23.** Rama `catalogo-infraestructura` (worktree `check-auditorio-catalogo`).

## Qué cambia

Quien recibe el auditorio valida **solo aspectos de infraestructura**, como en el proceso manual de
hoy. Salen del sistema los equipos electrónicos (micrófono, computador, pantallas, video beam,
consola), las cantidades y las categorías `EQUIPO`/`MOBILIARIO`/`ESPACIO`.

## Lista oficial (en este orden)

| id                  | Aspecto                                   |
| ------------------- | ----------------------------------------- |
| `as-estado-general` | Estado general del auditorio              |
| `as-pisos`          | Pisos                                     |
| `as-muros`          | Muros y pintura                           |
| `as-puertas`        | Puertas y accesos                         |
| `as-iluminacion`    | Iluminación                               |
| `as-aire`           | Sistema de aire acondicionado             |
| `as-sillas`         | Sillas y mobiliario                       |
| `as-electricas`     | Tomas e instalaciones eléctricas visibles |
| `as-aseo`           | Condiciones de aseo y organización        |
| `as-condiciones`    | Condiciones generales del espacio         |

## Decisiones

1. **Sin cantidades ni categorías.** Cada aspecto es `CONFORME` o `NOVEDAD`; la novedad exige
   observación y foto. Se borran `categoria`, `cantidad_esperada` y `cantidad_recibida` del
   contrato, del esquema de la hoja y de la UI.
2. **Un solo paso** «Estado del auditorio» con los 10 aspectos y el atajo «Todo en buen estado».
   El asistente pasa de 6 a 5 pasos.
3. **Todo lo registrado hasta hoy es prueba.** No se conserva compatibilidad con constancias
   anteriores: una función de reinicio (la ejecuta la cuenta dueña, una vez) copia el libro como
   respaldo, vacía las pestañas de registro, quita las columnas viejas y vuelve a sembrar el
   catálogo.
4. **Términos en borrador ajustados** a espacio y aspectos, sin cantidades. Siguen siendo
   borrador hasta el texto de Jurídica.
5. Los nombres internos (`CAT_Elementos`, `elementoId`, `Recepcion_Detalle`) se conservan: el
   concepto que se retira son los equipos y las cantidades, no la palabra. En la UI se dice
   «aspecto».

## Orden de salida a producción

El núcleo nuevo funciona sobre el libro viejo (le sobran columnas, no le faltan); el viejo no
funciona sobre el libro reiniciado. Por eso:

1. `pnpm --filter @check-auditorio/gas publicar` (núcleo nuevo, verificado por huella).
2. La cuenta dueña crea la propiedad del script `PERMITIR_REINICIO = SI` y ejecuta
   `reiniciarRegistroDePrueba()` desde el editor. Anota la URL del respaldo que imprime.
3. Push de la web a `main` (Vercel despliega sola), enseguida del paso 2.

Entre 1 y 3 la web vieja recibe el catálogo sin categorías: por unos minutos el checklist viejo
se ve raro. Sin uso real todavía, se acepta.
