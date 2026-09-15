# Puesta en marcha con Google Workspace

Guía para conectar Check Auditorio a Google con la cuenta dueña del sistema,
**`auxdiradministrativa@americana.edu.co`**. Al terminar, `pnpm dev` guarda en el Sheet real y el
ingreso es con Google; después solo falta Vercel.

> Todo lo que se crea aquí (Sheet, script, carpeta de fotos, proyecto de Google Cloud, cliente
> OAuth) debe quedar **a nombre de la cuenta dueña**, nunca de una cuenta personal. Usa un perfil de
> Chrome aparte donde solo esté abierta esa cuenta: evita que un paso quede con la sesión equivocada.

Tiempo estimado: 30–45 min. Orden: **secretos → Apps Script → OAuth → prueba local**.

---

## 0. Antes de empezar

- [ ] Repo instalado: `corepack enable && pnpm install` y `pnpm check` en verde.
- [ ] Perfil de Chrome con `auxdiradministrativa@americana.edu.co` como única sesión.
- [ ] Ningún `pnpm dev` corriendo (el paso 4 lo levanta en el puerto **3001**).

## 1. Secretos

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm secretos
```

`pnpm secretos` imprime dos valores aleatorios. Pégalos en `apps/web/.env.local`:

| Variable             | Dónde más va                                                                |
| -------------------- | --------------------------------------------------------------------------- |
| `GAS_HMAC_SECRET`    | Propiedades del script (paso 2.5) y Vercel. **El mismo valor en los tres.** |
| `BETTER_AUTH_SECRET` | Vercel. **No se rota**: deriva los QR y enlaces de devolución emitidos.     |

`apps/web/.env.local` no se versiona (`.gitignore`). Guarda los dos secretos también en el gestor
de contraseñas de Infraestructura: si se pierden, hay que regenerar y volver a configurar todo.

## 2. Apps Script (registro)

### 2.1 Habilitar la API de Apps Script

Con la cuenta dueña, abre <https://script.google.com/home/usersettings> y activa **Google Apps
Script API**. Sin esto, `clasp` responde «User has not enabled the Apps Script API».

### 2.2 Iniciar sesión en clasp

```bash
pnpm --filter @check-auditorio/gas login
pnpm --filter @check-auditorio/gas exec clasp show-authorized-user
```

Se abre el navegador: **elige la cuenta dueña**. La credencial queda en `~/.clasprc.json` de tu
usuario de Windows, fuera del repo. El segundo comando debe mostrar la cuenta dueña.

### 2.3 Crear el script (una sola vez)

```bash
pnpm --filter @check-auditorio/gas crear
```

Compila y crea un proyecto **independiente** «Check Auditorio» (no vinculado al Sheet: un script
vinculado lo ve cualquiera que vea el libro). Deja `apps/gas/.clasp.json` con el `scriptId`; no
se versiona. Si ya existía un script, copia `.clasp.json.example` a `.clasp.json` y pega su id.

### 2.4 Subir el código

```bash
pnpm --filter @check-auditorio/gas push
```

Sube `dist/codigo.js` (≈42 KB) y `appsscript.json`. Repite este comando cada vez que cambie
`apps/gas/src`.

### 2.5 Propiedad del script

```bash
pnpm --filter @check-auditorio/gas exec clasp open-script
```

En el editor: **Configuración del proyecto (⚙) → Propiedades del script → Agregar** →
`GAS_HMAC_SECRET` = el valor del paso 1. `SHEET_ID` **no** se agrega a mano: lo crea `instalar()`.

### 2.6 Instalar el libro

En el editor, elige la función **`instalar`** en la barra superior y pulsa **Ejecutar**. La primera
vez Google pide autorizar (Hojas de cálculo, Drive): acepta con la cuenta dueña. Si aparece «Google
no verificó esta app», es tu propio script: _Configuración avanzada → Ir a Check Auditorio_.

El registro de ejecución termina con `Listo. Libro: https://docs.google.com/…`. Abre el enlace y
comprueba:

- [ ] Existen las 12 pestañas (`CAT_*`, `CFG_*`, `Asignaciones`, `Recepciones`, …, `Bitacora`).
- [ ] `CAT_Elementos` tiene los 17 elementos del Auditorio Principal.
- [ ] `CFG_Entregadores` tiene `auxdiradministrativa@americana.edu.co`.
- [ ] `CFG_General` → `carpeta_fotos_id` tiene un id (se creó «Check Auditorio — Fotos» en Drive).
- [ ] Las pestañas protegidas muestran el candado.

`instalar()` es idempotente: volver a ejecutarla no borra ni duplica datos.

### 2.7 Implementar la web app

En el editor: **Implementar → Nueva implementación → ⚙ Tipo: Aplicación web**

- Descripción: `v1`
- Ejecutar como: **Yo (auxdiradministrativa@…)**
- Quién tiene acceso: **Cualquier usuario** (la puerta es la firma HMAC, no Google)

Copia la **URL de la aplicación web** (termina en `/exec`) en `GAS_WEBAPP_URL` de `.env.local`.

