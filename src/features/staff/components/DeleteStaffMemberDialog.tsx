import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ApiError } from '@/lib/http/api-client';
import { useDeleteStaffMember } from '../application/useDeleteStaffMember';
import type { StaffMember } from '../domain/models';
import styles from './DeleteStaffMemberDialog.module.css';

interface DeleteStaffMemberDialogProps {
  /** `null` cierra el diálogo. */
  member: StaffMember | null;
  onClose: () => void;
}

/**
 * Confirmación de la baja definitiva.
 *
 * Pide ESCRIBIR el nombre completo, no un «¿Seguro?». La acción borra datos
 * personales de forma irreversible y está en el mismo menú que «Desactivar
 * acceso», que es reversible y se usa a diario: teclear el nombre es lo que
 * obliga a mirar a quién se está señalando antes de confirmar.
 *
 * El diálogo enumera además qué se borra y qué se conserva. Sin eso, la
 * palabra «eliminar» hace pensar que también desaparecen los fichajes y las
 * ausencias, y nadie se atreve a usarlo — o peor, alguien lo usa creyendo que
 * limpia el historial.
 */
export function DeleteStaffMemberDialog({ member, onClose }: DeleteStaffMemberDialogProps) {
  const [typedName, setTypedName] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useDeleteStaffMember();

  useEffect(() => {
    setTypedName('');
    setServerError(null);
  }, [member]);

  if (!member) return null;

  // Comparación indulgente con los espacios y las mayúsculas: el objetivo es
  // que la persona LEA el nombre y lo reconozca, no que reproduzca un
  // capicúa exacto.
  const confirmed = typedName.trim().toLocaleLowerCase() === member.fullName.trim().toLocaleLowerCase();

  async function handleDelete() {
    if (!confirmed || !member) return;
    setServerError(null);
    try {
      await mutateAsync(member.id);
      onClose();
    } catch (error) {
      // El backend explica la regla concreta ("es el único administrador
      // activo", "no puedes darte de baja a ti mismo"); un texto genérico
      // dejaría al admin sin saber qué hacer a continuación.
      setServerError(
        error instanceof ApiError ? error.message : 'No se ha podido dar de baja a esta persona.',
      );
    }
  }

  return (
    <Dialog open={member !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar de baja definitiva a {member.fullName}</DialogTitle>
        </DialogHeader>

        <div className={styles.body}>
          <p className={styles.lead}>Esta acción no se puede deshacer.</p>

          <div className={styles.columns}>
            <div>
              <h3 className={styles.columnTitle}>Se borra</h3>
              <ul className={styles.list}>
                <li>DNI/NIE, IBAN y número de la Seguridad Social</li>
                <li>Dirección, ciudad y teléfonos</li>
                <li>Fecha de nacimiento y contacto de emergencia</li>
                <li>Su acceso: no podrá volver a entrar</li>
              </ul>
            </div>
            <div>
              <h3 className={styles.columnTitle}>Se conserva</h3>
              <ul className={styles.list}>
                <li>Su nombre en los informes ya emitidos</li>
                <li>Fichajes y registro de jornada</li>
                <li>Ausencias y vacaciones</li>
                <li>Documentos firmados</li>
              </ul>
            </div>
          </div>

          <p className={styles.note}>
            El registro de jornada debe conservarse cuatro años, por eso no se elimina. Su email
            queda libre por si vuelve a incorporarse.
          </p>

          <div className={styles.field}>
            <Label htmlFor="confirmName">
              Escribe <strong>{member.fullName}</strong> para confirmar
            </Label>
            <Input
              id="confirmName"
              value={typedName}
              autoComplete="off"
              placeholder={member.fullName}
              onChange={(event) => setTypedName(event.target.value)}
            />
          </div>

          {serverError && <p className={styles.error}>{serverError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={!confirmed || isPending}>
            {isPending ? 'Dando de baja…' : 'Dar de baja definitiva'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
