import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { type SidebarState } from '../components/Sidebar';
import './AdminLayout.css';

interface AdminLayoutProps {
  onLogout: () => void;
}

const AdminLayout = ({ onLogout }: AdminLayoutProps) => {
  const [sidebarState, setSidebarState] = useState<SidebarState>('open');

  return (
    <div className="admin-layout">
      <Sidebar
        onLogout={onLogout}
        state={sidebarState}
        onStateChange={setSidebarState}
      />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
