"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/utils/regex";
import { WarningModal } from "./warning-modal";
import { usePathname } from "next/navigation";
import { LogOut, Clock, User, Shield, Calendar } from "lucide-react";
import { useAuth } from "../../app/context/AuthContext";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Listen for sidebar expansion state changes
  useEffect(() => {
    const handleSidebarStateChange = (event: CustomEvent) => {
      setSidebarExpanded(event.detail.expanded);
    };

    window.addEventListener('sidebarStateChange' as any, handleSidebarStateChange as any);

    return () => {
      window.removeEventListener('sidebarStateChange' as any, handleSidebarStateChange as any);
    };
  }, []);

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false);
    logout();
  };

  // Get page title from pathname
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    
    if (segments.length === 0 || segments[0] === 'dashboard') {
      return 'Dashboard';
    }
    
    // Handle nested routes
    if (segments[0] === 'attendance') {
      if (segments[1] === 'my-attendance') return 'My Attendance';
      if (segments[1] === 'check-in-out') return 'Check In/Out';
      if (segments[1] === 'leave-requests') return 'Leave Requests';
      return 'Attendance';
    }
    
    if (segments[0] === 'hr') {
      if (segments[1] === 'employees') return 'Employee Management';
      if (segments[1] === 'attendance-reports') return 'Attendance Reports';
      if (segments[1] === 'leave-management') return 'Leave Management';
      if (segments[1] === 'settings') return 'System Settings';
      return 'HR Dashboard';
    }
    
    if (segments[0] === 'profile') return 'Profile';
    
    // Capitalize first letter for other routes
    return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
  };

  // Get appropriate icon for the current page
  const getPageIcon = () => {
    const segments = pathname.split('/').filter(Boolean);
    
    if (segments.length === 0 || segments[0] === 'dashboard') {
      return <Clock className="h-5 w-5" />;
    }
    
    if (segments[0] === 'attendance') {
      return <Clock className="h-5 w-5" />;
    }
    
    if (segments[0] === 'hr') {
      return <Shield className="h-5 w-5" />;
    }
    
    if (segments[0] === 'profile') {
      return <User className="h-5 w-5" />;
    }
    
    return <Calendar className="h-5 w-5" />;
  };

  // Get role display name
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'HR':
        return 'Human Resources';
      case 'EMPLOYEE':
        return 'Employee';
      default:
        return role;
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'HR':
        return 'text-purple-600 bg-purple-100';
      case 'EMPLOYEE':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <>
      <header
        className={cn(
          `fixed top-0 ${sidebarExpanded ? 'left-64' : 'left-16'} right-0 z-30`,
          "bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200",
          "flex items-center justify-between px-6 py-4 transition-all duration-300",
          className
        )}
      >
        {/* Page Title Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-gray-900">
            {getPageIcon()}
            <div>
              <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          {/* User Info */}
          {user && (
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.employeeId}
                </p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    getRoleColor(user.role)
                  )}>
                    {getRoleDisplay(user.role)}
                  </span>
                </div>
              </div>
              
              {/* User Avatar */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          )}

          {/* Mobile User Info */}
          {user && (
            <div className="md:hidden flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                getRoleColor(user.role)
              )}>
                {user.role}
              </span>
            </div>
          )}

          {/* Logout Button */}
          <Button 
            onClick={() => setShowLogoutDialog(true)} 
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <WarningModal
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onDelete={handleLogoutConfirm}
        title="Confirm Logout"
        description="Are you sure you want to logout? You will need to login again to access the AMS."
      />
    </>
  );
}