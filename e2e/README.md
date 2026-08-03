# E2E de auditoría visual y de UI

Detección de bugs visuales y de UI/UX sobre la aplicación real, en tres capas
que responden preguntas distintas.

| Capa | Dónde | Qué responde | ¿Vale como gate? |
|---|---|---|---|
| 1. Regresión visual | `visual/*.visual.spec.ts` | ¿Ha CAMBIADO algo? | Sí |
| 2. Invariantes de UI | `ui/*.ui.spec.ts` + `support/ui-audit.ts` | ¿Hay algo ROTO? | Sí |
| 3. Auditoría con agente | `AUDIT-PROTOCOL.md` | ¿Está mal DISEÑADO? | No |

Las tres son necesarias y ninguna sustituye a otra. La capa 1 detecta cambios
pero no sabe si el estado anterior estaba bien. La capa 2 mide, pero solo lo
que se puede medir. La capa 3 juzga, pero no da el mismo veredicto dos veces —
por eso su salida son hallazgos, y todo hallazgo confirmado termina convertido
en una regla de la capa 1 o 2.

## Arranque

```bash
# 1. Base de datos + backend
cd ../amelia-intranet-back
docker compose -f docker-compose.local.yaml --profile local up -d

# 2. Modo fake del verificador de Google (ver más abajo por qué)
#    En amelia-intranet-back/.env:
#      GOOGLE_OIDC_PROVIDER=fake
#    y reinicia:
docker compose -f docker-compose.local.yaml --profile local restart amelia-intranet-backend

# 3. Roles socio y externo (los otros dos no lo necesitan)
psql "postgresql://postgres:postgres@localhost:5436/postgres" \
     -f ../amelia-intranet-web/e2e/seed/e2e-users.sql

# 4. La suite (levanta el frontend por su cuenta si no está)
cd ../amelia-intranet-web
pnpm e2e
```

Sin el paso 2, la suite **no falla**: ejecuta los tests que no necesitan
sesión y salta los demás explicando por qué. El diagnóstico lo imprime
`global-setup.ts` al arrancar.

## Comandos

| Comando | Para qué |
|---|---|
| `pnpm e2e` | Toda la suite |
| `pnpm e2e ui/` | Solo invariantes de UI (rápido, sin baselines) |
| `pnpm e2e:ui` | Modo interactivo de Playwright |
| `pnpm e2e:update` | Reescribe los baselines visuales — **mira las imágenes antes** |
| `pnpm e2e:report` | Abre el último informe HTML |
| `pnpm e2e:hallazgos` | Resume la última auditoría agrupada **por causa** |
| `pnpm e2e:session <rol>` | Graba una sesión para el agente auditor |

`e2e:hallazgos` es el que se usa a diario: agrupa por causa en vez de por
pantalla, que es la diferencia entre leer un informe de 21 fallos y ver que en
realidad son dos arreglos. El mismo par de colores mal medido aparece en veinte
pantallas y se corrige en un sitio.

## Por qué el login va con un verificador falso

`POST /auth/login` solo acepta un `id_token` firmado por Google, y automatizar
el login real de Google desde un navegador controlado no es viable (2FA,
detección de bots, captchas). Sin resolver esto no hay E2E autenticados de
ningún rol.

La solución es un adaptador `fake` del verificador en el backend, con el mismo
patrón que ya tenían `EMAIL_PROVIDER` y `DRIVE_PROVIDER`
(`src/shared/google_oidc/fake_verifier.py`). Acepta tokens con el formato
`fake-google-id-token.<base64url(json)>` y rechaza cualquier otra cosa con el
mismo 401 que el verificador real.

**Es un bypass del control de acceso, y está contenido en dos capas:**

1. `Settings._enforce_secure_defaults` aborta el arranque si
   `GOOGLE_OIDC_PROVIDER != "google"` en `prod`/`stage`.
2. Aborta también, en cualquier entorno, si la cookie de refresh es `Secure`
   (señal de que se sirve por HTTPS). Esto cubre el caso de que alguien olvide
   exportar `ENVIRONMENT` en un despliegue.

Además, cada verificación deja un log `CRITICAL`. Si aparece en un entorno que
no sea un portátil, es un incidente.

## Por qué no se usa `storageState` en la suite

El patrón habitual de Playwright —loguearse una vez, guardar el `storageState`
y reutilizarlo— rompe contra este backend de una forma difícil de diagnosticar:
los primeros tests pasan y el resto da 401.

El refresh token rota en cada uso y hay detección de reuso estilo OWASP
(`RefreshSessionUseCase`): presentar un `jti` ya rotado se interpreta como robo
y **revoca la familia entera**. Dos contextos que parten del mismo
`storageState` hacen exactamente eso.

En su lugar (`fixtures/session.ts`): un `POST /auth/login` real por rol y por
worker, y en el navegador se intercepta solo `POST /auth/refresh`. Todo lo
demás —`/auth/me` y cada endpoint de negocio— va contra el backend real con un
Bearer real.

