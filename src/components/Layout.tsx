
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, TrendingUp, Package, Clock, PieChart, User, LogOut, Menu, X, BarChart, LineChart, DollarSign, ChevronDown, ChevronRight, Layers, Ship, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSidebarNavigation } from '@/hooks/useSidebarNavigation';
import { useGlobalKeyboardShortcuts } from '@/hooks/useGlobalKeyboardShortcuts';

const EETLogo = () => {
  return (
    <div className="flex items-center">
      <span className="text-brand-blue font-bold text-2xl">E</span>
      <span className="text-brand-blue font-bold text-2xl">E</span>
      <span className="text-brand-lime font-bold text-2xl">T</span>
    </div>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [riskSubmenuOpen, setRiskSubmenuOpen] = useState(true);
  const [operationsSubmenuOpen, setOperationsSubmenuOpen] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const lastClickTimeRef = useRef<number>(0);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isRiskSection = () => {
    return location.pathname.startsWith('/risk');
  };

  const isOperationsSection = () => {
    return location.pathname.startsWith('/operations');
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleRiskSubmenu = () => setRiskSubmenuOpen(!riskSubmenuOpen);
  const toggleOperationsSubmenu = () => setOperationsSubmenuOpen(!operationsSubmenuOpen);

  // Initialize keyboard navigation hooks
  const {
    focusedItemIndex,
    sidebarFocused,
    setSidebarFocused,
    flatMenuItems,
  } = useSidebarNavigation({
    sidebarOpen,
    riskSubmenuOpen,
    operationsSubmenuOpen,
    toggleRiskSubmenu,
    toggleOperationsSubmenu,
  });

  useGlobalKeyboardShortcuts({
    toggleSidebar,
    setSidebarFocused,
    sidebarOpen,
  });

  // Helper function to check if an item should be focused
  const isItemFocused = (itemId: string) => {
    const itemIndex = flatMenuItems.findIndex(item => item.id === itemId);
    return sidebarFocused && itemIndex === focusedItemIndex;
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <PieChart className="h-5 w-5" />, id: 'dashboard' },
    { path: '/trades', label: 'Trade Entry', icon: <FileText className="h-5 w-5" />, id: 'trades' },
    { 
      label: 'Operations', 
      icon: <Package className="h-5 w-5" />,
      id: 'operations-toggle',
      submenu: [
        { path: '/operations/open-trades', label: 'Open Trades', icon: <Ship className="h-4 w-4" />, id: 'open-trades' },
        { path: '/operations/movements', label: 'Movements', icon: <Layers className="h-4 w-4" />, id: 'movements' },
        { path: '/operations/storage', label: 'Storage', icon: <Warehouse className="h-4 w-4" />, id: 'storage' },
        { path: '/operations/demurrage', label: 'Demurrage', icon: <Clock className="h-4 w-4" />, id: 'demurrage' },
      ],
    },
    { 
      label: 'Risk', 
      icon: <LineChart className="h-5 w-5" />,
      id: 'risk-toggle',
      submenu: [
        { path: '/risk/mtm', label: 'MTM', icon: <TrendingUp className="h-4 w-4" />, id: 'mtm' },
        { path: '/risk/pnl', label: 'PNL', icon: <DollarSign className="h-4 w-4" />, id: 'pnl' },
        { path: '/risk/exposure', label: 'Exposure', icon: <BarChart className="h-4 w-4" />, id: 'exposure' },
        { path: '/risk/prices', label: 'Prices', icon: <LineChart className="h-4 w-4" />, id: 'prices' },
        { path: '/risk/inventory-mtm', label: 'Inventory (MTM)', icon: <Package className="h-4 w-4" />, id: 'inventory-mtm' },
      ],
    },
    { path: '/audit', label: 'Audit Log', icon: <Clock className="h-5 w-5" />, id: 'audit' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node) &&
          !(event.target as Element).closest('[data-sidebar-toggle]')) {
        
        const clickTime = new Date().getTime();
        const timeSinceLastClick = clickTime - lastClickTimeRef.current;
        
        if (timeSinceLastClick < 300 && timeSinceLastClick > 0) {
          setSidebarOpen(false);
        }
        
        lastClickTimeRef.current = clickTime;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-b from-brand-navy via-brand-navy/75 to-brand-lime/25 text-primary-foreground shadow-md z-20 border-b-[1px] border-brand-lime/70">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              data-sidebar-toggle="true"
              className="text-primary-foreground hover:bg-primary/90"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <EETLogo />
              <span className="font-bold text-xl">BioDiesel CTRM</span>
            </div>
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
        {/* Sidebar */}
        <aside 
          ref={sidebarRef}
          className={cn(
            "fixed inset-y-0 left-0 pt-16 z-10 bg-gradient-to-br from-brand-navy via-brand-navy to-[#122d42] shadow-md transition-all duration-300 ease-in-out border-r-[3px] border-brand-lime/30",
            sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"
          )}
          tabIndex={0}
          onFocus={() => setSidebarFocused(true)}
          onBlur={(e) => {
            // Only blur if focusing outside the sidebar
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setSidebarFocused(false);
            }
          }}
        >
          <nav className="p-4 space-y-2 overflow-y-auto h-full bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25">
            {menuItems.map((item, index) => (
              item.submenu ? (
                <div key={index} className="space-y-1">
                  <Collapsible
                    open={
                      (item.label === 'Risk' && riskSubmenuOpen) || 
                      (item.label === 'Operations' && operationsSubmenuOpen)
                    }
                    onOpenChange={
                      item.label === 'Risk' 
                        ? toggleRiskSubmenu 
                        : toggleOperationsSubmenu
                    }
                    className="rounded-md transition-colors"
                  >
                    <CollapsibleTrigger asChild>
                      <button 
                        className={cn(
                          "flex items-center justify-between w-full p-3 font-medium rounded-md transition-colors",
                          isItemFocused(item.id) && "bg-primary/20 ring-2 ring-primary/50"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {(item.label === 'Risk' && riskSubmenuOpen) || 
                         (item.label === 'Operations' && operationsSubmenuOpen) ? 
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
                          className={cn(
                            "flex items-center space-x-3 p-2 rounded-md transition-colors",
                            isActive(subItem.path)
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-primary/5',
                            isItemFocused(subItem.id) && "bg-primary/20 ring-2 ring-primary/50"
                          )}
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
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-md transition-colors",
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-primary/5',
                    isItemFocused(item.id) && "bg-primary/20 ring-2 ring-primary/50"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            ))}
          </nav>
        </aside>

        {/* Main Content */}
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
