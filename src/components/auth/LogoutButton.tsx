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

      // Redirect is handled by the API endpoint
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Logout error:", err);
      setIsLoading(false);
      // Still redirect on error to ensure user is logged out
      window.location.href = "/auth/login";
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleLogout} className={className} disabled={isLoading}>
      <LogOut className="h-4 w-4 mr-2" />
      {isLoading ? "Wylogowywanie..." : "Wyloguj"}
    </Button>
  );
}
