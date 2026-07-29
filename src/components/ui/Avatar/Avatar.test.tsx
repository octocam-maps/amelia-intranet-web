import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guarda a nivel de CÓDIGO FUENTE, no de render, y a propósito.
 *
 * Radix monta la `<img>` de `AvatarImage` solo cuando la carga de la imagen
 * termina, algo que en jsdom no ocurre con un `src` falso. Un test de render
 * quedaría condicionado a que la imagen exista y **pasaría en vacío** — no
 * blindaría nada. Esto sí es determinista.
 *
 * Qué protege: el nombre de la persona en el `alt` del avatar estaba en 8 call
 * sites (Topbar, directorio de equipo, cumpleaños, tabla de plantilla, cabecera
 * de perfil, progreso de onboarding, formulario de plantilla, resumen admin de
 * onboarding) y en TODOS duplicaba el nombre que ya estaba en texto justo al
 * lado: un lector de pantalla lo anunciaba dos veces seguidas. `AvatarImage`
 * pone ahora `alt=""` por defecto; este test evita que un call site nuevo vuelva
 * a pasarle el nombre.
 *
 * Si algún día un avatar es la ÚNICA identificación de la persona (sin nombre
 * al lado), su `alt` descriptivo es legítimo: añade el fichero a `EXCEPCIONES`
 * con el motivo.
 */

/** Ficheros donde un `alt` no vacío está justificado. Vacío hoy. */
const EXCEPCIONES: string[] = [];

/** `alt` con cualquier expresión de nombre: `alt={x.fullName}`, `alt={fullName}`… */
const ALT_CON_NOMBRE = /<AvatarImage[^>]*\balt=\{/s;

describe('AvatarImage — ningún call site pasa el nombre en el `alt`', () => {
  it('no hay `<AvatarImage alt={…}>` en src/', () => {
    const ficheros = globSync('src/**/*.tsx', { cwd: process.cwd() }).filter(
      (f) => !f.endsWith('.test.tsx') && !EXCEPCIONES.includes(f)
    );

    const infractores = ficheros.filter((f) => {
      const contenido = readFileSync(f, 'utf8');
      if (!contenido.includes('<AvatarImage')) return false;
      // Se comprueba cada etiqueta por separado para no cruzar dos usos
      // distintos del mismo fichero.
      return contenido
        .split('<AvatarImage')
        .slice(1)
        .some((resto) => ALT_CON_NOMBRE.test(`<AvatarImage${resto.split('>')[0]}>`));
    });

    expect(infractores).toEqual([]);
  });

  it('el componente declara el default vacío', () => {
    // Si alguien quita el `alt = ''` de la firma, los call sites vuelven a
    // quedar sin `alt` (que el navegador trata como imagen SIN texto
    // alternativo, no como decorativa) y este test lo caza.
    const fuente = readFileSync('src/components/ui/Avatar/Avatar.tsx', 'utf8');

    expect(fuente).toMatch(/alt\s*=\s*''/);
  });
});
