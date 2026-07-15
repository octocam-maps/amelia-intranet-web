import { ChevronRight, Megaphone, Users, Zap } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import styles from './AdminQuickLinksCard.module.css';

interface QuickLink {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const LINKS: QuickLink[] = [
  { to: '/administracion/plantilla', label: 'Gestionar plantilla', icon: Users },
  { to: '/administracion/anuncios', label: 'Crear anuncio', icon: Megaphone },
];

/** "Accesos rápidos" de la columna derecha del Home admin — atajos a las
 * pantallas de administración más usadas desde aquí. */
export function AdminQuickLinksCard() {
  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Accesos rápidos</CardTitle>
        <Zap className={styles.headerIcon} />
      </CardHeader>
      <CardContent className={styles.list}>
        {LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={styles.link}>
            <Icon className={styles.linkIcon} />
            <span className={styles.linkLabel}>{label}</span>
            <ChevronRight className={styles.chevron} />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
