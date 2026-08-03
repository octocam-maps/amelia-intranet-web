# Protocolo de auditoría de UI/UX con agente

Este documento es el guion que sigue un agente cuando audita la intranet
conduciendo un navegador real por Playwright MCP. No es documentación de
apoyo: es la entrada del trabajo.

## Qué aporta el agente que no aportan los tests

| | Qué responde |
|---|---|
| `visual/*.visual.spec.ts` | ¿Ha CAMBIADO algo respecto a la referencia? |
| `ui/*.ui.spec.ts` | ¿Hay algo objetivamente ROTO? (medible, siempre igual) |
| **Este protocolo** | ¿Está algo mal DISEÑADO? (criterio, no medición) |

Un agente no es un test: no da el mismo veredicto dos veces. Por eso su
resultado nunca es "la app está bien", sino **una lista de hallazgos**. Y por
eso existe la regla de cierre del final de este documento.

## Antes de empezar

```bash
# 1. Backend en modo fake (ver e2e/README.md)
# 2. Sesión del rol que se va a auditar
pnpm e2e:session administrador     # o empleado / socio / externo
# 3. Frontend levantado
pnpm dev
```

El `.mcp.json` del repo apunta a `e2e/.auth/administrador.json`. Para auditar
otro rol, genera su sesión y cambia esa ruta.

La sesión vale para **un** arranque del navegador: la cookie de refresh rota al
usarse. Si el agente reinicia el navegador, vuelve a ejecutar `e2e:session`.

## Recorrido

Auditar "la intranet" entera de una vez produce un informe que nadie lee. Una
sesión audita **un bloque**, y termina.

| Bloque | Rutas | Rol |
|---|---|---|
| Acceso | `/login` | sin sesión |
| Inicio | `/` | empleado, administrador |
| Onboarding | `/onboarding` | empleado, externo |
| Jornada | `/control-horario`, `/ausencias` | empleado |
| Documentos | `/documentos`, `/nominas` | empleado |
| Equipo | `/equipo`, `/perfil` | empleado, socio |
| Administración | `/administracion/*` | administrador |
| Buzón | `/buzon-anonimo` | empleado |

En cada ruta, y en los tres anchos (1440, 834, 390):

1. Captura la pantalla **y** pide el snapshot de accesibilidad. La imagen
   delata solapes y ritmo visual; el árbol delata jerarquía y nombres
   accesibles. Ninguno de los dos basta solo.
2. Interactúa con lo que cambie de estado: abre los desplegables, despliega el
   acordeón, envía un formulario vacío para ver los errores de validación. Los
   bugs de UI viven en los estados que nadie captura.

## Qué juzgar

Ordenado por lo que más veces ha aparecido de verdad en este proyecto:

1. **Duplicación entre marco y pantalla.** El Topbar ya muestra el título de
   la sección y la fecha. Una página que los repita justo debajo está
   duplicando. Es el hallazgo más frecuente de este repo.
2. **Copy que promete lo que la UI no hace.** Un texto que anuncia una acción
   que no existe, un "próximamente" en un módulo que ya está activo, un
   subtítulo con el nombre de una sociedad escrito a mano cuando la plantilla
   son cuatro.
3. **Jerarquía visual.** Qué se lee primero. Si dos elementos compiten por ser
   el principal, ninguno lo es.
4. **Consistencia con la marca.** Verde `#00D170` como color de acción. El azul
   de `referencias/` NO es de Amelia; el único azul legítimo es `--info`
   (`#1D4FD7`) en avisos informativos.
5. **Recuadros de aviso.** Están retirados del proyecto: el aviso va como línea
   de texto en el encabezado, no como tarjeta con borde de color y fondo
   teñido.
6. **Densidad y respiración.** Elementos pegados, tarjetas de alturas
   dispares, listas sin ritmo.
7. **Estados vacíos, de carga y de error.** Casi nunca están diseñados. Una
   tabla vacía que solo dice "No hay datos" es un hallazgo.
8. **Adaptación a móvil.** Lo que en 1440 respira y en 390 se apelotona.

## Qué NO reportar

Estos tres se comen la mitad de un informe si no se acotan:

- **Contraste.** Ya se mide en `e2e/support/ui-audit.ts` con la fórmula del
  proyecto. Aparte, hay incumplimientos APROBADOS a sabiendas (el texto blanco
  sobre el verde de marca da 2,03:1 por decisión de producto del 2026-07-30).
  Reportarlos otra vez es ruido.
- **Accesibilidad estructural** (roles ARIA, `alt`, etiquetas de formulario).
  Ya la cubre axe-core en la misma capa.
- **Opiniones sin consecuencia.** "Quedaría mejor con más azul" no es un
  hallazgo. Un hallazgo dice qué se rompe para quién.

## Formato de cada hallazgo

```
[severidad] título corto
  Dónde:    ruta + ancho + componente (fichero:línea si se localiza)
  Qué veo:  lo observable, no la interpretación
  Por qué:  a quién afecta y cómo
  Arreglo:  el cambio concreto propuesto
```

Severidad: **alta** si bloquea o engaña al usuario; **media** si degrada la
experiencia; **baja** si es pulido.

## Regla de cierre (la parte que no se salta)

Un hallazgo confirmado que se queda en un informe se vuelve a encontrar dentro
de tres meses. Por cada hallazgo aceptado:

- Si es **medible** (contraste, tamaño, overflow, solape, texto recortado) →
  se convierte en una regla de `e2e/support/ui-audit.ts`. Así lo caza la suite
  para siempre, en todas las pantallas, no solo en la que se auditó.
- Si es **de layout** → la pantalla entra en `visual/vertical.visual.spec.ts`
  con su baseline, después de arreglar el defecto. Nunca antes: congelar el
  bug como referencia hace que la suite lo defienda.
- Si es **de criterio** (duplicación, copy, jerarquía) → se arregla y se añade
  un test dirigido, como el de "no usa recuadros de aviso" de
  `ui/onboarding.ui.spec.ts`.

El agente encuentra. Las otras dos capas recuerdan.
