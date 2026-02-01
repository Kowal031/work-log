import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error in URL params (from failed token verification)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setError(urlError);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Wszystkie pola są wymagane");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Nieprawidłowy format adresu email");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        setError(data.message || "Wystąpił błąd podczas logowania");
        return;
      }

      // Success - redirect to home page
      window.location.href = data.redirectUrl || "/";
    } catch (err) {
      console.error("Login error:", err);
      setError("Wystąpił błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md" data-testid="login-card">
      <CardHeader>
        <CardTitle className="text-2xl" data-testid="login-card-title">
          Logowanie
        </CardTitle>
        <CardDescription data-testid="login-card-description">Wprowadź swoje dane, aby się zalogować</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4 mt-4">
          {error && (
            <div
              className="bg-destructive/10 border border-destructive rounded-lg p-3"
              data-testid="login-error-message"
            >
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              data-testid="login-email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              className="mb-0"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              data-testid="login-password-input"
            />
            <div className="text-sm">
              <a
                href="/password-recovery"
                className="text-primary hover:underline"
                data-testid="login-forgot-password-link"
              >
                Zapomniałeś hasła?
              </a>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-4">
          <Button type="submit" className="w-full" disabled={isLoading} data-testid="login-submit-button">
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Nie masz konta?{" "}
            <a href="/register" className="text-primary hover:underline" data-testid="login-register-link">
              Zarejestruj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
