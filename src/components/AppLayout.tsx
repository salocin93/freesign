/**
 * AppLayout Component
 * 
 * Main application layout wrapper that provides the basic structure for authenticated pages.
 * This component includes a responsive sidebar with navigation, user profile section, and main content area.
 * 
 * Features:
 * - Responsive sidebar with navigation links
 * - User profile display with avatar
 * - Logout functionality
 * - Dynamic page titles
 * - Toast notifications for user feedback
 * 
 * Props:
 * @param {React.ReactNode} children - The content to be rendered in the main area
 * 
 * Dependencies:
 * - react-router-dom: For navigation and location
 * - @/contexts/AuthContext: For user authentication
 * - @/components/ui/*: Various UI components
 * - lucide-react: For icons
 * 
 * Usage:
 * ```tsx
 * <AppLayout>
 *   <YourPageContent />
 * </AppLayout>
 * ```
 * 
 * Used in:
 * - Dashboard page
 * - Upload page
 * - Documents page
 * - Editor page
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { LayoutDashboard, Upload, FileText, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const { toast } = useToast();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Upload, label: 'Upload', path: '/upload' },
    { icon: FileText, label: 'Documents', path: '/documents' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging out",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-muted/30">
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/logo.svg" 
              alt="FreeSign Logo" 
              className="h-12 w-auto" 
            />
          </Link>
        </div>
        
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* User Profile Section */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
            <Avatar className="h-9 w-9">
              <AvatarImage 
                src={currentUser?.user_metadata?.avatar_url} 
                alt={currentUser?.user_metadata?.full_name} 
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(
                  currentUser?.user_metadata?.full_name,
                  currentUser?.email
                )}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate flex-1">
              {currentUser?.user_metadata?.full_name || currentUser?.email}
            </span>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start mt-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2.5" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center justify-between px-6">
          <h1 className="text-lg font-medium">
            {location.pathname === '/dashboard' && 'Dashboard'}
            {location.pathname === '/upload' && 'Upload Document'}
            {location.pathname === '/documents' && 'All Documents'}
            {location.pathname === '/editor' && 'Document Editor'}
          </h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
