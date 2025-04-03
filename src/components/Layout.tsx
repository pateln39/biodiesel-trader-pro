
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, TrendingUp, Package, Clock, PieChart, User, LogOut, Menu, X, BarChart, LineChart, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [riskSubmenuOpen, setRiskSubmenuOpen] = useState(true);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isRiskSection = () => {
    return location.pathname.startsWith('/risk');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <PieChart className="h-5 w-5" /> },
    { path: '/trades', label: 'Trade Entry', icon: <FileText className="h-5 w-5" /> },
    { path: '/operations', label: 'Operations', icon: <Package className="h-5 w-5" /> },
    { 
      label: 'Risk', 
      icon: <LineChart className="h-5 w-5" />,
      submenu: [
        { path: '/risk/mtm', label: 'MTM', icon: <TrendingUp className="h-4 w-4" /> },
        { path: '/risk/pnl', label: 'PNL', icon: <DollarSign className="h-4 w-4" /> },
        { path: '/risk/exposure', label: 'Exposure', icon: <BarChart className="h-4 w-4" /> },
        { path: '/risk/prices', label: 'Prices', icon: <LineChart className="h-4 w-4" /> },
      ],
    },
    { path: '/audit', label: 'Audit Log', icon: <Clock className="h-5 w-5" /> },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleRiskSubmenu = () => setRiskSubmenuOpen(!riskSubmenuOpen);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-brand-navy via-brand-navy to-brand-lime/25 text-primary-foreground shadow-md z-20 border-b-[3px] border-brand-lime">
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

      <div className="flex flex-1">
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 pt-16 z-10 bg-gradient-to-br from-brand-navy via-brand-navy to-[#122d42] shadow-md transition-all duration-300 ease-in-out border-r-[3px] border-brand-lime/30",
            sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"
          )}
        >
          <nav className="p-4 space-y-2 overflow-y-auto h-full bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25">
            {menuItems.map((item, index) => (
              item.submenu ? (
                <div key={index} className="space-y-1">
                  <Collapsible
                    open={riskSubmenuOpen}
                    onOpenChange={toggleRiskSubmenu}
                    className="rounded-md transition-colors"
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full p-3 font-medium">
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {riskSubmenuOpen ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-8 space-y-1 animate-accordion-down">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${
                            isActive(subItem.path)
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-primary/5'
                          }`}
                        >
                          {subItem.icon}
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ) : (
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
              )
            ))}
          </nav>
        </aside>

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
