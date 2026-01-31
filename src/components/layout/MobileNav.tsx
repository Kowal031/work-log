import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import LogoutButton from "@/components/auth/LogoutButton";
import { BarChart3, Home, User } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  userEmail?: string;
}

export function MobileNav({ isOpen, onClose, currentPath, userEmail }: MobileNavProps) {
  const isActive = (path: string) => currentPath === path;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]" data-testid="mobile-nav-sheet">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          {/* Navigation Links */}
          <a
            href="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/") ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
            onClick={onClose}
            data-testid="mobile-nav-dashboard-link"
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">Pulpit</span>
          </a>

          <a
            href="/summaries"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/summaries") ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
            onClick={onClose}
            data-testid="mobile-nav-summaries-link"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">Podsumowania</span>
          </a>

          {/* User Section - Only for authenticated users */}
          {userEmail && (
            <>
              {/* Divider */}
              <div className="border-t my-2" />

              <div className="px-4 py-2">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground mb-3"
                  data-testid="mobile-nav-user-email"
                >
                  <User className="h-4 w-4" />
                  <span>{userEmail}</span>
                </div>
                <LogoutButton variant="outline" size="default" className="w-full" />
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
