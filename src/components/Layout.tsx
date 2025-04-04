import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, FileText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 transition-all duration-300 hover:opacity-80">
            <img 
              src="/logo.svg" 
              alt="FreeSign Logo" 
              className="h-12 w-auto" 
            />
          </Link>
          <div className="flex items-center">
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full h-8 w-8 p-0">
                    <Avatar>
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
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/documents" className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      My Documents
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link to="/login">Log in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className={cn("flex-1 container mx-auto px-4 py-8", className)}>
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
      <footer className="py-6 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <Link to="/code-of-conduct" className="hover:text-foreground transition-colors">
              Code of Conduct
            </Link>
            <span> 2025 FreeSign - Open Source under MIT License</span>
            <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer" className="h-5">
              <img 
                src="https://www.netlify.com/v3/img/components/netlify-color-bg.svg" 
                alt="Deploys by Netlify" 
                className="h-full"
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
