import { useMemo, useState } from 'react';
import { DownloadIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { WalletIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useDocuments } from '../application/useDocuments';
import { useDownloadDocument } from '../application/useDownloadDocument';
import type { Document } from '../domain/models';
import styles from './PayslipsPage.module.css';

function periodLabel(period: string): string {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  const label = new Date(year, month - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatUploadedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** No hay `year` en `ListDocumentsParams` (el backend no filtra por año) —
 * se deriva del `period` ('YYYY-MM') de cada nómina; si por lo que sea
 * llegara sin `period`, se cae al año de `uploadedAt` para no perder la fila
 * de los filtros de año. */
function yearOf(document: Document): number {
  return document.period ? Number(document.period.slice(0, 4)) : new Date(document.uploadedAt).getFullYear();
}

/**
 * deck-fase4 pág. 47 "Nóminas" (+ pág. 48 estado vacío). El deck muestra un
 * visor PDF de dos columnas con paginación/zoom — no hay endpoint de
 * previsualización, solo descarga (`GET /documents/{id}/download` vía
 * `useDownloadDocument`, dispara el "Guardar como" del navegador), así que
 * esta página resuelve con un botón "Descargar" por fila en vez del visor.
 * Tampoco hay campo de estado ("Pagada") en `Document` — todo lo que llega
 * de `GET /documents?category=payslip` ya está sincronizado desde Drive, así
 * que no hace falta distinguir pagada/pendiente.
 */
export function PayslipsPage() {
  const { data: payslips = [], isLoading, error } = useDocuments({ category: 'payslip' });
  const { mutate: download, isPending: isDownloading } = useDownloadDocument();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const years = useMemo(
    () => Array.from(new Set(payslips.map(yearOf))).sort((a, b) => b - a),
    [payslips]
  );
  const activeYear = selectedYear ?? years[0] ?? new Date().getFullYear();

  const visiblePayslips = useMemo(
    () =>
      payslips
        .filter((payslip) => yearOf(payslip) === activeYear)
        .sort((a, b) => (b.period ?? '').localeCompare(a.period ?? '')),
    [payslips, activeYear]
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Nóminas</h1>
          <p className={styles.subtitle}>Tus nóminas, sincronizadas desde Drive</p>
        </div>
        {years.length > 0 && (
          <Select value={String(activeYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger aria-label="Año de nóminas a mostrar" className={styles.yearPill}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <ExclamationTriangleIcon className={styles.errorBannerIcon} />
          No se pudieron cargar las nóminas: {error instanceof Error ? error.message : 'error desconocido'}.
        </div>
      )}

      <Card className={styles.card}>
        {isLoading ? (
          <p className={styles.empty}>Cargando nóminas…</p>
        ) : payslips.length === 0 ? (
          <div className={styles.emptyState}>
            <WalletIcon className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Aún no tienes nóminas disponibles</p>
            <p className={styles.emptyDescription}>
              RRHH todavía no ha sincronizado ninguna nómina desde Drive. Te avisaremos en cuanto esté lista.
            </p>
          </div>
        ) : (
          <ul className={styles.list}>
            {visiblePayslips.map((payslip) => (
              <li key={payslip.id} className={styles.row}>
                <div className={styles.info}>
                  <p className={styles.period}>{payslip.period ? periodLabel(payslip.period) : payslip.title}</p>
                  <p className={styles.uploadedAt}>Emitida el {formatUploadedAt(payslip.uploadedAt)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDownloading}
                  onClick={() => download({ id: payslip.id, title: payslip.title })}
                >
                  <DownloadIcon />
                  Descargar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
