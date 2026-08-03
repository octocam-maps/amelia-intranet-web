import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import styles from './Card.module.css';

/**
 * `data-slot="card"` no es decorativo: es lo que permite comprobar en un test
 * que no hay una Card anidada dentro de otra (un doble marco con doble sombra,
 * casi siempre un error de composición). Sin él habría que apoyarse en el
 * nombre de clase generado por CSS Modules, que es inestable entre builds.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card" className={cn(styles.card, className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.header, className)} {...props} />;
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /**
   * Nivel del encabezado. El aspecto NO cambia — lo fija `styles.title` — pero
   * el nivel sí importa: un lector de pantalla navega por encabezados y un
   * salto de `h1` a `h3` le hace creer que se ha perdido una sección.
   *
   * Sigue siendo `h3` por defecto porque es lo correcto en el caso habitual:
   * una tarjeta dentro de una sección que ya tiene su `h2`. Se pasa `as="h2"`
   * cuando la tarjeta cuelga directamente del `<h1>` del Topbar, que es el
   * único `h1` de la app. Detectado por la auditoría E2E del 2026-08-03 en
   * `/control-horario`.
   */
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ as: Heading = 'h3', className, ...props }: CardTitleProps) {
  return <Heading className={cn(styles.title, className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn(styles.description, className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.content, className)} {...props} />;
}
