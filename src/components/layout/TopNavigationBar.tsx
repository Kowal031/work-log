import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/auth/LogoutButton";
import { Menu, User } from "lucide-react";
import { useState } from "react";

interface TopNavigationBarProps {
  currentPath: string;
  userEmail?: string;
}

export function TopNavigationBar({ currentPath, userEmail }: TopNavigationBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => currentPath === path;

  return (
    <>
      <nav className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <a href="/" className="text-xl font-bold hover:opacity-80 transition-opacity" data-testid="nav-logo">
              WorkLog
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/") ? "text-foreground" : "text-muted-foreground"
                }`}
                data-testid="nav-dashboard-link"
              >
                Pulpit
              </a>
              <a
                href="/summaries"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/summaries") ? "text-foreground" : "text-muted-foreground"
                }`}
                data-testid="nav-summaries-link"
              >
                Podsumowania
              </a>

              {/* User Section - Only for authenticated users */}
              {userEmail && (
                <div className="flex items-center gap-3 ml-4 pl-4 border-l">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="nav-user-email">
                    <User className="h-4 w-4" />
                    <span>{userEmail}</span>
                  </div>
                  <LogoutButton variant="outline" size="sm" />
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Otwórz menu"
              data-testid="nav-mobile-menu-button"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentPath={currentPath}
        userEmail={userEmail}
      />
    </>
  );
}
