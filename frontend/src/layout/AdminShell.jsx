import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { NotificationProvider } from '../context/NotificationContext';
import '../pages/admin/admin.css';


export default function AdminShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <NotificationProvider>
      <div className="admin-shell">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className={`admin-content ${collapsed ? 'collapsed' : ''}`}>
          <Topbar onMenuToggle={() => setMobileOpen(o => !o)} />
          <main style={{ flex: 1, overflow: 'auto' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