> **Actualizar sin cambiar la URL:** tras un `push`, _Implementar → Gestionar implementaciones →
> ✏ → Versión: Nueva versión → Implementar_. Una «Nueva implementación» genera **otra** URL y
> obliga a cambiar `GAS_WEBAPP_URL` en todas partes.

### 2.8 Probar la conexión

```bash
pnpm --filter @check-auditorio/web probar-gas
```

Esperado:

```
1/2 GET ok: la web app responde
2/2 POST ok: firma aceptada · 1 espacio(s), 17 elementos
```

## 3. Cliente OAuth (ingreso con Google)

Con la cuenta dueña, en <https://console.cloud.google.com>:

1. **Crear proyecto** `check-auditorio` (organización `americana.edu.co`).
2. **Google Auth Platform → Comenzar** (pantalla de consentimiento):
   - Nombre: `Check Auditorio` · correo de asistencia: la cuenta dueña.
   - Público: **Interno** (solo cuentas del dominio; no requiere verificación de Google y el
     token no vence a los 7 días como en «Prueba»).
3. **Clientes → Crear cliente → Aplicación web**, nombre `check-auditorio-web`.
   - URI de redireccionamiento autorizados:
     - `http://localhost:3001/api/auth/callback/google`
     - (en la fase de Vercel se agrega `https://<dominio>/api/auth/callback/google`)
4. Copia **ID de cliente** → `GOOGLE_CLIENT_ID` y **Secreto** → `GOOGLE_CLIENT_SECRET` en
   `.env.local`. El secreto solo se muestra completo al crearlo: guárdalo en el gestor.

Permisos solicitados: `openid`, `email`, `profile` (los de Better Auth por defecto). No se piden
permisos de Gmail ni Drive a quien inicia sesión.

## 4. Prueba local con Google real

`apps/web/.env.local` debe tener las 6 variables llenas, con
`NEXT_PUBLIC_APP_URL=http://localhost:3001`.

```bash
pnpm dev     # http://localhost:3001 — la franja «Modo local» ya no debe aparecer
```

- [ ] Ingresar con la cuenta dueña → llega a `/panel`.
- [ ] Ingresar con una cuenta Gmail personal → rechazada.
- [ ] Ingresar con otra cuenta `@americana.edu.co` no autorizada → «no está autorizada para el panel».
- [ ] Flujo completo (en otra ventana privada, con una segunda cuenta institucional como receptor):
      programar → abrir el enlace del QR → solicitar → confirmar en el panel → diligenciar con una
      novedad y foto → constancia → `/verificar` **íntegra** → declarar devolución.
- [ ] En el Sheet aparecen, en orden, las filas de `Asignaciones`, `Recepciones`,
      `Recepcion_Detalle`, `Devoluciones` y `Bitacora`; la foto está en la carpeta de Drive.
- [ ] Con la cuenta dueña (la protección no la bloquea a ella), editar a mano una celda de
      `Recepcion_Detalle` → `/verificar` muestra **Alterada**. Después, devolver el valor original
      → vuelve a **íntegra**.

## 5. Problemas frecuentes

| Síntoma                                             | Causa probable                                                                                                   | Remedio                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `redirect_uri_mismatch` al ingresar                 | La URI del cliente OAuth no coincide carácter a carácter con `NEXT_PUBLIC_APP_URL` + `/api/auth/callback/google` | Revisa puerto (3001), `http` vs `https` y que no sobre una `/` al final                                                |
| `probar-gas`: «Respuesta no JSON» con HTML de login | La implementación no tiene acceso «Cualquier usuario», o el administrador de Workspace bloquea apps web anónimas | Ajusta el acceso en _Gestionar implementaciones_; si no aparece la opción, pedir a TI que lo habilite para esta cuenta |
| `FIRMA_INVALIDA`                                    | `GAS_HMAC_SECRET` distinto en `.env.local` y en Propiedades del script, o reloj del PC desfasado >5 min          | Copiar de nuevo el mismo valor; sincronizar la hora de Windows                                                         |
| «Falta la propiedad del script SHEET_ID»            | No se ejecutó `instalar()`                                                                                       | Paso 2.6                                                                                                               |
| «User has not enabled the Apps Script API»          | Paso 2.1 pendiente                                                                                               | Activarla y esperar 1–2 min                                                                                            |
| Cambios del script no se ven en la web              | Se hizo `push` pero no nueva versión de la implementación                                                        | Paso 2.7, «Actualizar sin cambiar la URL»                                                                              |
| QR o enlaces de devolución antiguos dejan de abrir  | Cambió `BETTER_AUTH_SECRET`                                                                                      | Restaurar el valor anterior; no rotarlo                                                                                |

## 6. Lo que queda para Vercel (fase 3)

- Las mismas 6 variables en el proyecto de Vercel (Root Directory `apps/web`), con
  `NEXT_PUBLIC_APP_URL=https://<dominio>`.
- Agregar `https://<dominio>/api/auth/callback/google` al cliente OAuth.
- Confirmar el plan de Vercel (Hobby es uso personal no comercial).
