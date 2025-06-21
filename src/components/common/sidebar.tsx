"use client";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  User,
  Shield,
  TrendingUp,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { cn } from "@/utils/regex";
import { useEffect, useState } from "react";
import { useAuth } from "../../app/context/AuthContext";

interface NavSubItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: string[];
  badge?: string;
}

interface NavItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  allowedRoles: string[];
  isDropdown?: boolean;
  subItems?: NavSubItem[];
  badge?: string;
}

interface SidebarHeaderProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
  className?: string;
}

interface SidebarFooterProps {
  isExpanded: boolean;
  user: any;
}

interface NavigationItemProps {
  item: NavItem;
  isExpanded: boolean;
  isActive: (path: string) => boolean;
  isSectionActive: (item: NavItem) => boolean;
  openSections: string[];
  touchedDropdowns: Set<string>;
  handleDropdownTouch: (event: React.MouseEvent, title: string) => void;
  toggleSection: (sectionTitle: string) => void;
  renderTooltip: (title: string, element: React.ReactNode) => React.ReactNode;
}

// Sidebar Header Component
const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isExpanded, toggleSidebar, className }) => (
  <div className={cn("flex items-center justify-between p-4 border-b border-gray-100", className)}>
    {isExpanded && (
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-[#1F6CB6] to-[#1A5A9E] rounded-xl h-10 w-10 flex items-center justify-center shadow-md">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">MetaUpSpace</h1>
          <p className="text-xs text-gray-500">AMS</p>
        </div>
      </div>
    )}
    
    <Button 
      onClick={toggleSidebar} 
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-gray-100"
      aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </Button>
  </div>
);

// Sidebar Footer Component
const SidebarFooter: React.FC<SidebarFooterProps> = ({ isExpanded, user }) => (
  <div className="p-4 border-t border-gray-100">
    {isExpanded ? (
      <div className="bg-gradient-to-r from-[#F7FCFE] to-white rounded-xl p-4 border border-[#1F6CB6]/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Online</span>
          </div>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        {user && (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">{user.employeeId}</p>
            <Badge variant="secondary" className="text-xs bg-[#1F6CB6]/10 text-[#1F6CB6] border-[#1F6CB6]/20">
              {user.role}
            </Badge>
          </div>
        )}
      </div>
    ) : (
      <div className="flex justify-center">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>
    )}
  </div>
);

// Navigation Item Component
const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  isExpanded,
  isActive,
  isSectionActive,
  openSections,
  touchedDropdowns,
  handleDropdownTouch,
  toggleSection,
  renderTooltip
}) => {
  if (!item.isDropdown) {
    // Regular menu item
    return renderTooltip(
      item.title,
      <Link
        href={item.path || "#"}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200 group",
          isExpanded ? "justify-start" : "justify-center",
          isActive(item.path || "") 
            ? "bg-[#1F6CB6] text-white shadow-md" 
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <div className={cn(
          "flex-shrink-0 transition-colors duration-200",
          isActive(item.path || "") ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
        )}>
          {item.icon}
        </div>
        {isExpanded && (
          <div className="flex items-center justify-between w-full">
            <span>{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                {item.badge}
              </Badge>
            )}
          </div>
        )}
      </Link>
    ) as React.ReactElement;
  }

  // Dropdown menu
  return (
    <Collapsible 
      open={openSections.includes(item.title)}
      onOpenChange={() => toggleSection(item.title)}
    >
      {renderTooltip(
        item.title,
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            onClick={(e) => !isExpanded && handleDropdownTouch(e, item.title)}
            className={cn(
              "w-full justify-start gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200 group h-auto",
              isExpanded ? "justify-between" : "justify-center",
              isSectionActive(item) || touchedDropdowns.has(item.title)
                ? "bg-[#1F6CB6] text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <div className={cn(
              "flex items-center gap-3",
              !isExpanded && "justify-center"
            )}>
              <div className={cn(
                "flex-shrink-0 transition-colors duration-200",
                isSectionActive(item) || touchedDropdowns.has(item.title) 
                  ? 'text-white' 
                  : 'text-gray-500 group-hover:text-gray-700'
              )}>
                {item.icon}
              </div>
              {isExpanded && <span>{item.title}</span>}
            </div>
            {isExpanded && (
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                openSections.includes(item.title) ? 'rotate-180' : '',
                isSectionActive(item) || touchedDropdowns.has(item.title) 
                  ? 'text-white' 
                  : 'text-gray-400 group-hover:text-gray-600'
              )} />
            )}
          </Button>
        </CollapsibleTrigger>
      )}
      
      {!isExpanded && openSections.includes(item.title) && (
        <CollapsibleContent className="absolute left-20 mt-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-64 p-2">
          <div className="space-y-1">
            {item.subItems?.map((subItem) => (
              <Link
                key={subItem.path}
                href={subItem.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group",
                  isActive(subItem.path)
                    ? "bg-[#1F6CB6] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 transition-colors duration-200",
                  isActive(subItem.path) ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                )}>
                  {subItem.icon}
                </div>
                <div className="flex items-center justify-between w-full">
                  <span>{subItem.title}</span>
                  {subItem.badge && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                      {subItem.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CollapsibleContent>
      )}
      
      {isExpanded && (
        <CollapsibleContent className="mt-1 ml-6 space-y-1">
          {item.subItems?.map((subItem) => (
            <Link
              key={subItem.path}
              href={subItem.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group relative",
                isActive(subItem.path)
                  ? "bg-[#1F6CB6]/10 text-[#1F6CB6] border-l-2 border-[#1F6CB6]" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className={cn(
                "flex-shrink-0 transition-colors duration-200",
                isActive(subItem.path) ? 'text-[#1F6CB6]' : 'text-gray-400 group-hover:text-gray-600'
              )}>
                {subItem.icon}
              </div>
              <div className="flex items-center justify-between w-full">
                <span>{subItem.title}</span>
                {subItem.badge && (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                    {subItem.badge}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};

// Mobile Sidebar Component
const MobileSidebar = ({ navigation, isActive, isSectionActive, user }: {
  navigation: NavItem[];
  isActive: (path: string) => boolean;
  isSectionActive: (item: NavItem) => boolean;
  user: any;
}) => {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (sectionTitle: string) => {
    setOpenSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(t => t !== sectionTitle) 
        : [...prev, sectionTitle]
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="md:hidden fixed top-4 left-4 z-50 h-10 w-10 p-0 bg-white shadow-md border border-gray-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-[#F7FCFE] w-80">
        <div className="flex flex-col h-full">
          <SidebarHeader isExpanded={true} toggleSidebar={() => {}} className="border-b-0" />
          
            <nav className="py-4">
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.title}>
                    {!item.isDropdown ? (
                      <Link
                        href={item.path || "#"}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive(item.path || "") 
                            ? "bg-[#1F6CB6] text-white shadow-md" 
                            : "text-gray-700 hover:bg-white hover:shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "flex-shrink-0",
                          isActive(item.path || "") ? 'text-white' : 'text-gray-500'
                        )}>
                          {item.icon}
                        </div>
                        <div className="flex items-center justify-between w-full">
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <Collapsible 
                        open={openSections.includes(item.title)}
                        onOpenChange={() => toggleSection(item.title)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-between gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200 h-auto",
                              isSectionActive(item)
                                ? "bg-[#1F6CB6] text-white shadow-md"
                                : "text-gray-700 hover:bg-white hover:shadow-sm"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex-shrink-0",
                                isSectionActive(item) ? 'text-white' : 'text-gray-500'
                              )}>
                                {item.icon}
                              </div>
                              <span>{item.title}</span>
                            </div>
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              openSections.includes(item.title) ? 'rotate-180' : ''
                            )} />
                          </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="mt-1 ml-6 space-y-1">
                          {item.subItems?.map((subItem) => (
                            <Link
                              key={subItem.path}
                              href={subItem.path}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                                isActive(subItem.path)
                                  ? "bg-[#1F6CB6]/10 text-[#1F6CB6] border-l-2 border-[#1F6CB6]" 
                                  : "text-gray-600 hover:bg-white hover:shadow-sm"
                              )}
                            >
                              <div className={cn(
                                "flex-shrink-0",
                                isActive(subItem.path) ? 'text-[#1F6CB6]' : 'text-gray-400'
                              )}>
                                {subItem.icon}
                              </div>
                              <div className="flex items-center justify-between w-full">
                                <span>{subItem.title}</span>
                                {subItem.badge && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                    {subItem.badge}
                                  </Badge>
                                )}
                              </div>
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
         
          
          <SidebarFooter isExpanded={true} user={user} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Helper function to check if a path is active
  const isActive = (path: string) => pathname === path;
  const [navigation, setNavigation] = useState<NavItem[]>([]);
  
  // State to track if sidebar is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(true);
  // State to track if we're on mobile view
  const [isMobile, setIsMobile] = useState(false);
  // State to track open dropdown sections
  const [openSections, setOpenSections] = useState<string[]>([]);
  // Track whether each dropdown has been touched
  const [touchedDropdowns, setTouchedDropdowns] = useState<Set<string>>(new Set());

  // Helper function to check if a section or its subitems are active
  const isSectionActive = (item: NavItem) => {
    if (item.path && isActive(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some(subItem => isActive(subItem.path));
    }
    return false;
  };

  // Toggle section open/closed state
  const toggleSection = (sectionTitle: string) => {
    setOpenSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(t => t !== sectionTitle) 
        : [...prev, sectionTitle]
    );
  };
  
  // Handle touch events for mobile
  const handleDropdownTouch = (event: React.MouseEvent, title: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    // If we're in collapsed mode, add this dropdown to touched list
    if (!isExpanded) {
      setTouchedDropdowns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(title)) {
          newSet.delete(title);
        } else {
          newSet.add(title);
        }
        return newSet;
      });
    }
    
    // Toggle the dropdown
    toggleSection(title);
  };

  useEffect(() => {
    // Initialize open sections based on active path
    if (navigation.length > 0) {
      const activeSection = navigation.find(item => 
        item.isDropdown && item.subItems?.some(subItem => pathname?.startsWith(subItem.path))
      );
      
      if (activeSection && !openSections.includes(activeSection.title)) {
        setOpenSections(prev => [...prev, activeSection.title]);
      }
    }
  }, [navigation, pathname, openSections]);

  const toggleSidebar = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent('sidebarStateChange', {
      detail: { expanded: newExpandedState }
    }));
  };

  // Check for mobile view on initial render and window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check initially
    checkIfMobile();
    
    // Set up event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // If mobile, collapse sidebar by default
  useEffect(() => {
    if (isMobile && isExpanded) {
      setIsExpanded(false);
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('sidebarStateChange', {
        detail: { expanded: false }
      }));
    }
  }, [isMobile, isExpanded]);

  useEffect(() => {
    // Close dropdowns when transitioning from expanded to collapsed
    if (!isExpanded) {
      setOpenSections([]);
      setTouchedDropdowns(new Set());
    }
  }, [isExpanded]);

  // Navigation options for attendance management system
  const navigationOptions: NavItem[] = useMemo(() => [
    {
      title: "Profile",
      path: "/profile",
      allowedRoles: ["HR", "EMPLOYEE"],
      icon: <User className="h-5 w-5" />,
    },
    {
      title: "My Attendance",
      path: "/attendance/my-attendance",
      allowedRoles: ["HR", "EMPLOYEE"],
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Check In/Out",
      path: "/attendance/check-in-out",
      allowedRoles: ["HR", "EMPLOYEE"],
      icon: <Clock className="h-5 w-5" />,
    },
    // HR-only section
    {
      title: "HR Dashboard",
      allowedRoles: ["HR"],
      path: "/hr",
      icon: <Shield className="h-5 w-5" />,
    },
  ], []);

  // Filter navigation based on user role
  useEffect(() => {
    if (user && user.role) {
      const userRole = user.role;
      
      const filteredNavigation = navigationOptions.filter((item) => {
        // Check if user role is allowed for this menu item
        if (!item.allowedRoles.includes(userRole)) {
          return false;
        }
        
        // For dropdowns, check if any subitems are accessible
        if (item.subItems && item.subItems.length > 0) {
          const accessibleSubItems = item.subItems.filter(subItem => 
            subItem.allowedRoles.includes(userRole)
          );
          
          // Only include this dropdown if it has accessible subitems
          return accessibleSubItems.length > 0;
        }
        
        return true;
      }).map(item => {
        // If it's a dropdown, filter its subitems as well
        if (item.isDropdown && item.subItems) {
          return {
            ...item,
            subItems: item.subItems.filter(subItem => 
              subItem.allowedRoles.includes(userRole)
            )
          };
        }
        return item;
      });
      
      setNavigation(filteredNavigation);
    }
  }, [user, navigationOptions]);

  // Render a tooltip for collapsed view (both mobile and desktop)
  const renderTooltip = (title: string, element: React.ReactNode) => {
    if (isExpanded) return element;
    
    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            {element}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
            <p className="font-medium">{title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar 
        navigation={navigation} 
        isActive={isActive} 
        isSectionActive={isSectionActive} 
        user={user} 
      />

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex bg-[#F7FCFE] border-r border-gray-200 h-screen flex-col shadow-sm transition-all duration-300 ease-in-out fixed z-30",
          isExpanded ? 'w-64' : 'w-16'
        )}
      >
        {/* Header */}
        <SidebarHeader isExpanded={isExpanded} toggleSidebar={toggleSidebar} />
        
        {/* Navigation */}
          <nav className="py-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.title}>
                  <NavigationItem
                    item={item}
                    isExpanded={isExpanded}
                    isActive={isActive}
                    isSectionActive={isSectionActive}
                    openSections={openSections}
                    touchedDropdowns={touchedDropdowns}
                    handleDropdownTouch={handleDropdownTouch}
                    toggleSection={toggleSection}
                    renderTooltip={renderTooltip}
                  />
                </li>
              ))}
            </ul>
          </nav>
        
        {/* Footer */}
        <SidebarFooter isExpanded={isExpanded} user={user} />
      </aside>
    </>
  );
}