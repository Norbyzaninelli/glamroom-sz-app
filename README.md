# The Glam Room SZ — Guía de publicación (gratis)

Esta carpeta es tu app completa (turnos + finanzas), lista para vivir en
internet de forma **gratuita e independiente de Claude**, en dos pasos:

1. **Supabase** → la base de datos (donde se guardan turnos, finanzas, etc.)
2. **Netlify** → el hosting (donde vive la página web)

No hace falta que instales nada en tu computadora. Todo se hace desde el
navegador.

---

## Parte 1 — Crear la base de datos en Supabase

1. Andá a **https://supabase.com** y creá una cuenta gratis (podés entrar
   directo con tu cuenta de Google).
2. Click en **"New project"**.
   - Nombre: `glamroom-sz` (o el que quieras)
   - Contraseña de base de datos: generá una y **guardala en un lugar seguro**
     (no la vas a necesitar para esta guía, pero es buena práctica tenerla).
   - Región: elegí la más cercana a Argentina (por ejemplo, South America
     - São Paulo, si aparece disponible).
   - Click en **"Create new project"** y esperá 1-2 minutos a que se arme.
3. Una vez adentro del proyecto, en el menú de la izquierda buscá
   **"SQL Editor"**.
4. Click en **"New query"**.
5. Abrí el archivo **`supabase_schema.sql`** que está en esta misma carpeta,
   copiá **todo** su contenido, y pegalo en el editor de Supabase.
6. Click en **"Run"** (o Ctrl+Enter). Debería decir "Success. No rows returned".
7. Andá a **"Project Settings"** (ícono de engranaje) → **"API"**.
8. Copiá estos dos valores, los vas a necesitar en la Parte 3:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (una clave larga que empieza con `eyJ...`)

Guardalos en un bloc de notas por un momento.

---

## Parte 2 — Subir el código a GitHub

1. Andá a **https://github.com** y creá una cuenta gratis (si no tenés una).
2. Click en el botón verde **"New"** (o el **+** arriba a la derecha →
   "New repository").
   - Repository name: `glamroom-sz-app`
   - Dejalo en **Public** o **Private**, cualquiera funciona.
   - **No** marques "Add a README file" (ya tenemos uno).
   - Click en **"Create repository"**.
3. En la página que aparece, buscá el link **"uploading an existing file"**.
4. Arrastrá **todos los archivos y carpetas** de esta carpeta (`glamroom-netlify`)
   a esa página. Importante: arrastrá el *contenido* de la carpeta (package.json,
   src, index.html, etc.), no la carpeta entera.
   - **No subas** la carpeta `node_modules` ni `dist` si aparecen — no deberían
     estar, pero por las dudas.
5. Abajo de todo, click en **"Commit changes"**.

Listo, tu código ya está en internet (en un repositorio privado tuyo).

---

## Parte 3 — Publicar en Netlify

1. Andá a **https://netlify.com** y creá una cuenta gratis (podés entrar con
   tu cuenta de GitHub directamente, es lo más fácil).
2. Click en **"Add new site"** → **"Import an existing project"**.
3. Elegí **"Deploy with GitHub"** y autorizá el acceso si te lo pide.
4. Seleccioná el repositorio `glamroom-sz-app` que creaste en la Parte 2.
5. Netlify va a detectar automáticamente la configuración (viene lista en
   el archivo `netlify.toml`). No hace falta que cambies nada ahí.
6. Antes de darle a "Deploy", buscá la sección **"Environment variables"**
   (o entrá después en **Site settings → Environment variables**) y agregá
   las dos que copiaste de Supabase:

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | (tu Project URL de Supabase) |
   | `VITE_SUPABASE_ANON_KEY` | (tu anon public key de Supabase) |

7. Click en **"Deploy site"**. Esperá 1-2 minutos.
8. Cuando termine, Netlify te da un link tipo `random-name-123.netlify.app`.
   **Esa es tu app, funcionando en internet, gratis.**

Podés cambiar ese nombre feo por algo más lindo en **Site settings → Domain
management → Options → Edit site name** (por ejemplo `theglamroomsz.netlify.app`).
Si más adelante comprás un dominio propio (`theglamroomsz.com`), también se
conecta desde ahí.

---

## Cómo actualizar la app en el futuro

Cuando quieras cambiar algo (agregar un servicio nuevo al código, arreglar
un detalle, etc.), la forma más simple es pedírmelo en el chat: te doy los
archivos actualizados y vos los volvés a subir a GitHub (Parte 2, mismo
repositorio, "Add file → Upload files", reemplazando lo que cambió).
Netlify detecta el cambio solo y vuelve a publicar en 1-2 minutos, sin que
tengas que tocar nada en Netlify.

---

## Importante sobre seguridad

Los PIN de administradora/empleada siguen funcionando igual que antes,
pero son una traba simple a nivel de la interfaz, no una seguridad real
de servidor — cualquiera con conocimientos técnicos y la clave pública de
Supabase (que queda visible en el código del navegador) podría en teoría
leer o escribir en la base de datos directamente, sin pasar por el PIN.
Para un local chico esto es un riesgo razonable, pero es bueno que lo
sepas. Si en el futuro esto te preocupa, se puede migrar a un sistema de
usuarios con login real (Supabase Auth) — es un proyecto más grande.

## Costo

Con el uso típico de un salón (algunas decenas de turnos por semana):
**$0 por mes.** Tanto Supabase como Netlify tienen plan gratuito que
alcanza de sobra para esto. Si en el futuro el proyecto crece mucho
(miles de usuarios simultáneos, por ejemplo), ahí sí conviene revisar
si hace falta pasar a un plan pago de alguno de los dos.
