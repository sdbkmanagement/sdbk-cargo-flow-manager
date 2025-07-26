
import React, { useState } from 'react';
import { ModernSidebar } from './ModernSidebar';
import { ModernHeader } from './ModernHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  title
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Sidebar moderne */}
      <ModernSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />

      {/* Main content area avec nouveau design */}
      <div 
        className={cn(
          "transition-all duration-300 ease-out min-h-screen",
          // Desktop: adjust margin based on sidebar state
          "lg:ml-64",
          sidebarCollapsed && "lg:ml-16",
          // Mobile: no margin (sidebar is overlay)
          "ml-0"
        )}
      >
        {/* Header moderne */}
        <ModernHeader
          title={title}
          onMenuClick={toggleSidebar}
          showMenuButton={true}
        />

        {/* Page content avec nouveau style */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-full">
            {/* Conteneur moderne avec effet glassmorphism */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 lg:p-8 animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
