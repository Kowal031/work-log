import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function LogoutButton({ variant = "ghost", size = "default", className }: LogoutButtonProps) {
  const handleLogout = async () => {
    try {
      // TODO: Implementacja wysyłki do /api/auth/logout
      console.log("Logout attempt");

      // Po wylogowaniu przekieruj na stronę logowania
      // window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleLogout} className={className}>
      <LogOut className="h-4 w-4 mr-2" />
      Wyloguj
    </Button>
  );
}
