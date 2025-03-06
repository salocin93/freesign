import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 transition-all duration-300 hover:opacity-80">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              FreeSign
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-foreground/80 hover:text-foreground transition-colors duration-200"
            >
              Home
            </Link>
            <Link 
              to="/editor" 
              className="text-foreground/80 hover:text-foreground transition-colors duration-200"
            >
              Documents
            </Link>
          </nav>
        </div>
      </header>
      <main className={cn("flex-1 container mx-auto px-4 py-8", className)}>
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
      <footer className="py-6 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} FreeSign. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
