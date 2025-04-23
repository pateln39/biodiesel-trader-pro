
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, TrendingUp, Package, Clock, PieChart, User, LogOut, Menu, X, BarChart, LineChart, DollarSign, ChevronDown, ChevronRight, Layers, Ship, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [riskSubmenuOpen, setRiskSubmenuOpen] = useState(true);
  const [operationsSubmenuOpen, setOperationsSubmenuOpen] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const lastClickTimeRef = useRef<number>(0);

  const [highlightedItemPath, setHighlightedItemPath] = useState<string | null>(null);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <PieChart className="h-5 w-5" /> },
    { path: '/trades', label: 'Trade Entry', icon: <FileText className="h-5 w-5" /> },
    { 
      label: 'Operations', 
      icon: <Package className="h-5 w-5" />,
      submenu: [
        { path: '/operations/open-trades', label: 'Open Trades', icon: <Ship className="h-4 w-4" /> },
        { path: '/operations/movements', label: 'Movements', icon: <Layers className="h-4 w-4" /> },
        { path: '/operations/storage', label: 'Storage', icon: <Warehouse className="h-4 w-4" /> },
      ],
    },
    { 
      label: 'Risk', 
      icon: <LineChart className="h-5 w-5" />,
      submenu: [
        { path: '/risk/mtm', label: 'MTM', icon: <TrendingUp className="h-4 w-4" /> },
        { path: '/risk/pnl', label: 'PNL', icon: <DollarSign className="h-4 w-4" /> },
        { path: '/risk/exposure', label: 'Exposure', icon: <BarChart className="h-4 w-4" /> },
        { path: '/risk/prices', label: 'Prices', icon: <LineChart className="h-4 w-4" /> },
        { path: '/risk/inventory-mtm', label: 'Inventory (MTM)', icon: <Package className="h-4 w-4" /> },
      ],
    },
    { path: '/audit', label: 'Audit Log', icon: <Clock className="h-5 w-5" /> },
  ];

  // Identify menu keys for keynav (basically a flat list + submenu headers as pseudo-paths)
  // We'll use special keys "submenu:Operations", "submenu:Risk" for those headers.
  const flattenedMenuKeys: string[] = [];
  menuItems.forEach((item) => {
    if (item.submenu) {
      flattenedMenuKeys.push(`submenu:${item.label}`);
      item.submenu.forEach((sub) => flattenedMenuKeys.push(sub.path));
    } else if (item.path) {
      flattenedMenuKeys.push(item.path);
    }
  });

  // Find the index of the highlighted item in the flattened list
  const getHighlightedIndex = () =>
    highlightedItemPath
      ? flattenedMenuKeys.findIndex((x) => x === highlightedItemPath)
      : -1;

  const findNextNavigableItem = (currentPath: string | null): string => {
    const idx = flattenedMenuKeys.indexOf(currentPath || '');
    return flattenedMenuKeys[(idx + 1) % flattenedMenuKeys.length];
  };

  const findPrevNavigableItem = (currentPath: string | null): string => {
    const idx = flattenedMenuKeys.indexOf(currentPath || '');
    return flattenedMenuKeys[(idx - 1 + flattenedMenuKeys.length) % flattenedMenuKeys.length];
  };

  // Open/close a submenu by label
  const toggleSubmenuByLabel = (label: string) => {
    if (label === "Risk") setRiskSubmenuOpen((prev) => !prev);
    else if (label === "Operations") setOperationsSubmenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }

      if (!sidebarOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedItemPath((current) => {
            if (!current) return flattenedMenuKeys[0];
            return findNextNavigableItem(current);
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedItemPath((current) => {
            if (!current) return flattenedMenuKeys[flattenedMenuKeys.length - 1];
            return findPrevNavigableItem(current);
          });
          break;
        case 'Enter': {
          e.preventDefault();
          if (highlightedItemPath) {
            if (highlightedItemPath.startsWith("submenu:")) {
              // It's a submenu header. Toggle submenu.
              const submenuLabel = highlightedItemPath.replace("submenu:", "");
              toggleSubmenuByLabel(submenuLabel);
              return;
            }
            // Else: navigate
            navigate(highlightedItemPath);
            setHighlightedItemPath(null);
          }
          break;
        }
        case 'Escape':
          setHighlightedItemPath(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line
  }, [sidebarOpen, highlightedItemPath, riskSubmenuOpen, operationsSubmenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-sidebar-toggle]')
      ) {
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

  // Helper: is the item currently highlighted (for either links or submenus)
  const isHighlighted = (pathOrKey: string) => highlightedItemPath === pathOrKey;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-b from-brand-navy via-brand-navy/75 to-brand-lime/25 text-primary-foreground shadow-md z-20 border-b-[1px] border-brand-lime/70">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen((prev) => !prev)}
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
        <aside 
          ref={sidebarRef}
          className={cn(
            "fixed inset-y-0 left-0 pt-16 z-10 bg-gradient-to-br from-brand-navy via-brand-navy to-[#122d42] shadow-md transition-all duration-300 ease-in-out border-r-[3px] border-brand-lime/30",
            sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"
          )}
        >
          <nav className="p-4 space-y-2 overflow-y-auto h-full bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25">
            {/* Render menu, adding highlight/keyboard nav for submenu headers */}
            {menuItems.map((item, index) => {
              if (item.submenu) {
                const submenuKey = `submenu:${item.label}`;
                const open = (item.label === 'Risk' && riskSubmenuOpen) || (item.label === 'Operations' && operationsSubmenuOpen);

                return (
                  <div key={item.label} className="space-y-1">
                    <Collapsible
                      open={open}
                      onOpenChange={() => toggleSubmenuByLabel(item.label)}
                      className="rounded-md transition-colors"
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center justify-between w-full p-3 font-medium rounded-md transition-colors focus:outline-none",
                            isHighlighted(submenuKey) &&
                              "outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]"
                          )}
                          tabIndex={0}
                          onMouseEnter={() => setHighlightedItemPath(submenuKey)}
                          onFocus={() => setHighlightedItemPath(submenuKey)}
                        >
                          <div className="flex items-center space-x-3">
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                          {open ?  <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-primary/5",
                              isHighlighted(subItem.path) && 
                                "outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]"
                            )}
                            tabIndex={0}
                            onMouseEnter={() => setHighlightedItemPath(subItem.path)}
                            onFocus={() => setHighlightedItemPath(subItem.path)}
                          >
                            {subItem.icon}
                            <span>{subItem.label}</span>
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              }
              // Regular menu item
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-md transition-colors",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-primary/5",
                    isHighlighted(item.path) && 
                      "outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]"
                  )}
                  tabIndex={0}
                  onMouseEnter={() => setHighlightedItemPath(item.path)}
                  onFocus={() => setHighlightedItemPath(item.path)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
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
