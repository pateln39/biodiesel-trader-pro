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

  // Stores an index of the currently highlighted menu entry, which can be either parent or subitem
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  // We'll flatten out the menu to a list of focusable items (parents and subitems), keeping extra context
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

  const [flatMenu, setFlatMenu] = useState<any[]>([]);

  // Build the flat menu (parents and children), keeping track of parent/child relations
  useEffect(() => {
    const items: any[] = [];
    menuItems.forEach((item, i) => {
      if (item.submenu) {
        items.push({ ...item, type: 'parent', parentLabel: item.label, parentIdx: items.length });
        if ((item.label === 'Risk' && riskSubmenuOpen) || (item.label === 'Operations' && operationsSubmenuOpen)) {
          item.submenu.forEach((subItem) => {
            items.push({ ...subItem, type: 'child', parentLabel: item.label, parentIdx: items.length - 1 });
          });
        }
      } else {
        items.push({ ...item, type: 'item', parentLabel: null, parentIdx: null });
      }
    });
    setFlatMenu(items);
  }, [riskSubmenuOpen, operationsSubmenuOpen]);

  // When menu changes, clamp highlightIndex if needed
  useEffect(() => {
    if (highlightIndex !== null && flatMenu.length > 0) {
      if (highlightIndex > flatMenu.length - 1) {
        setHighlightIndex(flatMenu.length - 1);
      }
    }
  }, [flatMenu, highlightIndex]);

  // Keyboard navigation changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen((s) => !s);
      }

      if (!sidebarOpen) return;

      // Only respond if focus is not inside a form/input area. 
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement?.tagName || '')) ||
        (document.activeElement && (document.activeElement as any).isContentEditable)
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((current) => {
            if (flatMenu.length === 0) return null;
            if (current === null) return 0;
            return (current + 1) % flatMenu.length;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((current) => {
            if (flatMenu.length === 0) return null;
            if (current === null) return flatMenu.length - 1;
            return (current - 1 + flatMenu.length) % flatMenu.length;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightIndex === null || !flatMenu[highlightIndex]) return;
          const item = flatMenu[highlightIndex];
          if (item.type === 'item' || item.type === 'child') {
            if (item.path) {
              navigate(item.path);
              setSidebarOpen(false); // Close sidebar after navigation
              setHighlightIndex(null);
            }
          } else if (item.type === 'parent') {
            if (item.label === 'Risk') {
              setRiskSubmenuOpen((open) => !open);
            } else if (item.label === 'Operations') {
              setOperationsSubmenuOpen((open) => !open);
            }
          }
          break;
        case 'Escape':
          setHighlightIndex(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, flatMenu, navigate, highlightIndex]);

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

  // Used for highlight
  const isHighlighted = (idx: number) => highlightIndex === idx;

  // Used for active route highlighting
  const isActive = (path: string) => location.pathname === path;

  // Used for accessibility, focus scroll
  useEffect(() => {
    if (highlightIndex === null) return;
    const elem = document.querySelector(`[data-menu-idx="${highlightIndex}"]`);
    if (elem) {
      // Scroll into view if hidden
      (elem as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [highlightIndex, flatMenu]);

  // Mapping for rendering
  let currentFlatIndex = 0;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-b from-brand-navy via-brand-navy/75 to-brand-lime/25 text-primary-foreground shadow-md z-20 border-b-[1px] border-brand-lime/70">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((s) => !s)}
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
            {menuItems.map((item, i) => {
              if (item.submenu) {
                // This parent will always be present in the flatMenu
                const parentFlatIdx = flatMenu.findIndex((fm) => fm.label === item.label && fm.type === 'parent');
                const isParentHighlighted = isHighlighted(parentFlatIdx);

                // Determine isOpen state for collapse
                const isOpen = (item.label === 'Risk' && riskSubmenuOpen) ||
                  (item.label === 'Operations' && operationsSubmenuOpen);

                return (
                  <div key={i} className="space-y-1">
                    <button
                      type="button"
                      className={cn(
                        "flex items-center justify-between w-full p-3 font-medium rounded-md transition-colors",
                        isParentHighlighted && "outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)] bg-primary/5",
                        !isParentHighlighted && "hover:bg-primary/5"
                      )}
                      data-menu-idx={parentFlatIdx}
                      tabIndex={-1}
                      onClick={() => {
                        if (item.label === 'Risk') setRiskSubmenuOpen((open) => !open);
                        else if (item.label === 'Operations') setOperationsSubmenuOpen((open) => !open);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {isOpen ?
                        <ChevronDown className="h-4 w-4" /> :
                        <ChevronRight className="h-4 w-4" />
                      }
                    </button>
                    {/* Submenu rendering if open */}
                    {isOpen && (
                      <div className="pl-8 space-y-1 animate-accordion-down">
                        {item.submenu.map((subItem) => {
                          // Find its index in flatMenu
                          const subFlatIdx = flatMenu.findIndex((fm) =>
                            fm.label === subItem.label &&
                            fm.type === 'child' &&
                            fm.parentLabel === item.label
                          );
                          const isSubHighlighted = isHighlighted(subFlatIdx);
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              data-menu-idx={subFlatIdx}
                              tabIndex={-1}
                              className={cn(
                                "flex items-center space-x-3 p-2 rounded-md transition-colors",
                                isActive(subItem.path)
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-primary/5",
                                isSubHighlighted &&
                                  "outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]"
                              )}
                              onClick={() => {
                                setSidebarOpen(false);
                                setHighlightIndex(null);
                              }}
                            >
                              {subItem.icon}
                              <span>{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Non-parent (normal) link items
                const flatIdx = flatMenu.findIndex((fm) => fm.label === item.label && !fm.type?.startsWith('parent'));
                const isItemHighlighted = isHighlighted(flatIdx);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-menu-idx={flatIdx}
                    tabIndex={-1}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-md transition-colors",
                      isActive(item.path)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-primary/5",
                      isItemHighlighted &&
                        "outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]"
                    )}
                    onClick={() => {
                      setSidebarOpen(false);
                      setHighlightIndex(null);
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              }
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
