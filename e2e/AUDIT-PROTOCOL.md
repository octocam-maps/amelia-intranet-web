# Protocolo de auditoría con subagentes

Este documento es el guion del **orquestador** de la capa 3: el agente que audita la intranet
conduciendo un navegador real por Playwright MCP, delegando en cuatro subagentes especializados. No
es documentación de apoyo: es la entrada del trabajo.

La arquitectura completa, con la configuración del servidor MCP y la matriz de herramientas, está en
`amelia-intranet/docs/e2e-agentes-playwright-mcp.md`.

## Qué aporta esta capa que no aportan los tests

| | Qué responde |
|---|---|
| `visual/*.visual.spec.ts` | ¿Ha CAMBIADO algo respecto a la referencia? |
| `ui/*.ui.spec.ts` | ¿Hay algo objetivamente ROTO? (medible, siempre igual) |
| **Este protocolo** | ¿Está algo mal DISEÑADO o mal COMPORTADO? (criterio, no medición) |

Un agente no es un test: no da el mismo veredicto dos veces. Por eso su resultado nunca es «la app
está bien», sino **una lista de hallazgos**. Y por eso existe la regla de cierre del final.

## Los cuatro subagentes

Cada uno tiene un dominio disjunto y una lista de herramientas restringida en su propio fichero
(`.claude/agents/e2e-*.md`). Un dominio compartido produce el mismo hallazgo cuatro veces.

| # | Subagente | Qué responde | ¿Muta estado? | Coste |
|---|---|---|---|---|
| 1 | `e2e-funcional` | ¿Se comporta como debe cuando alguien la usa? | **Sí** — es el único | Alto: interactúa |
| 2 | `e2e-consola-red` | ¿Qué dijo por debajo mientras se usaba? | No: **solo lee** | Casi nulo |
| 3 | `e2e-layout` | ¿Está bien compuesta en los tres anchos? | Abre menús, no rellena | Medio |
| 4 | `e2e-a11y` | ¿Se puede usar sin ratón y sin ver? | Abre modales | Medio |

## Antes de empezar

```bash
# 1. Backend en modo fake, con la base sembrada (ver e2e/README.md)
curl -s localhost:8000/health

# 2. Sesión del rol que se va a auditar
pnpm e2e:session administrador     # o empleado / socio / becario / externo_invitado

# 3. Frontend levantado
pnpm dev
```

El `.mcp.json` del repo apunta a `e2e/.auth/administrador.json`. Para auditar otro rol, genera su
sesión y cambia esa ruta. El servidor MCP **arranca igual si el fichero no existe**: el fallo aparece
al abrir el navegador, no antes, y se manifiesta como una pantalla de login inesperada.

La sesión vale para **un** arranque del navegador: la cookie de refresh rota al usarse. Si el
navegador se reinicia, vuelve a ejecutar `e2e:session`.

## Una sesión audita un bloque

Auditar «la intranet» entera de una vez produce un informe que nadie lee. Una sesión audita **un
bloque** con **un rol**, y termina.

| Bloque | Rutas | Rol |
|---|---|---|
| Acceso | `/login` | sin sesión |
| Inicio | `/` | empleado, administrador |
| Onboarding | `/onboarding` | empleado, externo_invitado |
| Jornada | `/control-horario`, `/ausencias` | empleado |
| Documentos | `/documentos`, `/nominas` | empleado |
| Equipo | `/equipo`, `/perfil` | empleado, socio |
| Administración | `/administracion/*` | administrador |
| Buzón | `/buzon-anonimo`, `/buzon-anonimo/seguimiento` | empleado |

El catálogo completo de pantallas, con los roles que las ven, está en `e2e/screens.ts` — es la misma
fuente que usa la capa 2, y un test de Vitest garantiza que no se desincroniza del navbar real.

## El orden de los cuatro no es negociable

**Un servidor MCP conduce un solo navegador.** Los cuatro subagentes comparten esa única pestaña, así
que van **en secuencia**, nunca en paralelo: dos a la vez se pisan la navegación. Y el orden concreto
importa:

1. **`e2e-funcional`** primero. Es el único que muta estado, y al interactuar **genera** el tráfico y
   los errores que consumirá el siguiente.
2. **`e2e-consola-red`** segundo. `browser_console_messages` y `browser_network_requests` devuelven el
   **histórico acumulado** del navegador: lee lo que provocó el funcional sin conducir nada. Por eso
   su coste es casi nulo y se ejecuta siempre.
