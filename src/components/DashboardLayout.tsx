import React from 'react';
import Sidebar from './Sidebar';
import { useSidebar } from '../context/SidebarContext';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className={`dashboard-main ${isCollapsed ? 'collapsed' : ''}`}>
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="dashboard-page-title">{title}</h1>
          </div>
          
          <div className="dashboard-header-right">
            <div className="dashboard-search">
              <svg 
                width="16" height="16" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Search documents..." />
            </div>
            
            <button className="sidebar-btn-logout" title="Notifications">
              🔔
            </button>
          </div>
        </header>
        
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