El agente auditor sí usa `storageState`, y es correcto: abre un único
navegador, así que la cookie rota en su propio tarro y nadie la reutiliza.

### El access token se cachea en disco, y hace falta

`/auth/login` está limitado a 10 peticiones por minuto y por IP. Playwright
arranca un proceso worker nuevo por proyecto, así que una caché solo en memoria
se pierde tres veces: medido, **30 logins y 29 respuestas 429** en una ejecución
de 5 roles × 3 anchos × 2 workers, con esperas de un minuto en mitad de la
suite.

`e2e/.auth/session-<rol>.json` guarda el access token (un JWT sin estado, no la
cookie rotatoria) y lo comparten todos los workers. Baja a 5 logins por
ejecución. Está gitignorado: son credenciales vivas.

## Umbrales y excepciones

`support/ui-audit.ts` mide contraste con la MISMA función que la app
(`src/lib/a11y/contrast.ts`), no con una copia. Contiene una lista explícita de
**excepciones aprobadas**: el texto blanco sobre el verde de marca da 2,03:1
cuando AA pide 4,5:1, y está así por decisión de producto del 2026-07-30, con
la medición delante.

Son excepciones enumeradas, no una regla desactivada: cualquier incumplimiento
nuevo sigue saltando. Es la diferencia entre documentar una decisión y taparla.

`critical` y `high` rompen el test. `medium` se imprime en consola y se anota
en el informe, pero no rompe nada: suelen exigir una decisión de diseño, y una
suite permanentemente roja no la mira nadie.

## Baselines visuales

Los `.png` de `*-snapshots/` son la referencia acordada por el equipo y por eso
se versionan. Los artefactos de cada ejecución (`test-results/`,
`playwright-report/`, `*-actual.png`, `*-diff.png`) no.

Aceptar un baseline es una decisión, no un trámite: `pnpm e2e:update` sin mirar
las imágenes convierte el bug de hoy en la referencia de mañana, y a partir de
ahí la suite defiende el bug.

Los baselines se generan en macOS y llevan el sufijo de plataforma en el
nombre. En Linux hay que regenerarlos: el renderizado de fuentes no coincide.

## Qué implica esto para producción

Los E2E no se ejecutan en producción, pero el trabajo toca dos repos y conviene
tener claro qué llega al servidor y qué no.

### El frontend servido NO cambia

`e2e/` no está en el grafo de importación de `main.tsx`, así que no entra en el
bundle. La imagen final es `nginx:alpine` con solo `dist/` copiado del stage de
build (ver `Dockerfile.prod`): nada de Playwright llega al servidor.

Dos efectos reales en el BUILD, no en el runtime:

- `Dockerfile.prod` hace `pnpm install --frozen-lockfile` (con
  devDependencies), así que el stage de build descarga ~21 MB más
  (`playwright-core` 13 MB, `playwright` 5 MB, `axe-core` 2,9 MB). Los
  navegadores (~150 MB) NO se descargan: `playwright install` es un paso manual,
  no un `postinstall`.
- `pnpm build` es `tsc -b`, y ahora `tsconfig.json` referencia también
  `tsconfig.e2e.json`. Es decir: **un error de tipos en un test E2E rompe el
  build de producción.** Es deseable —no se despliega con la suite podrida— pero
  hay que saberlo. Implica además que el Dockerfile NO puede pasar a
  `pnpm install --prod`: sin los tipos de Playwright, `tsc -b` fallaría.

### El backend sí cambia, y su default es seguro

`GOOGLE_OIDC_PROVIDER` por defecto es `google`, que es el comportamiento
actual. **No hay que tocar el `.env` de producción**: no añadir la variable deja
el verificador real exactamente como está hoy.

No hay migraciones SQL en este cambio, así que no aplica el aviso de
`deploy.yml` sobre migraciones manuales.

### Verificación después de desplegar

```bash
# 1. El login real sigue funcionando (lo más importante).
#    Entrar con una cuenta de Workspace en people.amelia.am.

# 2. El verificador falso NO está activo: un token sintético debe dar 401.
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
     https://people.amelia.am/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"id_token":"fake-google-id-token.e30"}'
# Esperado: 401. Un 200 aquí es un incidente de seguridad.

# 3. En los logs del contenedor no debe aparecer nunca:
#    "FAKE Google OIDC verifier en uso"
```

### Riesgo residual

El guard que aborta el arranque por `ENVIRONMENT` solo salta con
`prod`/`production`/`stage`/`staging`. Si el servidor no exporta `ENVIRONMENT`,
el default es `dev` y ese guard no actúa — por eso hay un segundo guard,
independiente del entorno, que aborta si la cookie de refresh es `Secure`
(producción sirve por HTTPS, así que lo es). Aun así, conviene confirmar que el
`.env` del servidor tiene `ENVIRONMENT=prod`: es la defensa de primera línea y
también gobierna Swagger y el resto de comprobaciones de
`_enforce_secure_defaults`.
