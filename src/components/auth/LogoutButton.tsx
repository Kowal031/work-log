import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function LogoutButton({ variant = "ghost", size = "default", className }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Logout error:", errorData);
        throw new Error(errorData.error || "Logout failed");
      }

      // Success - redirect will happen in finally
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Always redirect after logout attempt
      window.location.href = "/login";
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      className={className}
      disabled={isLoading}
      data-testid="nav-logout-button"
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isLoading ? "Wylogowywanie..." : "Wyloguj"}
    </Button>
  );
}
