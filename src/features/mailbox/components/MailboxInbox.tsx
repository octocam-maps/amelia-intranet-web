import { useState } from 'react';
import { CheckCircle2, Send, ShieldAlert, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { useMailboxMessages } from '../application/useMailboxMessages';
import { useReplyMailboxMessage } from '../application/useReplyMailboxMessage';
import { useResolveMailboxMessage } from '../application/useResolveMailboxMessage';
import type { MailboxMessage, MailboxMessageCategory, MailboxMessageFilter } from '../domain/models';
import styles from './MailboxInbox.module.css';

const CATEGORY_LABEL: Record<MailboxMessageCategory, string> = {
  sugerencia: 'Sugerencia',
  consulta: 'Consulta',
  incidencia: 'Incidencia',
};

const FILTER_TABS: MailboxMessageFilter[] = ['unread', 'all', 'resolved'];
const FILTER_LABEL: Record<MailboxMessageFilter, string> = {
  unread: 'Sin leer',
  all: 'Todas',
  resolved: 'Resueltas',
};

function referenceShort(referenceCode: string): string {
  return referenceCode.startsWith('#') ? referenceCode : `#${referenceCode}`;
}

function formatMessageDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  if (date.toDateString() === now.toDateString()) return `Hoy · ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Ayer · ${time}`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
}

/**
 * deck-fase6/12-buzon-recepcion-admin.png — bandeja de dos columnas. La
 * pestaña "Sin leer" comparte queryKey con la lista cuando ese es el filtro
 * activo (TanStack Query dedupe la petición), así que el contador no cuesta
 * una llamada extra salvo cuando se está viendo "Todas" o "Resueltas".
 */
export function MailboxInbox() {
  const [filter, setFilter] = useState<MailboxMessageFilter>('unread');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: messages = [], isLoading } = useMailboxMessages(filter);
  const { data: unreadMessages = [] } = useMailboxMessages('unread');
  const { mutate: resolve, isPending: isResolving } = useResolveMailboxMessage();

  const selected = messages.find((m) => m.id === selectedId) ?? messages[0] ?? null;

  return (
    <div className={styles.root}>
      <div className={styles.list}>
        <div className={styles.filters}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(styles.filterPill, filter === tab && styles.filterPillActive)}
              onClick={() => {
                setFilter(tab);
                setSelectedId(null);
              }}
            >
              {FILTER_LABEL[tab]}
              {tab === 'unread' && ` · ${unreadMessages.length}`}
            </button>
          ))}
        </div>

        <div className={styles.listScroll}>
          {isLoading ? (
            <p className={styles.empty}>Cargando mensajes…</p>
          ) : messages.length === 0 ? (
            <p className={styles.empty}>No hay mensajes en esta bandeja.</p>
          ) : (
            messages.map((message) => (
              <button
                key={message.id}
                type="button"
                className={cn(styles.listItem, selected?.id === message.id && styles.listItemActive)}
                onClick={() => setSelectedId(message.id)}
              >
                <Avatar className={styles.avatar}>
                  <AvatarFallback>
                    <UserRound />
                  </AvatarFallback>
                </Avatar>
                <span className={styles.listItemBody}>
                  <span className={styles.listItemHeader}>Anónimo · {referenceShort(message.referenceCode)}</span>
                  <span className={styles.listItemExcerpt}>{message.body}</span>
                  <span className={styles.listItemMeta}>
                    {formatMessageDate(message.createdAt)} · {CATEGORY_LABEL[message.category]}
                  </span>
                </span>
                {message.status === 'unread' && <span className={styles.unreadDot} aria-hidden />}
                {message.status === 'resolved' && <CheckCircle2 className={styles.resolvedIcon} />}
              </button>
            ))
          )}
        </div>
      </div>

      <div className={styles.detail}>
        {selected ? (
          <MailboxDetail message={selected} onResolve={() => resolve(selected.id)} isResolving={isResolving} />
        ) : (
          <p className={styles.empty}>Selecciona un mensaje para verlo.</p>
        )}
      </div>
    </div>
  );
}

interface MailboxDetailProps {
  message: MailboxMessage;
  onResolve: () => void;
  isResolving: boolean;
}

function MailboxDetail({ message, onResolve, isResolving }: MailboxDetailProps) {
  const [reply, setReply] = useState('');
  const { mutate: sendReply, isPending: isReplying } = useReplyMailboxMessage();

  const handleSend = () => {
    const body = reply.trim();
    if (!body) return;
    sendReply({ messageId: message.id, input: { body } }, { onSuccess: () => setReply('') });
  };

  return (
    <>
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderInfo}>
          <Avatar className={styles.avatarLg}>
            <AvatarFallback>
              <UserRound />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className={styles.detailTitle}>Anónimo · {referenceShort(message.referenceCode)}</p>
            <p className={styles.detailSubtitle}>
              {CATEGORY_LABEL[message.category]} · recibido {formatMessageDate(message.createdAt).toLowerCase()} ·
              identidad protegida
            </p>
          </div>
        </div>
        {message.status === 'resolved' ? (
          <Badge variant="success">Resuelta</Badge>
        ) : (
          <Button variant="outline" onClick={onResolve} disabled={isResolving}>
            Marcar resuelta
          </Button>
        )}
      </div>

      <div className={styles.detailBody}>
        <p className={styles.messageBubble}>{message.body}</p>

        {message.reply && (
          <div className={styles.replyBubble}>
            <span className={styles.replyLabel}>Tu respuesta</span>
            <p>{message.reply}</p>
          </div>
        )}

        <p className={styles.protectionNotice}>
          <ShieldAlert />
          No puedes ver quién lo envió. Tu respuesta queda guardada en el mensaje: solo podrá leerla
          si consulta su código de referencia.
        </p>
      </div>

      {message.status !== 'resolved' && (
        <div className={styles.replyForm}>
          <Textarea
            className={styles.replyInput}
            rows={1}
            placeholder="Escribe una respuesta anónima…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Button
            size="icon"
            variant="dark"
            onClick={handleSend}
            disabled={isReplying || !reply.trim()}
            aria-label="Enviar respuesta"
          >
            <Send />
          </Button>
        </div>
      )}
    </>
  );
}
