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

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn(styles.title, className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn(styles.description, className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.content, className)} {...props} />;
}
