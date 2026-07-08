import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './AppLayout.module.css';

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.content}>
        <Topbar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
