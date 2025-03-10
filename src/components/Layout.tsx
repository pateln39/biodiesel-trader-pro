
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, TrendingUp, Package, Clock, PieChart, User, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <PieChart className="h-5 w-5" /> },
    { path: '/trades', label: 'Trade Entry', icon: <FileText className="h-5 w-5" /> },
    { path: '/operations', label: 'Operations', icon: <Package className="h-5 w-5" /> },
    { path: '/exposure', label: 'Exposure', icon: <TrendingUp className="h-5 w-5" /> },
    { path: '/audit', label: 'Audit Log', icon: <Clock className="h-5 w-5" /> },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="text-primary-foreground hover:bg-primary/90"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="font-bold text-xl">BioDiesel CTRM</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <button className="flex items-center space-x-1">
                <User className="h-5 w-5" />
                <span>Admin</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                <div className="py-1">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <div className="flex items-center space-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 pt-16 z-10 bg-card shadow-md transition-all duration-300 ease-in-out",
            sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"
          )}
        >
          <nav className="p-4 space-y-2 overflow-y-auto h-full">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-primary/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main 
          className={cn(
            "flex-1 p-6 bg-background overflow-auto transition-all duration-300 ease-in-out",
            sidebarOpen ? "ml-64" : "ml-0"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
