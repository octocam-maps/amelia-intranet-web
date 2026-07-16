import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { MailboxTrackingLookup } from '../components/MailboxTrackingLookup';
import styles from './MailboxTrackingPage.module.css';

/**
 * `/buzon-anonimo/seguimiento` — sin material de deck propio (fuera del
 * alcance visual de la fase 6): mismo lenguaje que `AnonymousMailboxPage`
 * (tarjeta centrada, foco en un único formulario) para no introducir un
 * layout nuevo sin referencia.
 */
export function MailboxTrackingPage() {
  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <Search />
          </div>
          <p className={styles.title}>Seguimiento de tu mensaje</p>
          <p className={styles.subtitle}>
            Introduce el código de referencia que recibiste al enviarlo — es la única forma de ver
            si ya tiene respuesta.
          </p>
        </div>
        <CardContent className={styles.body}>
          <MailboxTrackingLookup />
          <Link to="/buzon-anonimo" className={styles.back}>
            <ArrowLeft />
            Volver al buzón anónimo
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
