import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

interface TopNavigationBarProps {
  currentPath: string;
}

export function TopNavigationBar({ currentPath }: TopNavigationBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => currentPath === path;

  return (
    <>
      <nav className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <a href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
              WorkLog
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/") ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Pulpit
              </a>
              <a
                href="/summaries"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/summaries") ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Podsumowania
              </a>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Otwórz menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} currentPath={currentPath} />
    </>
  );
}
