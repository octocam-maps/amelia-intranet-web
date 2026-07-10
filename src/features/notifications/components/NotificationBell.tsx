import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { useMarkAllRead } from '../application/useMarkAllRead';
import { useMarkRead } from '../application/useMarkRead';
import { useNotifications } from '../application/useNotifications';
import { useUnreadCount } from '../application/useUnreadCount';
import type { Notification } from '../domain/models';
import styles from './NotificationBell.module.css';

const relativeTimeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

function formatRelativeTime(iso: string): string {
  const diffSeconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return relativeTimeFormatter.format(Math.round(diffSeconds), 'second');
  if (abs < 3600) return relativeTimeFormatter.format(Math.round(diffSeconds / 60), 'minute');
  if (abs < 86_400) return relativeTimeFormatter.format(Math.round(diffSeconds / 3600), 'hour');
  if (abs < 86_400 * 7) return relativeTimeFormatter.format(Math.round(diffSeconds / 86_400), 'day');
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
}

/**
 * Campana del Topbar (docs/brief-diseno.md). Dropdown propio en vez de
 * DropdownMenuItem para poder controlar el cierre manualmente: al hacer
 * click en un ítem se marca como leído y se navega, pero "Marcar todo como
 * leído" no debe cerrar el panel.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: page, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllRead();
  const items = page?.items ?? [];

  function handleItemClick(notification: Notification) {
    if (!notification.read) markRead(notification.id);
    setOpen(false);
    if (notification.url) navigate(notification.url);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className={styles.trigger} title="Notificaciones">
        <Bell className={styles.bellIcon} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>Notificaciones</span>
            <button
              type="button"
              className={styles.markAllButton}
              disabled={unreadCount === 0 || isMarkingAll}
              onClick={() => markAllRead()}
            >
              Marcar todo como leído
            </button>
          </div>

          <div className={styles.list}>
            {isLoading ? (
              <div className={styles.skeleton}>
                <span className={styles.skeletonRow} />
                <span className={styles.skeletonRow} />
                <span className={styles.skeletonRow} />
              </div>
            ) : items.length === 0 ? (
              <p className={styles.empty}>No tienes notificaciones.</p>
            ) : (
              items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={styles.item}
                  data-unread={!notification.read}
                  onClick={() => handleItemClick(notification)}
                >
                  <span className={styles.itemTop}>
                    <span className={styles.dot} data-visible={!notification.read} />
                    <span className={styles.itemTitle}>{notification.title}</span>
                    <span className={styles.itemTime}>{formatRelativeTime(notification.createdAt)}</span>
                  </span>
                  {notification.body && <span className={styles.itemBody}>{notification.body}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
