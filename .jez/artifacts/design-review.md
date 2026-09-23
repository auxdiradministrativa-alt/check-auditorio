# Revisión visual de entrega de espacios

Fecha: 2026-09-23. Alcance: ingreso, centro de gestión, recepción, devolución y constancia.

## Puntos solicitados, separados

1. **Tipografía:** una sola familia, Inter variable alojada en la aplicación. Se retira Fraunces y su dependencia.
2. **Estilo profesional, serio y enterprise:** composición sobria, pesos moderados, títulos en estilo oración y color institucional reservado para marca, acciones y estados.
3. **Texto según su función:** página a 28/32 px, sección a 20 px, tarjeta a 16 px, contenido y etiquetas a 14/16 px, metadatos a 12 px. Títulos semibold, etiquetas medium y cuerpo regular; cifras tabulares y monoespaciado solo para códigos técnicos.
4. **Fondo:** gris neutro `#f4f6f8`, cards blancas y encabezados `#fafbfc`. Ingreso sin arcos ni desenfoques decorativos. Navy y oro institucionales conservados.
5. **Page header:** encabezado semántico con título, descripción de ancho acotado y separación inferior. Las acciones pueden pasar a otra fila sin comprimir el título.
6. **Grid, flexbox y gap:** distribución con separaciones explícitas; columnas del detalle con `minmax(0, 1fr)` y filas que admiten varias líneas. El QR y sus instrucciones se reacomodan según el ancho disponible.
7. **Jerarquía visual:** el título de página domina; secciones, evento seleccionado, cards y metadatos tienen funciones diferenciadas. La operación destaca mediante su acción principal sin otro bloque navy compitiendo con la cabecera institucional.
8. **Espacios:** 16 px de padding en cards móviles y 24 px desde tablet; separación entre secciones de 24/32 px, controles de 16 px y acciones de 8/12 px. Head, body y footer comparten alineación lateral.
9. **Responsive:** navegación con salto de línea, tablas en filas apiladas por debajo de 768 px y detalle en dos columnas solo cuando hay suficiente espacio. Controles pequeños con altura mínima de 44 px en móvil.
10. **Adaptabilidad:** títulos y datos largos pueden partirse; botones crecen al ocupar dos líneas; filtros, opciones y acciones se redistribuyen. La identidad que se valida se muestra completa.
11. **Cards (head, body y footer):** componentes compartidos con encabezado de contexto, cuerpo independiente y pie de acciones; bordes, fondo, padding y radios coherentes. El encabezado mantiene espacio inferior incluso cuando la card no tiene cuerpo.

## Hallazgos corregidos

- Jerarquía: títulos serif mezclados con controles sans, evento seleccionado del tamaño del título de página y etiquetas en mayúsculas espaciadas.
- Consistencia: cards sin padding inferior cuando solo tenían encabezado; encabezados del panel implementados por separado.
- Adaptabilidad: columnas rígidas en el detalle, botones de altura fija y textos de identidad truncados durante validación.
- Responsive: divisores del resumen mal distribuidos al pasar a dos filas y navegación dependiente del scroll horizontal.

## Criterios que se conservan

Marca institucional navy/oro, estados semánticos, foco visible, cifras tabulares y lectura de datos operativos sin caché persistente.

## Verificación

Pendiente de completar las comprobaciones visuales y de compilación sobre la implementación.
