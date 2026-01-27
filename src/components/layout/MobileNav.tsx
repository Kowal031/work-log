import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BarChart3, Home } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

export function MobileNav({ isOpen, onClose, currentPath }: MobileNavProps) {
  const isActive = (path: string) => currentPath === path;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
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
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">Podsumowania</span>
          </a>

          {/* Divider */}
          <div className="border-t my-2" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