3. **`e2e-layout`** tercero. El estado post-interacción —desplegables abiertos, errores de validación
   visibles— es más rico que la pantalla recién cargada. Redimensiona a los tres anchos.
4. **`e2e-a11y`** último, re-navegando limpio a cada ruta: su trabajo necesita el estado inicial.

Ningún subagente salvo `e2e-layout` puede llamar a `browser_resize`: cambiar el ancho a media
auditoría invalida lo que los demás midieron.

## Presupuesto de sesión

`POST /auth/login` está limitado a **10 peticiones por minuto y por IP**, y no hay variable de entorno
que lo relaje: protege producción. Cada arranque de navegador consume un login.

Con los cuatro subagentes sobre un solo navegador, **una auditoría de un bloque cuesta un login**. Es
el motivo real de que el orden sea secuencial y no un detalle de implementación: cuatro navegadores
en paralelo costarían cuatro logins simultáneos y una espera de un minuto en mitad del trabajo.

No intentes cubrir los ocho bloques por los cinco roles en una sesión. No cabe, y el informe que
saldría no lo leería nadie.

## Formato de cada hallazgo

```
[severidad] título corto
  Dónde:    ruta + ancho + componente (fichero:línea si se localiza)
  Qué veo:  lo observable, no la interpretación
  Por qué:  a quién afecta y cómo
  Pasos:    la secuencia exacta que lo reproduce
  Arreglo:  el cambio concreto propuesto
```

Severidad, con la **misma escala que la capa 2** para que el resumen agregue las dos bitácoras sin
traducir nada:

- **`critical`** — impide completar una tarea, o expone datos de otra persona.
- **`high`** — bloquea o engaña al usuario.
- **`medium`** — degrada la experiencia. El pulido también va aquí; no hay un cuarto nivel.

Los subagentes **no escriben ficheros**: devuelven texto. Los persiste el orquestador, que es el
único escritor:

```bash
pnpm e2e:registrar --file /tmp/hallazgos.json   # valida y añade a la bitácora
pnpm e2e:hallazgos                             # resumen agregado de las dos capas
```

El registrador **rechaza el lote entero** si a un hallazgo le faltan los pasos de reproducción, o si
uno de `e2e-layout` no dice a qué ancho aparece. Un hallazgo que no se puede verificar no se arregla:
se discute.

## Qué NO reportar

Cada subagente lleva su propia lista de vetos, pero estos tres se comen la mitad de un informe si no
se acotan, y aplican a los cuatro:

- **Contraste.** Ya se mide en `e2e/support/ui-audit.ts` con la fórmula del proyecto. Aparte, hay
  incumplimientos APROBADOS a sabiendas (el texto blanco sobre el verde de marca da 2,03:1 por
  decisión de producto del 2026-07-30). Reportarlos otra vez es ruido.
- **Accesibilidad estructural** (roles ARIA, `alt`, etiquetas de formulario). Ya la cubre axe-core en
  la capa 2. Lo que `e2e-a11y` audita es lo que axe no puede: teclado, foco y contexto.
- **Opiniones sin consecuencia.** «Quedaría mejor con más azul» no es un hallazgo. Un hallazgo dice
  qué se rompe para quién.

## Regla de cierre (la parte que no se salta)

Un hallazgo confirmado que se queda en un informe se vuelve a encontrar dentro de tres meses. Por
cada hallazgo aceptado:

- Si es **medible** (contraste, tamaño, overflow, solape, texto recortado) → se convierte en una
  regla de `e2e/support/ui-audit.ts`. Así lo caza la suite para siempre, en todas las pantallas, no
  solo en la que se auditó.
- Si es **de layout** → la pantalla entra en `visual/screens.visual.spec.ts` con su baseline,
  después de arreglar el defecto. Nunca antes: congelar el bug como referencia hace que la suite lo
  defienda.
- Si es **de criterio** (duplicación, copy, jerarquía) → se arregla y se añade un test dirigido, como
  el de «no usa recuadros de aviso» de `ui/onboarding.ui.spec.ts`.
- Si es **de comportamiento** (validación, flujo, estado límite, error del backend mal comunicado) →
  se convierte en un spec de Playwright usando el localizador que devolvió
  `browser_generate_locator`. Ese localizador existe precisamente para que nadie tenga que volver a
  buscar el elemento a mano.

`pnpm e2e:hallazgos` recuerda cuántos bloqueantes de agente siguen sin cerrar. Esa cifra bajando es
la única señal de que la capa 3 está funcionando.

El agente encuentra. Las otras dos capas recuerdan.
